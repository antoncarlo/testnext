// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;

#[error_code]
pub enum NextBlockError {
    #[msg("Program is currently paused")]
    ProgramPaused,
    
    #[msg("Deposit amount must be greater than zero")]
    InvalidAmount,
    
    #[msg("Deposit amount is below minimum required")]
    AmountTooLow,
    
    #[msg("Deposit amount exceeds maximum allowed")]
    AmountTooHigh,
    
    #[msg("Unauthorized: Only admin can perform this action")]
    Unauthorized,
    
    #[msg("Invalid recipient address")]
    InvalidRecipient,
    
    #[msg("CCTP message transmission failed")]
    CCTPTransmissionFailed,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid CCTP nonce")]
    InvalidNonce,
}
