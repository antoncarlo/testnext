# Solana Program Overview - NextBlock Satellite

**Author**: Anton Carlo Santoro  
**Date**: 2025-11-26  
**Chain**: Solana  
**Framework**: Anchor

## Program Summary

This directory contains a complete Anchor program for NextBlock on Solana, based on the OnRe.finance insurance tokenization protocol with Circle CCTP integration for cross-chain transfers.

**Source**: [OnRe.finance](https://github.com/onre-finance/onre-sol)

---

## Program Architecture

### Core Components

#### 1. Program Entry Point
**File**: `programs/onreapp/src/lib.rs`

Main program module that defines all instructions:
- `initialize`: Initialize the program state
- `make_offer`: Create a new insurance offer
- `take_offer`: Accept an insurance offer
- `close_offer`: Close an expired offer
- `set_boss`: Update program authority

---

#### 2. State Management
**File**: `programs/onreapp/src/state.rs`

Defines on-chain account structures:

**OnReApp** (Main state account):
- `boss`: Program authority (Pubkey)
- `bump`: PDA bump seed
- Manages global program configuration

**Offer** (Individual offer account):
- `maker`: Offer creator address
- `token_mint_a`: Token A mint address
- `token_mint_b`: Token B mint address
- `token_a_offered_amount`: Amount of token A offered
- `token_b_wanted_amount`: Amount of token B wanted
- `bump`: PDA bump seed

---

#### 3. Instructions

##### Initialize
**File**: `programs/onreapp/src/instructions/initialize.rs`

Initialize program state with boss authority.

**Accounts**:
- `onreapp`: Program state PDA
- `boss`: Authority account
- `system_program`: Solana system program

---

##### Make Offer
**File**: `programs/onreapp/src/instructions/make_offer.rs`

Create a new token swap offer.

**Accounts**:
- `maker`: Offer creator
- `token_mint_a`: Token A mint
- `token_mint_b`: Token B mint
- `maker_token_account_a`: Maker's token A account
- `vault_token_account_a`: Vault for escrowed token A
- `offer`: Offer PDA
- `token_program`: SPL Token program
- `system_program`: Solana system program

**Parameters**:
- `token_a_offered_amount`: Amount to offer
- `token_b_wanted_amount`: Amount wanted in return

---

##### Take Offer
**File**: `programs/onreapp/src/instructions/take_offer.rs`

Accept an existing offer and execute the swap.

**Accounts**:
- `taker`: Offer acceptor
- `maker`: Original offer creator
- `token_mint_a`: Token A mint
- `token_mint_b`: Token B mint
- `taker_token_account_a`: Taker's token A account
- `taker_token_account_b`: Taker's token B account
- `maker_token_account_b`: Maker's token B account
- `vault_token_account_a`: Vault with escrowed token A
- `offer`: Offer PDA
- `token_program`: SPL Token program
- `system_program`: Solana system program

---

##### Close Offer
**File**: `programs/onreapp/src/instructions/close_offer.rs`

Close an offer and return escrowed tokens to maker.

**Accounts**:
- `maker`: Offer creator
- `maker_token_account_a`: Maker's token A account
- `vault_token_account_a`: Vault with escrowed tokens
- `offer`: Offer PDA
- `token_program`: SPL Token program

---

##### Set Boss
**File**: `programs/onreapp/src/instructions/set_boss.rs`

Update program authority.

**Accounts**:
- `onreapp`: Program state PDA
- `current_boss`: Current authority
- `new_boss`: New authority to set

---

#### 4. Contexts
**File**: `programs/onreapp/src/contexts/`

Defines account validation and constraints for each instruction using Anchor's context system.

---

## Cross-Chain Integration (CCTP)

### Circle CCTP Support

The program includes complete Circle CCTP integration for cross-chain USDC transfers:

#### CCTP v1
**Directory**: `scripts/cross_chain_transfer/cctp_v1/`

- `transfer_eth2sol.ts`: Transfer USDC from Ethereum/Base to Solana
- `transfer_sol2eth.ts`: Transfer USDC from Solana to Ethereum/Base
- `utils.ts`: Helper functions for CCTP operations

**IDL Files**:
- `message_transmitter.json`: Message Transmitter program IDL
- `token_messenger_minter.json`: Token Messenger Minter program IDL

---

#### CCTP v2
**Directory**: `scripts/cross_chain_transfer/cctp_v2/`

Updated CCTP implementation with improved features:
- `evm.ts`: EVM chain integration (Base, Ethereum)
- `solana.ts`: Solana integration
- `transfer-v2.ts`: Main transfer logic
- `utils-v2.ts`: Helper utilities

---

### CCTP Flow

**Base → Solana**:
1. User deposits USDC on Base (via CCTPReceiver.sol)
2. CCTP burns USDC on Base
3. Message transmitted cross-chain
4. CCTP mints USDC on Solana
5. Program processes offer/deposit

**Solana → Base**:
1. User initiates transfer on Solana
2. CCTP burns USDC on Solana
3. Message transmitted cross-chain
4. CCTP mints USDC on Base
5. Vault receives USDC

---

## Scripts

### Deployment
- `initialize.ts`: Initialize program
- `initialize-permissionless.ts`: Permissionless initialization

### Offer Management
- `make-offer.ts`: Create new offer
- `fetch-offer.ts`: Query offer data
- `close-offer.ts`: Close offer
- `replace-offer.ts`: Replace existing offer

### Utilities
- `transfer-token.ts`: Transfer SPL tokens
- `sign_and_send_tx.ts`: Transaction signing helper
- `script-commons.ts`: Common utilities

---

## Testing

### Test Suite
**Directory**: `tests/`

- `onreapp.spec.ts`: Main program tests
- `make_offer.spec.ts`: Offer creation tests
- `take_offer.spec.ts`: Offer acceptance tests
- `close_offer.spec.ts`: Offer closing tests
- `test_helper.ts`: Test utilities

### Run Tests
```bash
anchor test
```

---

## Configuration

### Anchor.toml
Program configuration:
- Program ID: `onreapp`
- Cluster: Devnet/Mainnet
- Wallet path
- Test validator settings

### Environment Variables
Create `.env` from `.env_example`:
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json
SOLANA_PRIVATE_KEY=your_private_key
```

---

## Build and Deploy

### Build Program
```bash
anchor build
```

### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet
```bash
anchor deploy --provider.cluster mainnet
```

---

## Program Addresses

| Component | Address | Network |
|:----------|:--------|:--------|
| Program ID | TBD | Devnet |
| Program ID | TBD | Mainnet |
| CCTP Message Transmitter | `CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd` | Mainnet |
| CCTP Token Messenger | `CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3` | Mainnet |

---

## Integration with Base Chain

### Cross-Chain Flow

1. **User deposits on Base**:
   - Frontend calls `CCTPReceiver.receiveBridge()`
   - USDC deposited to Vault
   - Points awarded to user

2. **Cross-chain transfer**:
   - User initiates CCTP transfer
   - USDC burned on Base
   - Message relayed via CCTP
   - USDC minted on Solana

3. **Solana program processes**:
   - Offer created/accepted
   - Insurance pool tokens minted
   - NAV updated

4. **Return to Base** (if needed):
   - User withdraws on Solana
   - CCTP burns USDC on Solana
   - USDC minted on Base
   - Vault processes withdrawal

---

## Security Considerations

### Access Control
- Program authority (`boss`) controls critical operations
- PDA seeds ensure deterministic account addresses
- Signer checks on all sensitive instructions

### Token Safety
- Escrow via PDA-owned token accounts
- Atomic swaps (take_offer)
- Proper token account validation

### Audit Recommendations
1. Review PDA derivation logic
2. Verify token account ownership checks
3. Test edge cases (expired offers, insufficient balance)
4. Audit CCTP integration security

---

## Dependencies

### Rust Crates
```toml
[dependencies]
anchor-lang = "0.30.1"
anchor-spl = "0.30.1"
```

### Node Packages
```json
{
  "@coral-xyz/anchor": "^0.30.1",
  "@solana/web3.js": "^1.95.8",
  "@solana/spl-token": "^0.4.9"
}
```

---

## Next Steps

1. **Customize for NextBlock**:
   - Adapt offer logic for insurance pools
   - Integrate with NavOracle data
   - Add KYC checks

2. **Test on Devnet**:
   - Deploy program
   - Test CCTP integration
   - Verify cross-chain flow

3. **Audit**:
   - Professional security audit
   - Penetration testing
   - Economic model review

4. **Mainnet Deployment**:
   - Deploy to Solana mainnet
   - Verify program
   - Monitor performance

---

## References

- [OnRe.finance Repository](https://github.com/onre-finance/onre-sol)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Circle CCTP](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Solana Cookbook](https://solanacookbook.com/)

---

## Author

**Anton Carlo Santoro**  
Copyright (c) 2025 Anton Carlo Santoro. All rights reserved.

---

## License

Based on OnRe.finance open-source code. Check original repository for license details.
