// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Burn};
use crate::state::{ProgramState, DepositRecord, DepositStatus};
use crate::errors::NextBlockError;

/// Minimum deposit amount (10 USDC)
pub const MIN_DEPOSIT: u64 = 10_000_000; // 6 decimals

/// Maximum deposit amount (1M USDC)
pub const MAX_DEPOSIT: u64 = 1_000_000_000_000; // 6 decimals

#[event]
pub struct DepositInitiated {
    pub deposit_id: u64,
    pub user: Pubkey,
    pub recipient: [u8; 20],
    pub amount: u64,
    pub cctp_nonce: u64,
    pub timestamp: i64,
}

#[derive(Accounts)]
#[instruction(amount: u64, recipient: [u8; 20])]
pub struct DepositAndBridge<'info> {
    /// Program state
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, ProgramState>,
    
    /// Deposit record to track this deposit
    #[account(
        init,
        payer = user,
        space = 8 + DepositRecord::INIT_SPACE,
        seeds = [b"deposit", state.deposit_count.to_le_bytes().as_ref()],
        bump
    )]
    pub deposit_record: Account<'info, DepositRecord>,
    
    /// User's USDC token account
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,
    
    /// Program's USDC token account (PDA)
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = program_authority,
    )]
    pub program_usdc_account: Account<'info, TokenAccount>,
    
    /// Program authority PDA
    #[account(
        seeds = [b"authority"],
        bump
    )]
    /// CHECK: PDA used as token authority
    pub program_authority: AccountInfo<'info>,
    
    /// USDC mint
    #[account(
        constraint = usdc_mint.key() == anchor_spl::token::spl_token::native_mint::id() @ NextBlockError::InvalidAmount
    )]
    pub usdc_mint: Account<'info, Mint>,
    
    /// User making the deposit
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

pub fn deposit_and_bridge(
    ctx: Context<DepositAndBridge>,
    amount: u64,
    recipient: [u8; 20],
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let deposit_record = &mut ctx.accounts.deposit_record;
    let clock = Clock::get()?;
    
    // Validations
    require!(!state.paused, NextBlockError::ProgramPaused);
    require!(amount > 0, NextBlockError::InvalidAmount);
    require!(amount >= MIN_DEPOSIT, NextBlockError::AmountTooLow);
    require!(amount <= MAX_DEPOSIT, NextBlockError::AmountTooHigh);
    
    // Check recipient is not zero address
    let is_zero = recipient.iter().all(|&b| b == 0);
    require!(!is_zero, NextBlockError::InvalidRecipient);
    
    // Transfer USDC from user to program
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.program_usdc_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // In a real implementation, here we would:
    // 1. Call Circle CCTP TokenMessenger to burn USDC
    // 2. Send cross-chain message with recipient and amount
    // 3. Get CCTP nonce from the message
    //
    // For now, we simulate this with a placeholder nonce
    // TODO: Integrate real Circle CCTP SDK
    let cctp_nonce = state.deposit_count;
    
    // Update deposit record
    deposit_record.deposit_id = state.deposit_count;
    deposit_record.user = ctx.accounts.user.key();
    deposit_record.recipient = recipient;
    deposit_record.amount = amount;
    deposit_record.timestamp = clock.unix_timestamp;
    deposit_record.cctp_nonce = cctp_nonce;
    deposit_record.status = DepositStatus::Pending;
    
    // Update state
    state.total_deposits = state.total_deposits
        .checked_add(amount)
        .ok_or(NextBlockError::ArithmeticOverflow)?;
    state.deposit_count = state.deposit_count
        .checked_add(1)
        .ok_or(NextBlockError::ArithmeticOverflow)?;
    
    // Emit event
    emit!(DepositInitiated {
        deposit_id: deposit_record.deposit_id,
        user: deposit_record.user,
        recipient: deposit_record.recipient,
        amount: deposit_record.amount,
        cctp_nonce: deposit_record.cctp_nonce,
        timestamp: deposit_record.timestamp,
    });
    
    msg!("Deposit initiated");
    msg!("Deposit ID: {}", deposit_record.deposit_id);
    msg!("Amount: {} USDC", amount as f64 / 1_000_000.0);
    msg!("Recipient: {:?}", recipient);
    msg!("CCTP Nonce: {}", cctp_nonce);
    
    Ok(())
}

/// NOTE: CCTP Integration
///
/// To complete the CCTP integration, you need to:
///
/// 1. Add Circle CCTP program as a dependency:
///    - TokenMessenger program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
///    - MessageTransmitter program ID: CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd
///
/// 2. In the DepositAndBridge accounts, add:
///    - token_messenger: Circle's TokenMessenger program
///    - message_transmitter: Circle's MessageTransmitter program
///    - remote_token_messenger: TokenMessenger on destination chain (Base)
///    - cctp_message_sent_event_data: Account to store CCTP event data
///
/// 3. In deposit_and_bridge function, replace the transfer with:
///    a) Call depositForBurn on TokenMessenger to burn USDC
///    b) This will emit a MessageSent event with nonce
///    c) Use this nonce to track the cross-chain message
///
/// 4. The message body should encode:
///    - recipient address (20 bytes)
///    - amount (32 bytes)
///    - This will be decoded by CCTPReceiver on Base
///
/// 5. Circle's attestation service will:
///    - Observe the burn on Solana
///    - Generate an attestation
///    - The attestation can be used to mint USDC on Base
///    - CCTPReceiver will automatically receive and process it
///
/// Example CCTP call structure:
/// ```rust
/// let cpi_accounts = DepositForBurn {
///     owner: ctx.accounts.user.to_account_info(),
///     event_rent_payer: ctx.accounts.user.to_account_info(),
///     sender_authority_pda: ctx.accounts.program_authority.to_account_info(),
///     burn_token_account: ctx.accounts.program_usdc_account.to_account_info(),
///     message_transmitter: ctx.accounts.message_transmitter.to_account_info(),
///     token_messenger: ctx.accounts.token_messenger.to_account_info(),
///     remote_token_messenger: ctx.accounts.remote_token_messenger.to_account_info(),
///     token_minter: ctx.accounts.token_minter.to_account_info(),
///     local_token: ctx.accounts.usdc_mint.to_account_info(),
///     burn_token_mint: ctx.accounts.usdc_mint.to_account_info(),
///     // ... other accounts
/// };
/// ```
///
/// For complete CCTP integration guide, see:
/// https://developers.circle.com/stablecoins/docs/cctp-protocol-contract
