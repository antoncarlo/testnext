// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;

/// Program state for NextBlock Satellite
///
/// Stores global configuration and admin authority.
///
/// # Fields
/// - `admin`: Public key of the admin with full control
/// - `base_vault_address`: Address of NextBlockVault on Base (bytes32)
/// - `paused`: Whether deposits are currently paused
/// - `total_deposits`: Total USDC deposited through this program
/// - `deposit_count`: Number of deposits processed
/// - `bump`: Bump seed for PDA derivation
#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub admin: Pubkey,
    pub base_vault_address: [u8; 32],
    pub paused: bool,
    pub total_deposits: u64,
    pub deposit_count: u64,
    pub bump: u8,
}

/// Deposit record for tracking individual deposits
///
/// Stores information about each deposit for off-chain tracking.
///
/// # Fields
/// - `deposit_id`: Unique identifier for this deposit
/// - `user`: Solana address of the depositor
/// - `recipient`: Base address that will receive vault shares
/// - `amount`: Amount of USDC deposited
/// - `timestamp`: Unix timestamp of the deposit
/// - `cctp_nonce`: CCTP message nonce for tracking
/// - `status`: Current status of the deposit
#[account]
#[derive(InitSpace)]
pub struct DepositRecord {
    pub deposit_id: u64,
    pub user: Pubkey,
    pub recipient: [u8; 20],
    pub amount: u64,
    pub timestamp: i64,
    pub cctp_nonce: u64,
    pub status: DepositStatus,
}

/// Status of a deposit
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DepositStatus {
    /// Deposit initiated, CCTP message sent
    Pending,
    /// Deposit confirmed on Base
    Confirmed,
    /// Deposit failed
    Failed,
}

impl Default for DepositStatus {
    fn default() -> Self {
        DepositStatus::Pending
    }
}
