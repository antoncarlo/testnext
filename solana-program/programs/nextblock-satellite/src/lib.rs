// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod instructions;
pub mod state;
pub mod errors;

/// NextBlock Satellite Program
///
/// This program enables cross-chain deposits from Solana to Base via Circle CCTP.
/// Users deposit USDC on Solana, and the program bridges it to the NextBlockVault on Base.
///
/// Core functionalities:
/// - Initialize program state with admin authority
/// - Deposit USDC and bridge to Base via CCTP
/// - Receive messages from Base for withdrawals (future)
/// - Emergency pause and admin functions
///
/// Architecture:
/// - Uses Circle CCTP for secure cross-chain USDC transfers
/// - Integrates with CCTPReceiver on Base for automatic vault deposits
/// - PDA (Program Derived Address) for secure token custody
/// - Event emission for off-chain tracking
///
/// Security:
/// - Admin-only functions for critical operations
/// - PDA-based token authority
/// - CCTP message verification
/// - Emergency pause capability
#[program]
pub mod nextblock_satellite {
    use super::*;

    /// Initializes the program state
    ///
    /// Sets the initial admin authority and configuration.
    /// Can only be called once during program deployment.
    ///
    /// # Arguments
    /// - `ctx`: Context for Initialize
    /// - `base_vault_address`: Address of NextBlockVault on Base (as bytes32)
    pub fn initialize(
        ctx: Context<Initialize>,
        base_vault_address: [u8; 32],
    ) -> Result<()> {
        instructions::initialize::initialize(ctx, base_vault_address)
    }

    /// Deposits USDC and bridges to Base via CCTP
    ///
    /// User deposits USDC on Solana, program burns it via CCTP,
    /// and sends a message to Base for automatic deposit in NextBlockVault.
    ///
    /// # Arguments
    /// - `ctx`: Context for DepositAndBridge
    /// - `amount`: Amount of USDC to deposit (6 decimals)
    /// - `recipient`: Address on Base that will receive vault shares
    pub fn deposit_and_bridge(
        ctx: Context<DepositAndBridge>,
        amount: u64,
        recipient: [u8; 20], // Ethereum address (20 bytes)
    ) -> Result<()> {
        instructions::deposit::deposit_and_bridge(ctx, amount, recipient)
    }

    /// Updates the admin authority
    ///
    /// Only the current admin can update to a new admin.
    ///
    /// # Arguments
    /// - `ctx`: Context for UpdateAdmin
    /// - `new_admin`: Public key of the new admin
    pub fn update_admin(
        ctx: Context<UpdateAdmin>,
        new_admin: Pubkey,
    ) -> Result<()> {
        instructions::admin::update_admin(ctx, new_admin)
    }

    /// Updates the Base vault address
    ///
    /// Only admin can update the target vault address on Base.
    ///
    /// # Arguments
    /// - `ctx`: Context for UpdateVaultAddress
    /// - `new_vault_address`: New vault address on Base (as bytes32)
    pub fn update_vault_address(
        ctx: Context<UpdateVaultAddress>,
        new_vault_address: [u8; 32],
    ) -> Result<()> {
        instructions::admin::update_vault_address(ctx, new_vault_address)
    }

    /// Pauses the program
    ///
    /// Only admin can pause. When paused, deposits are disabled.
    ///
    /// # Arguments
    /// - `ctx`: Context for Pause
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::admin::pause(ctx)
    }

    /// Unpauses the program
    ///
    /// Only admin can unpause.
    ///
    /// # Arguments
    /// - `ctx`: Context for Unpause
    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::admin::unpause(ctx)
    }
}
