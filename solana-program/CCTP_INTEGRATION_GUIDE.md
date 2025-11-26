# Guida Completa Integrazione Circle CCTP su Solana

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.  
**Data**: 26 Novembre 2025

## Panoramica

Questa guida fornisce le modifiche precise da apportare al programma NextBlockSatellite per completare l'integrazione con Circle CCTP (Cross-Chain Transfer Protocol).

## Architettura CCTP

Circle CCTP permette di bruciare USDC su una chain (Solana) e mintarlo su un'altra (Base) in modo sicuro e nativo.

### Flusso CCTP

```
1. User → NextBlockSatellite: deposit_and_bridge(amount, recipient)
2. NextBlockSatellite → TokenMessenger: depositForBurn(amount, destination, recipient)
3. TokenMessenger → TokenMinter: burn USDC
4. TokenMessenger → MessageTransmitter: sendMessage(message)
5. Circle Attestation Service: osserva burn e genera attestation
6. Base: MessageTransmitter riceve attestation
7. Base: TokenMessenger minta USDC
8. Base: CCTPReceiver riceve USDC e deposita nel vault
```

## Program IDs CCTP

### Solana Mainnet

```rust
// Circle Token Messenger
pub const TOKEN_MESSENGER_MAINNET: Pubkey = 
    pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

// Circle Message Transmitter
pub const MESSAGE_TRANSMITTER_MAINNET: Pubkey = 
    pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

// USDC Mint
pub const USDC_MINT_MAINNET: Pubkey = 
    pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
```

### Solana Devnet

```rust
// Circle Token Messenger
pub const TOKEN_MESSENGER_DEVNET: Pubkey = 
    pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

// Circle Message Transmitter  
pub const MESSAGE_TRANSMITTER_DEVNET: Pubkey = 
    pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

// USDC Mint
pub const USDC_MINT_DEVNET: Pubkey = 
    pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
```

### Base Chain

```
// Domain ID per Base
DESTINATION_DOMAIN_BASE = 6

// CCTPReceiver address (il nostro contratto su Base)
// Questo sarà l'indirizzo deployato del CCTPReceiver.sol
```

## Modifiche da Apportare

### 1. Aggiungere Costanti CCTP

Crea un nuovo file `src/cctp.rs`:

```rust
// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;

// Circle CCTP Program IDs
#[cfg(feature = "mainnet")]
pub const TOKEN_MESSENGER: Pubkey = 
    pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

#[cfg(feature = "mainnet")]
pub const MESSAGE_TRANSMITTER: Pubkey = 
    pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

#[cfg(not(feature = "mainnet"))]
pub const TOKEN_MESSENGER: Pubkey = 
    pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

#[cfg(not(feature = "mainnet"))]
pub const MESSAGE_TRANSMITTER: Pubkey = 
    pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

// Destination domains
pub const DOMAIN_ETHEREUM: u32 = 0;
pub const DOMAIN_AVALANCHE: u32 = 1;
pub const DOMAIN_OPTIMISM: u32 = 2;
pub const DOMAIN_ARBITRUM: u32 = 3;
pub const DOMAIN_BASE: u32 = 6;
pub const DOMAIN_POLYGON: u32 = 7;

// Message format version
pub const MESSAGE_BODY_VERSION: u32 = 0;
```

### 2. Aggiungere Strutture Dati CCTP

Aggiungi in `src/cctp.rs`:

```rust
/// Message body per CCTP
/// Questo viene inviato a Base e decodificato da CCTPReceiver
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CCTPMessageBody {
    /// Versione del formato messaggio
    pub version: u32,
    /// Indirizzo destinatario su Base (20 bytes)
    pub recipient: [u8; 20],
    /// Importo USDC (con 6 decimali)
    pub amount: u64,
}

impl CCTPMessageBody {
    pub fn new(recipient: [u8; 20], amount: u64) -> Self {
        Self {
            version: MESSAGE_BODY_VERSION,
            recipient,
            amount,
        }
    }
    
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&self.version.to_be_bytes());
        bytes.extend_from_slice(&self.recipient);
        bytes.extend_from_slice(&self.amount.to_be_bytes());
        bytes
    }
}

/// Account per depositForBurn CPI
#[derive(Accounts)]
pub struct DepositForBurnAccounts<'info> {
    /// CHECK: Token Messenger program
    pub token_messenger_program: AccountInfo<'info>,
    
    /// CHECK: Message Transmitter program
    pub message_transmitter_program: AccountInfo<'info>,
    
    /// CHECK: Token Messenger account
    pub token_messenger: AccountInfo<'info>,
    
    /// CHECK: Message Transmitter account
    pub message_transmitter: AccountInfo<'info>,
    
    /// CHECK: Token Minter account
    pub token_minter: AccountInfo<'info>,
    
    /// CHECK: Local token (USDC) account
    pub local_token: AccountInfo<'info>,
    
    /// Token account da cui bruciare USDC
    pub burn_token_account: AccountInfo<'info>,
    
    /// CHECK: Remote token messenger (su Base)
    pub remote_token_messenger: AccountInfo<'info>,
    
    /// CHECK: Authority PDA
    pub authority_pda: AccountInfo<'info>,
    
    /// CHECK: Event rent payer
    pub event_rent_payer: AccountInfo<'info>,
}
```

