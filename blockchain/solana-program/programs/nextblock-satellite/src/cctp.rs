// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;

// ============================================
// CIRCLE CCTP PROGRAM IDS
// ============================================

#[cfg(feature = "mainnet")]
pub const TOKEN_MESSENGER: Pubkey = pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

#[cfg(feature = "mainnet")]
pub const MESSAGE_TRANSMITTER: Pubkey = pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

#[cfg(not(feature = "mainnet"))]
pub const TOKEN_MESSENGER: Pubkey = pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

#[cfg(not(feature = "mainnet"))]
pub const MESSAGE_TRANSMITTER: Pubkey = pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

// ============================================
// DESTINATION DOMAINS
// ============================================

pub const DOMAIN_ETHEREUM: u32 = 0;
pub const DOMAIN_AVALANCHE: u32 = 1;
pub const DOMAIN_OPTIMISM: u32 = 2;
pub const DOMAIN_ARBITRUM: u32 = 3;
pub const DOMAIN_BASE: u32 = 6;
pub const DOMAIN_POLYGON: u32 = 7;

// ============================================
// MESSAGE FORMAT
// ============================================

pub const MESSAGE_BODY_VERSION: u32 = 0;

/// Message body per CCTP
/// 
/// Questo messaggio viene inviato a Base e decodificato da CCTPReceiver.sol
/// 
/// Formato:
/// - version (4 bytes): Versione del formato messaggio
/// - recipient (20 bytes): Indirizzo Ethereum destinatario
/// - amount (8 bytes): Importo USDC (6 decimali)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CCTPMessageBody {
    /// Versione del formato messaggio
    pub version: u32,
    
    /// Indirizzo destinatario su Base (20 bytes)
    pub recipient: [u8; 20],
    
    /// Importo USDC (con 6 decimali)
    pub amount: u64,
}

impl CCTPMessageBody {
    /// Crea un nuovo message body
    pub fn new(recipient: [u8; 20], amount: u64) -> Self {
        Self {
            version: MESSAGE_BODY_VERSION,
            recipient,
            amount,
        }
    }
    
    /// Serializza in bytes per CCTP
    /// 
    /// Formato:
    /// [0-3]: version (big-endian u32)
    /// [4-23]: recipient (20 bytes)
    /// [24-31]: amount (big-endian u64)
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(32);
        bytes.extend_from_slice(&self.version.to_be_bytes());
        bytes.extend_from_slice(&self.recipient);
        bytes.extend_from_slice(&self.amount.to_be_bytes());
        bytes
    }
    
    /// Deserializza da bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        require!(bytes.len() >= 32, ErrorCode::InvalidMessageBody);
        
        let version = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
        
        let mut recipient = [0u8; 20];
        recipient.copy_from_slice(&bytes[4..24]);
        
        let amount = u64::from_be_bytes([
            bytes[24], bytes[25], bytes[26], bytes[27],
            bytes[28], bytes[29], bytes[30], bytes[31],
        ]);
        
        Ok(Self {
            version,
            recipient,
            amount,
        })
    }
}

// ============================================
// CCTP ACCOUNT DERIVATION
// ============================================

/// Deriva Token Messenger PDA
pub fn derive_token_messenger_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"token_messenger"], program_id)
}

/// Deriva Message Transmitter PDA
pub fn derive_message_transmitter_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"message_transmitter"], program_id)
}

/// Deriva Token Minter PDA
pub fn derive_token_minter_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"token_minter"], program_id)
}

/// Deriva Local Token PDA (USDC)
pub fn derive_local_token_pda(program_id: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"local_token", mint.as_ref()], program_id)
}

// ============================================
// REMOTE TOKEN MESSENGER ADDRESSES
// ============================================

/// Token Messenger su Base (mainnet)
/// 
/// Questo è l'indirizzo del contratto TokenMessenger di Circle su Base.
/// Viene usato come destinazione per i messaggi CCTP.
pub const REMOTE_TOKEN_MESSENGER_BASE_MAINNET: [u8; 32] = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x16, 0x82, 0xAe, 0x63,
    0x75, 0xC4, 0xE4, 0xA9, 0x7e, 0x4B, 0x58, 0x3B,
    0xC3, 0x94, 0xc8, 0x61, 0xA4, 0x6D, 0x89, 0x62,
];

/// Token Messenger su Base (testnet - Sepolia)
pub const REMOTE_TOKEN_MESSENGER_BASE_TESTNET: [u8; 32] = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x78, 0x65, 0xfA, 0xfC,
    0x2d, 0xb2, 0x09, 0x36, 0x69, 0xd9, 0x2c, 0x0F,
    0x33, 0xAe, 0xEF, 0x29, 0x10, 0x86, 0xBE, 0xFD,
];

/// Ottieni Remote Token Messenger per l'ambiente corrente
#[cfg(feature = "mainnet")]
pub fn get_remote_token_messenger_base() -> [u8; 32] {
    REMOTE_TOKEN_MESSENGER_BASE_MAINNET
}

#[cfg(not(feature = "mainnet"))]
pub fn get_remote_token_messenger_base() -> [u8; 32] {
    REMOTE_TOKEN_MESSENGER_BASE_TESTNET
}

// ============================================
// ERRORS
// ============================================

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid message body format")]
    InvalidMessageBody,
    
    #[msg("Invalid destination domain")]
    InvalidDestinationDomain,
    
    #[msg("Invalid remote token messenger")]
    InvalidRemoteTokenMessenger,
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_message_body_serialization() {
        let recipient = [1u8; 20];
        let amount = 100_000_000u64;
        
        let message = CCTPMessageBody::new(recipient, amount);
        let bytes = message.to_bytes();
        
        assert_eq!(bytes.len(), 32);
        
        let deserialized = CCTPMessageBody::from_bytes(&bytes).unwrap();
        assert_eq!(deserialized.version, MESSAGE_BODY_VERSION);
        assert_eq!(deserialized.recipient, recipient);
        assert_eq!(deserialized.amount, amount);
    }
    
    #[test]
    fn test_message_body_roundtrip() {
        let recipient = [0xab; 20];
        let amount = 1_234_567_890u64;
        
        let original = CCTPMessageBody::new(recipient, amount);
        let bytes = original.to_bytes();
        let decoded = CCTPMessageBody::from_bytes(&bytes).unwrap();
        
        assert_eq!(original.version, decoded.version);
        assert_eq!(original.recipient, decoded.recipient);
        assert_eq!(original.amount, decoded.amount);
    }
}
