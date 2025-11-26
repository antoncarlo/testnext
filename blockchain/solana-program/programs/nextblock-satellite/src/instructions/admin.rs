// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;
use crate::state::ProgramState;
use crate::errors::NextBlockError;

// ============================================
// EVENTS
// ============================================

#[event]
pub struct AdminUpdated {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultAddressUpdated {
    pub old_address: [u8; 32],
    pub new_address: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct ProgramPaused {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProgramUnpaused {
    pub admin: Pubkey,
    pub timestamp: i64,
}

// ============================================
// UPDATE ADMIN
// ============================================

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
        has_one = admin @ NextBlockError::Unauthorized
    )]
    pub state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
}

pub fn update_admin(
    ctx: Context<UpdateAdmin>,
    new_admin: Pubkey,
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let clock = Clock::get()?;
    let old_admin = state.admin;
    
    state.admin = new_admin;
    
    emit!(AdminUpdated {
        old_admin,
        new_admin,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Admin updated from {} to {}", old_admin, new_admin);
    
    Ok(())
}

// ============================================
// UPDATE VAULT ADDRESS
// ============================================

#[derive(Accounts)]
pub struct UpdateVaultAddress<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
        has_one = admin @ NextBlockError::Unauthorized
    )]
    pub state: Account<'info, ProgramState>,
    
    pub admin: Signer<'info>,
}

pub fn update_vault_address(
    ctx: Context<UpdateVaultAddress>,
    new_vault_address: [u8; 32],
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let clock = Clock::get()?;
    let old_address = state.base_vault_address;
    
    state.base_vault_address = new_vault_address;
    
    emit!(VaultAddressUpdated {
        old_address,
        new_address: new_vault_address,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Vault address updated");
    msg!("Old: {:?}", old_address);
    msg!("New: {:?}", new_vault_address);
    
    Ok(())
}

// ============================================
// PAUSE
// ============================================

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
        has_one = admin @ NextBlockError::Unauthorized
    )]
    pub state: Account<'info, ProgramState>,
    
    pub admin: Signer<'info>,
}

pub fn pause(ctx: Context<Pause>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let clock = Clock::get()?;
    
    state.paused = true;
    
    emit!(ProgramPaused {
        admin: state.admin,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Program paused by admin");
    
    Ok(())
}

// ============================================
// UNPAUSE
// ============================================

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
        has_one = admin @ NextBlockError::Unauthorized
    )]
    pub state: Account<'info, ProgramState>,
    
    pub admin: Signer<'info>,
}

pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let clock = Clock::get()?;
    
    state.paused = false;
    
    emit!(ProgramUnpaused {
        admin: state.admin,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Program unpaused by admin");
    
    Ok(())
}