### 3. Modificare deposit.rs

Sostituisci completamente il file `src/instructions/deposit.rs`:

```rust
// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::Instruction,
    program::invoke_signed,
};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{ProgramState, DepositRecord, DepositStatus};
use crate::errors::NextBlockError;
use crate::cctp::{
    TOKEN_MESSENGER, MESSAGE_TRANSMITTER, DOMAIN_BASE,
    CCTPMessageBody,
};

pub const MIN_DEPOSIT: u64 = 10_000_000;
pub const MAX_DEPOSIT: u64 = 1_000_000_000_000;

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
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, ProgramState>,
    
    #[account(
        init,
        payer = user,
        space = 8 + DepositRecord::INIT_SPACE,
        seeds = [b"deposit", state.deposit_count.to_le_bytes().as_ref()],
        bump
    )]
    pub deposit_record: Account<'info, DepositRecord>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = program_authority,
    )]
    pub program_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"authority"],
        bump
    )]
    /// CHECK: PDA used as token authority
    pub program_authority: AccountInfo<'info>,
    
    pub usdc_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    // ============================================
    // CCTP ACCOUNTS
    // ============================================
    
    /// CHECK: Circle Token Messenger program
    #[account(address = TOKEN_MESSENGER)]
    pub token_messenger_program: AccountInfo<'info>,
    
    /// CHECK: Circle Message Transmitter program
    #[account(address = MESSAGE_TRANSMITTER)]
    pub message_transmitter_program: AccountInfo<'info>,
    
    /// CHECK: Token Messenger account
    pub token_messenger: AccountInfo<'info>,
    
    /// CHECK: Message Transmitter account
    pub message_transmitter: AccountInfo<'info>,
    
    /// CHECK: Token Minter account
    pub token_minter: AccountInfo<'info>,
    
    /// CHECK: Remote Token Messenger (Base)
    pub remote_token_messenger: AccountInfo<'info>,
    
    /// CHECK: Message sent event data account
    #[account(mut)]
    pub message_sent_event_data: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
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
    
    let is_zero = recipient.iter().all(|&b| b == 0);
    require!(!is_zero, NextBlockError::InvalidRecipient);
    
    // Transfer USDC from user to program
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.program_usdc_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    token::transfer(cpi_ctx, amount)?;
    
    // ============================================
    // CCTP DEPOSIT FOR BURN
    // ============================================
    
    // Crea message body
    let message_body = CCTPMessageBody::new(recipient, amount);
    let message_bytes = message_body.to_bytes();
    
    // Prepara instruction per depositForBurn
    // Nota: Questo è un esempio semplificato
    // La vera implementazione richiede di costruire l'instruction
    // secondo le specifiche esatte di Circle CCTP
    
    let deposit_for_burn_ix = create_deposit_for_burn_instruction(
        &ctx.accounts.token_messenger_program.key(),
        &ctx.accounts.token_messenger.key(),
        &ctx.accounts.program_usdc_account.key(),
        &ctx.accounts.usdc_mint.key(),
        amount,
        DOMAIN_BASE,
        state.base_vault_address,
        &ctx.accounts.program_authority.key(),
        &message_bytes,
    )?;
    
    // Esegui CPI con PDA signer
    let authority_bump = ctx.bumps.program_authority;
    let authority_seeds = &[b"authority".as_ref(), &[authority_bump]];
    let signer_seeds = &[&authority_seeds[..]];
    
    invoke_signed(
        &deposit_for_burn_ix,
        &[
            ctx.accounts.token_messenger_program.to_account_info(),
            ctx.accounts.token_messenger.to_account_info(),
            ctx.accounts.message_transmitter.to_account_info(),
            ctx.accounts.token_minter.to_account_info(),
            ctx.accounts.program_usdc_account.to_account_info(),
            ctx.accounts.usdc_mint.to_account_info(),
            ctx.accounts.remote_token_messenger.to_account_info(),
            ctx.accounts.program_authority.to_account_info(),
            ctx.accounts.message_sent_event_data.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer_seeds,
    )?;
    
    // Il nonce viene generato da CCTP e può essere letto dal MessageSent event
    // Per ora usiamo deposit_count come placeholder
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
    
    emit!(DepositInitiated {
        deposit_id: deposit_record.deposit_id,
        user: deposit_record.user,
        recipient: deposit_record.recipient,
        amount: deposit_record.amount,
        cctp_nonce: deposit_record.cctp_nonce,
        timestamp: deposit_record.timestamp,
    });
    
    msg!("Deposit initiated and CCTP burn executed");
    msg!("Deposit ID: {}", deposit_record.deposit_id);
    msg!("Amount: {} USDC", amount as f64 / 1_000_000.0);
    msg!("Recipient: {:?}", recipient);
    msg!("CCTP Nonce: {}", cctp_nonce);
    
    Ok(())
}

/// Crea instruction per depositForBurn
/// 
/// Nota: Questa è una funzione helper semplificata
/// La vera implementazione deve seguire esattamente il formato
/// richiesto da Circle CCTP
fn create_deposit_for_burn_instruction(
    token_messenger_program: &Pubkey,
    token_messenger: &Pubkey,
    burn_token_account: &Pubkey,
    mint: &Pubkey,
    amount: u64,
    destination_domain: u32,
    mint_recipient: [u8; 32],
    authority: &Pubkey,
    message_body: &[u8],
) -> Result<Instruction> {
    
    // Discriminator per depositForBurn instruction
    // Questo deve corrispondere al discriminator nel programma Circle
    let discriminator: [u8; 8] = [0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0];
    
    let mut data = Vec::new();
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&destination_domain.to_le_bytes());
    data.extend_from_slice(&mint_recipient);
    data.extend_from_slice(&(message_body.len() as u32).to_le_bytes());
    data.extend_from_slice(message_body);
    
    let accounts = vec![
        AccountMeta::new_readonly(*token_messenger, false),
        AccountMeta::new(*burn_token_account, false),
        AccountMeta::new(*mint, false),
        AccountMeta::new_readonly(*authority, true),
        // ... altri accounts necessari
    ];
    
    Ok(Instruction {
        program_id: *token_messenger_program,
        accounts,
        data,
    })
}
```

