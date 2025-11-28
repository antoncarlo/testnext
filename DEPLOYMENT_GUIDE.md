# 🚀 Deployment Guide - NetBlock Re Platform

**Data:** 27 Novembre 2024  
**Versione:** v1.2.0  
**Network:** Base Sepolia Testnet

---

## 📋 Indice

1. [Treasury Multisig Setup](#treasury-multisig-setup)
2. [DeFiVault Deployment](#defivault-deployment)
3. [CCTP Integration](#cctp-integration)
4. [Environment Variables](#environment-variables)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 Treasury Multisig Setup

### Configurazione Completata

✅ **Multisig Address:** `0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49`  
✅ **Threshold:** 2/3 (servono 2 firme su 3)  
✅ **Network:** Base Sepolia  

### Signers

| # | Address | Role |
|---|---------|------|
| 1 | `0xE499af7B8C1ba34E4F39B110797d8E64937496bd` | Signer 1 |
| 2 | `0xB1135f0fb79452F5D38F83E53b28D113E9D63781` | Signer 2 |
| 3 | `0x9d606550aD9ea012c0415c6C37814f5266622ee5` | Signer 3 |

### File Generati

- **`treasury-multisig-config.json`** - Configurazione completa
  - Contiene indirizzi signers
  - Private keys (⚠️ CONSERVARE IN MODO SICURO!)
  - Mnemonic phrases
  - Setup data per deployment

### Come Deployare il Multisig

#### Opzione 1: Gnosis Safe UI (Raccomandato)

1. Vai su: https://app.safe.global/new-safe/create?chain=basesep
2. Connetti wallet
3. Aggiungi i 3 signer addresses
4. Imposta threshold a 2
5. Deploy

#### Opzione 2: Script Automatico

```bash
# Richiede wallet con Base Sepolia ETH
node scripts/deploy-treasury-multisig.js
```

### Verifica Multisig

```bash
# Check su BaseScan
https://sepolia.basescan.org/address/0xb45b21d21035ff8149fcBf9a2c1a53F6BF86Dc54
```

---

## 🏦 DeFiVault Deployment

### Parametri di Deployment

| Parametro | Valore |
|-----------|--------|
| **Vault Name** | NextBlock DeFi Vault |
| **Protocol Type** | Yield Farming |
| **Base APY** | 850 (8.50%) |
| **Points Multiplier** | 2x |
| **Treasury Address** | `0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49` |

### Metodi di Deployment

#### Opzione 1: Foundry (Forge)

```bash
# 1. Installa Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Crea foundry.toml
cat > foundry.toml << EOF
[profile.default]
src = "contracts"
out = "out"
libs = ["node_modules"]
EOF

# 3. Deploy
forge create contracts/DeFiVault.sol:DeFiVault \
  --rpc-url https://sepolia.base.org \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args \
    "NextBlock DeFi Vault" \
    "Yield Farming" \
    850 \
    2 \
    0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49
```

#### Opzione 2: thirdweb Deploy

```bash
# 1. Installa thirdweb CLI
npm install -g thirdweb

# 2. Deploy
npx thirdweb deploy

# 3. Compila parametri nella UI:
# - _vaultName: NextBlock DeFi Vault
# - _protocolType: Yield Farming
# - _baseAPY: 850
# - _pointsMultiplier: 2
# - _treasury: 0xb45b21d21035ff8149fcBf9a2c1a53F6BF86Dc54
```

#### Opzione 3: Remix IDE

1. Vai su: https://remix.ethereum.org
2. Crea file `DeFiVault.sol`
3. Copia il codice da `contracts/DeFiVault.sol`
4. Compila con Solidity 0.8.20
5. Deploy su Base Sepolia
6. Inserisci parametri constructor

### Dopo il Deployment

```bash
# 1. Salva contract address
VAULT_ADDRESS="0x..."

# 2. Aggiungi a environment variables
./scripts/add-vault-strategy-addresses.sh $VAULT_ADDRESS

# 3. Verifica su BaseScan
forge verify-contract \
  $VAULT_ADDRESS \
  contracts/DeFiVault.sol:DeFiVault \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode \
    "constructor(string,string,uint256,uint256,address)" \
    "NextBlock DeFi Vault" \
    "Yield Farming" \
    850 \
    2 \
    0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49)
```

---

## 🌉 CCTP Integration

### Overview

Circle's Cross-Chain Transfer Protocol (CCTP) permette trasferimenti USDC tra:
- Base Chain ↔ Ethereum
- Base Chain ↔ Arbitrum
- Base Chain ↔ Optimism

### Implementazione

**File:** `src/hooks/useCCTPBridge.tsx`

### Funzionalità

#### 1. Transfer USDC

```typescript
import { useCCTPBridge } from '@/hooks/useCCTPBridge';

const { transferViaCCTP } = useCCTPBridge();

await transferViaCCTP({
  amount: 100.50,  // USDC amount
  destinationChain: 'ethereum',
  destinationAddress: '0x...',
});
```

#### 2. Check Status

```typescript
const { getTransferStatus } = useCCTPBridge();

const status = await getTransferStatus('0x...');
```

#### 3. Estimate Time & Fee

```typescript
const { estimateTransferTime, estimateFee } = useCCTPBridge();

const time = estimateTransferTime('ethereum'); // ~900 seconds (15 min)
const fee = await estimateFee(); // ~$0.50
```

### CCTP Flow

```
1. User approves USDC for CCTP Receiver
   ↓
2. Call depositForBurn() on CCTP Receiver
   ↓
3. USDC burned on source chain (Base)
   ↓
4. Wait for attestation from Circle (~15 min)
   ↓
5. USDC minted on destination chain
```

### Testing

```bash
# Run CCTP integration tests
npm run test tests/cctp-integration.test.ts
```

### Requirements

- ✅ CCTP Receiver deployed: `0xF0c206B7C434Df70b29DD030C40dE89752dbf287`
- ✅ USDC on Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- ⏳ User wallet with USDC balance
- ⏳ Gas for transactions (~$0.50)

---

## 🔧 Environment Variables

### Variabili Configurate

| Variable | Value | Status |
|----------|-------|--------|
| `VITE_NETWORK` | testnet | ✅ |
| `VITE_BASE_CHAIN_ID` | 84532 | ✅ |
| `VITE_BASE_RPC_URL` | https://mainnet.base.org | ✅ |
| `VITE_BASE_SEPOLIA_RPC_URL` | https://sepolia.base.org | ✅ |
| `VITE_NXB_TOKEN_ADDRESS` | 0x0b67...375a | ✅ |
| `VITE_KYC_WHITELIST_ADDRESS` | 0xc4Ca...bef5 | ✅ |
| `VITE_NAV_ORACLE_ADDRESS` | 0x13Af...E32e | ✅ |
| `VITE_CCTP_RECEIVER_ADDRESS` | 0xF0c2...f287 | ✅ |
| `VITE_INSURANCE_POOL_TOKEN_ADDRESS` | 0xE543...3302 | ✅ |
| `VITE_BASE_USDC_ADDRESS` | 0x036C...CF7e | ✅ |
| `VITE_TREASURY_ADDRESS` | 0xb45b...Dc54 | ✅ |
| `VITE_VAULT_ADDRESS` | (empty) | ⏳ Da deployare |
| `VITE_STRATEGY_ADDRESS` | (empty) | ⏳ Da deployare |

### Come Aggiornare

#### Locale (.env.local)

```bash
echo 'VITE_VAULT_ADDRESS="0x..."' >> .env.local
```

#### Vercel (Production)

```bash
echo "0x..." | vercel env add VITE_VAULT_ADDRESS production
echo "0x..." | vercel env add VITE_VAULT_ADDRESS preview
echo "0x..." | vercel env add VITE_VAULT_ADDRESS development
```

#### Script Automatico

```bash
./scripts/add-vault-strategy-addresses.sh <VAULT_ADDR> <STRATEGY_ADDR>
```

---

## ✅ Verification

### 1. Treasury Multisig

```bash
# Check su BaseScan
https://sepolia.basescan.org/address/0xb45b21d21035ff8149fcBf9a2c1a53F6BF86Dc54

# Verifica signers
cast call 0xb45b21d21035ff8149fcBf9a2c1a53F6BF86Dc54 "getOwners()(address[])"

# Verifica threshold
cast call 0xb45b21d21035ff8149fcBf9a2c1a53F6BF86Dc54 "getThreshold()(uint256)"
```

### 2. DeFiVault

```bash
# Check treasury address
cast call $VAULT_ADDRESS "treasury()(address)"

# Check vault name
cast call $VAULT_ADDRESS "vaultName()(string)"

# Check owner
cast call $VAULT_ADDRESS "owner()(address)"
```

### 3. CCTP Integration

```bash
# Test nel browser
console.log({
  cctpReceiver: import.meta.env.VITE_CCTP_RECEIVER_ADDRESS,
  usdc: import.meta.env.VITE_BASE_USDC_ADDRESS,
  treasury: import.meta.env.VITE_TREASURY_ADDRESS,
});
```

### 4. Frontend

```bash
# Build locale
npm run build

# Test locale
npm run dev

# Verifica su produzione
https://testnext-delta.vercel.app/
```

---

## 🐛 Troubleshooting

### Problema: Multisig non deployato

**Soluzione:**
```bash
# Usa Gnosis Safe UI
https://app.safe.global/new-safe/create?chain=basesep
```

### Problema: DeFiVault deployment fallisce

**Errori Comuni:**

1. **Insufficient funds**
   ```bash
   # Get Base Sepolia ETH from faucet
   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   ```

2. **Wrong constructor args**
   ```bash
   # Verifica parametri
   cat vault-deployment-info.json
   ```

3. **Compilation error**
   ```bash
   # Installa dependencies
   npm install @openzeppelin/contracts
   ```

### Problema: CCTP transfer fallisce

**Errori Comuni:**

1. **Insufficient USDC balance**
   ```bash
   # Get testnet USDC
   # Contact Circle or use faucet
   ```

2. **CCTP Receiver not deployed**
   ```bash
   # Check address
   echo $VITE_CCTP_RECEIVER_ADDRESS
   ```

3. **Wallet not connected**
   ```typescript
   // Check in browser console
   const account = useActiveAccount();
   console.log('Connected:', !!account);
   ```

### Problema: Environment variables non caricate

**Soluzione:**
```bash
# 1. Verifica .env.local
cat .env.local

# 2. Verifica Vercel
vercel env ls

# 3. Redeploy
git push origin main
```

---

## 📝 Checklist Deployment

### Pre-Deployment

- [ ] Treasury multisig configurato
- [ ] Signers salvati in modo sicuro
- [ ] Base Sepolia ETH disponibile
- [ ] Contratti compilati

### Deployment

- [ ] Treasury multisig deployato
- [ ] DeFiVault deployato con treasury corretto
- [ ] Contratti verificati su BaseScan
- [ ] Environment variables aggiornate

### Post-Deployment

- [ ] Test emergency mode
- [ ] Test CCTP transfer
- [ ] Frontend funzionante
- [ ] Documentazione aggiornata

---

## 🔗 Link Utili

- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Base Sepolia Explorer:** https://sepolia.basescan.org/
- **Gnosis Safe:** https://app.safe.global/
- **thirdweb:** https://thirdweb.com/
- **Remix IDE:** https://remix.ethereum.org/
- **Circle CCTP Docs:** https://developers.circle.com/stablecoins/docs/cctp-getting-started

---

## 👥 Team

**Sviluppatore:** Anton Carlo Santoro  
**Email:** anton@nextblock.io  
**GitHub:** @antoncarlo

---

## 📄 Changelog

### v1.2.0 (27 Novembre 2024)

- ✅ Treasury multisig configurato (2/3)
- ✅ DeFiVault preparato per deployment
- ✅ CCTP integration implementata
- ✅ Environment variables aggiornate
- ✅ Test suite creata
- ✅ Documentazione completa

---

**Ultima Modifica:** 27 Novembre 2024, 19:40 GMT+1  
**Versione:** 1.0 Final  
**Status:** 🟢 Ready for Deployment
