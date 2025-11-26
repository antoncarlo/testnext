# NextBlock Satellite - Solana Program

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.  
**License**: Proprietary

## Panoramica

NextBlock Satellite è un programma Solana che abilita depositi cross-chain verso il NextBlockVault su Base tramite Circle CCTP (Cross-Chain Transfer Protocol).

## Funzionalità

### Core

- **Initialize**: Inizializza il programma con admin e indirizzo vault Base
- **Deposit and Bridge**: Deposita USDC su Solana e fa bridge verso Base
- **Update Admin**: Aggiorna l'admin del programma
- **Update Vault Address**: Aggiorna l'indirizzo del vault su Base
- **Pause/Unpause**: Pausa/riprendi i depositi per emergenze

### Architettura

```
User (Solana)
    |
    | deposit_and_bridge()
    v
NextBlockSatellite Program
    |
    | Circle CCTP
    v
Base Chain
    |
    | CCTPReceiver
    v
NextBlockVault
    |
    v
User receives nbkUSDC shares
```

## Strutture Dati

### ProgramState

```rust
pub struct ProgramState {
    pub admin: Pubkey,                  // Admin con pieno controllo
    pub base_vault_address: [u8; 32],   // Indirizzo vault su Base
    pub paused: bool,                   // Stato pause
    pub total_deposits: u64,            // Totale USDC depositato
    pub deposit_count: u64,             // Numero depositi
    pub bump: u8,                       // PDA bump
}
```

### DepositRecord

```rust
pub struct DepositRecord {
    pub deposit_id: u64,        // ID univoco deposito
    pub user: Pubkey,           // Utente Solana
    pub recipient: [u8; 20],    // Indirizzo Base destinatario
    pub amount: u64,            // Importo USDC (6 decimals)
    pub timestamp: i64,         // Timestamp Unix
    pub cctp_nonce: u64,        // Nonce CCTP per tracking
    pub status: DepositStatus,  // Stato deposito
}
```

## Istruzioni

### 1. Initialize

Inizializza il programma (una sola volta).

```rust
pub fn initialize(
    ctx: Context<Initialize>,
    base_vault_address: [u8; 32],
) -> Result<()>
```

**Parametri**:
- `base_vault_address`: Indirizzo del NextBlockVault su Base (bytes32)

**Accounts**:
- `state`: ProgramState account (PDA)
- `admin`: Signer che diventa admin
- `system_program`: System program

### 2. Deposit and Bridge

Deposita USDC e fa bridge verso Base.

```rust
pub fn deposit_and_bridge(
    ctx: Context<DepositAndBridge>,
    amount: u64,
    recipient: [u8; 20],
) -> Result<()>
```

**Parametri**:
- `amount`: Importo USDC da depositare (6 decimals)
- `recipient`: Indirizzo Ethereum che riceverà le shares (20 bytes)

**Validazioni**:
- Programma non in pausa
- Amount > 0
- Amount >= 10 USDC (MIN_DEPOSIT)
- Amount <= 1M USDC (MAX_DEPOSIT)
- Recipient non zero address

**Accounts**:
- `state`: ProgramState (PDA)
- `deposit_record`: DepositRecord (PDA)
- `user_usdc_account`: User's USDC ATA
- `program_usdc_account`: Program's USDC ATA (PDA)
- `program_authority`: Program authority (PDA)
- `usdc_mint`: USDC mint
- `user`: Signer
- `token_program`: Token program
- `system_program`: System program

### 3. Update Admin

Aggiorna l'admin (solo admin corrente).

```rust
pub fn update_admin(
    ctx: Context<UpdateAdmin>,
    new_admin: Pubkey,
) -> Result<()>
```

### 4. Update Vault Address

Aggiorna l'indirizzo del vault su Base (solo admin).

```rust
pub fn update_vault_address(
    ctx: Context<UpdateVaultAddress>,
    new_vault_address: [u8; 32],
) -> Result<()>
```

### 5. Pause / Unpause

Pausa o riprendi i depositi (solo admin).

```rust
pub fn pause(ctx: Context<Pause>) -> Result<()>
pub fn unpause(ctx: Context<Unpause>) -> Result<()>
```

## Eventi

### ProgramInitialized
```rust
pub struct ProgramInitialized {
    pub admin: Pubkey,
    pub base_vault_address: [u8; 32],
    pub timestamp: i64,
}
```

### DepositInitiated
```rust
pub struct DepositInitiated {
    pub deposit_id: u64,
    pub user: Pubkey,
    pub recipient: [u8; 20],
    pub amount: u64,
    pub cctp_nonce: u64,
    pub timestamp: i64,
}
```

### AdminUpdated, VaultAddressUpdated, ProgramPaused, ProgramUnpaused
Eventi per tracking modifiche amministrative.

## Errori