### 4. Aggiornare Cargo.toml

Modifica `programs/nextblock-satellite/Cargo.toml`:

```toml
[package]
name = "nextblock-satellite"
version = "0.1.0"
description = "NextBlock Satellite Program for cross-chain USDC deposits via Circle CCTP"
edition = "2021"
license = "Proprietary"
authors = ["Anton Carlo Santoro"]

[lib]
crate-type = ["cdylib", "lib"]
name = "nextblock_satellite"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []
mainnet = []  # Feature flag per mainnet vs devnet

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
solana-program = "~1.17"
borsh = "0.10.3"

[dev-dependencies]
solana-program-test = "~1.17"
solana-sdk = "~1.17"
```

### 5. Aggiornare lib.rs

Modifica `src/lib.rs` per includere il modulo cctp:

```rust
// Author: Anton Carlo Santoro
// Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod instructions;
pub mod state;
pub mod errors;
pub mod cctp;  // <-- AGGIUNGI QUESTO

#[program]
pub mod nextblock_satellite {
    use super::*;
    
    // ... resto del codice invariato
}
```

## Account Derivation per CCTP

### Token Messenger Account

```rust
// PDA seeds per Token Messenger
let (token_messenger, _bump) = Pubkey::find_program_address(
    &[b"token_messenger"],
    &TOKEN_MESSENGER_PROGRAM,
);
```

### Message Transmitter Account

```rust
// PDA seeds per Message Transmitter
let (message_transmitter, _bump) = Pubkey::find_program_address(
    &[b"message_transmitter"],
    &MESSAGE_TRANSMITTER_PROGRAM,
);
```

### Token Minter Account

```rust
// PDA seeds per Token Minter
let (token_minter, _bump) = Pubkey::find_program_address(
    &[b"token_minter"],
    &TOKEN_MESSENGER_PROGRAM,
);
```

### Remote Token Messenger (Base)

```rust
// L'indirizzo del Token Messenger su Base
// Questo è un indirizzo fisso fornito da Circle
pub const REMOTE_TOKEN_MESSENGER_BASE: [u8; 32] = [
    // Indirizzo Token Messenger su Base (bytes32)
    // Ottieni questo da Circle documentation
];
```

## Testing

### 1. Test Locale con Mock

