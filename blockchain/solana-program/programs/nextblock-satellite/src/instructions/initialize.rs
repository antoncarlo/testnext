// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;
use crate::state::ProgramState;

#[event]
pub struct ProgramInitialized {
    pub admin: Pubkey,
    pub base_vault_address: [u8; 32],
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Program state account to be initialized
    #[account(
        init,
        payer = admin,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,
    
    /// Admin account that will have full control
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// System program for account creation
    pub system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    base_vault_address: [u8; 32],
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let clock = Clock::get()?;
    
    // Initialize state
    state.admin = ctx.accounts.admin.key();
    state.base_vault_address = base_vault_address;
    state.paused = false;
    state.total_deposits = 0;
    state.deposit_count = 0;
    state.bump = ctx.bumps.state;
    
    // Emit event
    emit!(ProgramInitialized {
        admin: state.admin,
        base_vault_address: state.base_vault_address,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("NextBlock Satellite initialized");
    msg!("Admin: {}", state.admin);
    msg!("Base Vault: {:?}", state.base_vault_address);
    
    Ok(())
}