```rust
pub enum NextBlockError {
    ProgramPaused,              // Programma in pausa
    InvalidAmount,              // Importo non valido
    AmountTooLow,               // Importo sotto minimo
    AmountTooHigh,              // Importo sopra massimo
    Unauthorized,               // Non autorizzato
    InvalidRecipient,           // Recipient non valido
    CCTPTransmissionFailed,     // CCTP fallito
    ArithmeticOverflow,         // Overflow aritmetico
    InvalidNonce,               // Nonce CCTP non valido
}
```

## Setup e Build

### Prerequisiti

- Rust 1.70+
- Solana CLI 1.17+
- Anchor 0.29.0

### Installazione

```bash
# Installa Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Installa Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Installa Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

### Build

```bash
cd solana-program

# Build del programma
anchor build

# Esegui i test
anchor test

# Deploy su devnet
anchor deploy --provider.cluster devnet
```

## Testing

### Unit Tests

```bash
anchor test
```

### Integration Tests

```bash
# Test su localnet
anchor test --skip-local-validator

# Test su devnet
anchor test --provider.cluster devnet
```

## Deployment

### Devnet

```bash
# 1. Configura Solana per devnet
solana config set --url devnet

# 2. Crea un nuovo keypair (se necessario)
solana-keygen new -o ~/.config/solana/id.json

# 3. Ottieni SOL da faucet
solana airdrop 2

# 4. Build
anchor build

# 5. Deploy
anchor deploy --provider.cluster devnet

# 6. Salva il Program ID
# Aggiorna declare_id! in lib.rs con il nuovo Program ID
```

### Mainnet

```bash
# 1. Configura Solana per mainnet
solana config set --url mainnet-beta

# 2. Assicurati di avere SOL sufficiente
solana balance

# 3. Build per produzione
anchor build --verifiable

# 4. Deploy
anchor deploy --provider.cluster mainnet-beta

# 5. Verifica il programma
anchor verify <PROGRAM_ID>
```

## Integrazione CCTP

### Stato Attuale

Il programma attualmente simula l'integrazione CCTP. Per completare l'integrazione reale:

### 1. Aggiungi Dipendenze CCTP

Nel `Cargo.toml`:
```toml
[dependencies]
cctp-solana = "0.1.0"  # Circle CCTP SDK
```

### 2. Program IDs CCTP su Solana

```rust
// TokenMessenger
pub const TOKEN_MESSENGER: Pubkey = pubkey!("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");

// MessageTransmitter
pub const MESSAGE_TRANSMITTER: Pubkey = pubkey!("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");
```

### 3. Modifica DepositAndBridge

Sostituisci il transfer con:

```rust
// Call CCTP depositForBurn
let cpi_accounts = DepositForBurn {
    owner: ctx.accounts.user.to_account_info(),
    burn_token_account: ctx.accounts.program_usdc_account.to_account_info(),
    message_transmitter: ctx.accounts.message_transmitter.to_account_info(),
    token_messenger: ctx.accounts.token_messenger.to_account_info(),
    // ... altri accounts
};

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_messenger_program.to_account_info(),
    cpi_accounts,
    &[&[b"authority", &[authority_bump]]],
);

cctp::deposit_for_burn(
    cpi_ctx,
    amount,
    DESTINATION_DOMAIN_BASE, // 6 = Base
    recipient_bytes32,
    usdc_mint,
)?;
```

### 4. Message Format

Il messaggio CCTP deve contenere:
```
- recipient (bytes32): Indirizzo Ethereum del destinatario
- amount (uint256): Importo USDC
```

Questo verrà decodificato da CCTPReceiver su Base.

## Indirizzi

### Devnet

| Componente | Indirizzo |
|------------|-----------|
| Program ID | `TBD` |
| USDC Mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

### Mainnet

| Componente | Indirizzo |
|------------|-----------|
| Program ID | `TBD` |
| USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

## Sicurezza

### Best Practices Implementate

- PDA per token authority
- Admin-only functions con has_one constraint
- Validazione importi (min/max)
- Validazione recipient (no zero address)
- Pause mechanism per emergenze
- Overflow checks su arithmetic operations
- Events per tracking on-chain

### Audit Checklist

- [ ] Internal code review
- [ ] Unit tests completi
- [ ] Integration tests con CCTP reale
- [ ] Fuzzing tests
- [ ] External audit (OtterSec / Neodyme)
- [ ] Bug bounty program

## Costi Stimati

### Devnet/Mainnet

- Initialize: ~0.002 SOL
- Deposit and Bridge: ~0.005 SOL + CCTP fees
- Update Admin: ~0.0001 SOL
- Pause/Unpause: ~0.0001 SOL

## Prossimi Passi

1. Completare integrazione CCTP reale
2. Testing su devnet con CCTP
3. Testing cross-chain con Base testnet
4. Audit di sicurezza
5. Deployment mainnet

## Supporto

Per domande o supporto:
- Email: dev@nextblock.io
- Autore: Anton Carlo Santoro

---

**DISCLAIMER**: Questo programma è in fase di sviluppo. L'integrazione CCTP è attualmente simulata e deve essere completata prima del deployment in produzione.