Crea `tests/cctp_integration.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use nextblock_satellite::*;

#[tokio::test]
async fn test_deposit_and_bridge() {
    // Setup test environment
    let program_id = Pubkey::new_unique();
    let mut context = ProgramTest::new(
        "nextblock_satellite",
        program_id,
        processor!(entry),
    )
    .start_with_context()
    .await;
    
    // Create test accounts
    let user = Keypair::new();
    let recipient = [1u8; 20];
    let amount = 100_000_000; // 100 USDC
    
    // Initialize program
    // ...
    
    // Execute deposit_and_bridge
    let tx = Transaction::new_signed_with_payer(
        &[deposit_and_bridge_ix],
        Some(&user.pubkey()),
        &[&user],
        context.last_blockhash,
    );
    
    context.banks_client.process_transaction(tx).await.unwrap();
    
    // Verify deposit record created
    // Verify USDC burned
    // Verify event emitted
}
```

### 2. Test su Devnet

```bash
# 1. Deploy su devnet
anchor build
anchor deploy --provider.cluster devnet

# 2. Initialize
anchor run initialize --provider.cluster devnet

# 3. Test deposit
# Usa script TypeScript per chiamare deposit_and_bridge
```

### 3. Verifica Cross-Chain

Dopo il deposit su Solana devnet:

1. Vai su Circle CCTP Explorer
2. Cerca il tuo transaction hash
3. Verifica che il burn sia stato rilevato
4. Ottieni l'attestation
5. Verifica che il mint su Base sia avvenuto
6. Verifica che CCTPReceiver abbia ricevuto e depositato

## Indirizzi Circle CCTP

### Solana Mainnet

| Componente | Indirizzo |
|------------|-----------|
| Token Messenger | `CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd` |
| Message Transmitter | `CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3` |
| USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

### Base Mainnet

| Componente | Indirizzo |
|------------|-----------|
| Token Messenger | `0x1682Ae6375C4E4A97e4B583BC394c861A46D8962` |
| Message Transmitter | `0xAD09780d193884d503182aD4588450C416D6F9D4` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## Risorse

### Documentazione Circle

- CCTP Overview: https://developers.circle.com/stablecoins/docs/cctp-getting-started
- CCTP Protocol: https://developers.circle.com/stablecoins/docs/cctp-protocol-contract
- Solana Integration: https://developers.circle.com/stablecoins/docs/cctp-solana-integration

### SDK e Tools

- Circle CCTP SDK: https://github.com/circlefin/cctp-sdk
- CCTP Explorer: https://cctp-explorer.circle.com/
- Attestation Service: https://iris-api.circle.com/

## Note Importanti

### 1. Discriminator

Il discriminator per `depositForBurn` deve corrispondere esattamente a quello nel programma Circle. Verifica nella documentazione ufficiale o nel codice sorgente di Circle.

### 2. Account Order

L'ordine degli account nella CPI deve corrispondere esattamente a quello richiesto da Circle CCTP. Verifica nella documentazione.

### 3. Message Format

Il formato del message body deve essere compatibile con il CCTPReceiver su Base. Assicurati che la decodifica su Base corrisponda all'encoding su Solana.

### 4. Nonce Tracking

Il nonce CCTP viene generato dal MessageTransmitter. Per ottenerlo, devi:
- Parsare il MessageSent event dopo la CPI
- Salvarlo nel DepositRecord
- Usarlo per tracking off-chain

### 5. Gas/Rent

Assicurati che l'utente abbia abbastanza SOL per:
- Rent del DepositRecord account
- Rent del MessageSent event account
- Transaction fees

## Troubleshooting

### Errore: "Invalid instruction data"

**Causa**: Discriminator o formato dati non corretto

**Soluzione**: Verifica il discriminator e il formato esatto richiesto da Circle

### Errore: "Invalid account"

**Causa**: Account mancante o ordine sbagliato

**Soluzione**: Verifica che tutti gli account CCTP siano presenti e nell'ordine corretto

### Errore: "Insufficient funds"

**Causa**: User non ha abbastanza USDC o SOL

**Soluzione**: Verifica balance prima della transazione

### Messaggio non arriva su Base

**Causa**: Attestation non generata o non inviata

**Soluzione**: 
1. Verifica su CCTP Explorer che il burn sia stato rilevato
2. Attendi l'attestation (può richiedere qualche minuto)
3. Verifica che il CCTPReceiver su Base sia configurato correttamente

## Prossimi Passi

1. Implementare le modifiche descritte
2. Testare su devnet
3. Verificare cross-chain flow completo
4. Ottimizzare gas/rent costs
5. Aggiungere error handling robusto
6. Documentare edge cases
7. Preparare per audit
8. Deploy su mainnet

---

**Supporto**: Per domande sull'integrazione CCTP, consulta la documentazione Circle o contatta il supporto Circle.
