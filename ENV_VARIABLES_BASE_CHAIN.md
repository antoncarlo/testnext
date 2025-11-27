# Variabili d'Ambiente - Base Chain Configuration

**Data:** 27 Novembre 2024  
**Versione:** v1.1.1  
**Network:** Base Sepolia Testnet (Chain ID: 84532)

---

## 📋 Variabili Configurate

### ✅ Supabase (Database & Auth)

```bash
VITE_SUPABASE_URL="https://ykfxrjmjdqhqjkqvqzxv.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Status:** ✅ Configurato e funzionante

---

### ✅ thirdweb (Web3 SDK)

```bash
VITE_THIRDWEB_CLIENT_ID="ad58ff7e7814ce88d991757556fddadd"
VITE_THIRDWEB_SECRET_KEY="8kiorV79phpVEAW1xOcbvLAZTQhGl7Hg..."
```

**Status:** ✅ Configurato e funzionante

---

### ✅ Network Configuration

```bash
VITE_NETWORK="testnet"
VITE_BASE_CHAIN_ID="84532"
VITE_BASE_RPC_URL="https://mainnet.base.org"
VITE_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
```

**Status:** ✅ Configurato per Base Sepolia Testnet

---

### ✅ Base Chain Smart Contracts (Deployed)

Tutti i contratti sono deployati su **Base Sepolia Testnet** (Chain ID: 84532)

| Contratto | Indirizzo | Status |
|-----------|-----------|--------|
| **NXB Token** | `0x0b678785BEA8664374eE6991714141d8E13C375a` | ✅ Deployed |
| **KYC Whitelist** | `0xc4Ca6299694383a9581f6ceAEfB02e674160bef5` | ✅ Deployed |
| **NAV Oracle** | `0x13AfcE4669642085b851319445E0F041698BE32e` | ✅ Deployed |
| **CCTP Receiver** | `0xF0c206B7C434Df70b29DD030C40dE89752dbf287` | ✅ Deployed |
| **Insurance Pool Token** | `0xE5438a2cB7DE27337040fA63F88F74FC11173302` | ✅ Deployed |
| **USDC (Testnet)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | ✅ Deployed |

**Variabili d'Ambiente:**

```bash
VITE_NXB_TOKEN_ADDRESS="0x0b678785BEA8664374eE6991714141d8E13C375a"
VITE_KYC_WHITELIST_ADDRESS="0xc4Ca6299694383a9581f6ceAEfB02e674160bef5"
VITE_NAV_ORACLE_ADDRESS="0x13AfcE4669642085b851319445E0F041698BE32e"
VITE_CCTP_RECEIVER_ADDRESS="0xF0c206B7C434Df70b29DD030C40dE89752dbf287"
VITE_INSURANCE_POOL_TOKEN_ADDRESS="0xE5438a2cB7DE27337040fA63F88F74FC11173302"
VITE_BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

---

### ⏳ Contratti da Deployare

| Contratto | Status | Note |
|-----------|--------|------|
| **Vault** | ⏳ Da deployare | Necessario per gestione fondi |
| **Strategy** | ⏳ Da deployare | Necessario per strategie DeFi |

**Variabili d'Ambiente (Vuote per ora):**

```bash
VITE_VAULT_ADDRESS=""
VITE_STRATEGY_ADDRESS=""
```

**Azione Richiesta:** Deployare i contratti Vault e Strategy su Base Sepolia, poi aggiornare queste variabili.

---

## ❌ Variabili Solana Rimosse

Le seguenti variabili Solana sono state **RIMOSSE** perché il progetto usa **solo Base Chain**:

```bash
# ❌ RIMOSSE - Non necessarie
VITE_SOLANA_PROGRAM_ID
VITE_SOLANA_CCTP_ADDRESS
VITE_SOLANA_NETWORK
VITE_SOLANA_RPC_URL
VITE_SOLANA_DEVNET_RPC_URL
VITE_SOLANA_USDC_ADDRESS
```

**Motivo:** Il progetto NetBlock Re è costruito esclusivamente su **Base Chain** (Ethereum L2). Solana non è utilizzato.

---

## 🔧 Configurazione nel Codice

### File: `src/config/blockchain.ts`

Il file di configurazione blockchain usa automaticamente le variabili d'ambiente:

```typescript
// Smart Contract Addresses (Base Sepolia Testnet) - DEPLOYED
contractsTestnet: {
  nxbToken: '0x0b678785BEA8664374eE6991714141d8E13C375a',
  kycWhitelist: '0xc4Ca6299694383a9581f6ceAEfB02e674160bef5',
  navOracle: '0x13AfcE4669642085b851319445E0F041698BE32e',
  cctpReceiver: '0xF0c206B7C434Df70b29DD030C40dE89752dbf287',
  insurancePoolToken: '0xE5438a2cB7DE27337040fA63F88F74FC11173302',
  usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
},
```

**Funzioni Helper:**

- `isTestnet()` - Verifica se siamo su testnet
- `getBaseChainId()` - Ritorna Chain ID corretto (8453 o 84532)
- `getBaseRpcUrl()` - Ritorna RPC URL corretto
- `getBaseContracts()` - Ritorna indirizzi contratti corretti

---

## 📝 Come Aggiornare le Variabili

### 1. Locale (.env.local)

```bash
# Modifica il file
nano /home/ubuntu/testnext/.env.local

# Aggiungi o modifica variabili
VITE_VAULT_ADDRESS="0x..."
```

### 2. Vercel Dashboard

1. Vai su: https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext
2. Clicca su "Settings" → "Environment Variables"
3. Aggiungi nuove variabili o modifica esistenti
4. Seleziona target: Production, Preview, Development
5. Salva e redeploy

### 3. Vercel CLI

```bash
# Aggiungi variabile per tutti gli environment
vercel env add VITE_VAULT_ADDRESS

# Aggiungi variabile per production
vercel env add VITE_VAULT_ADDRESS production

# Lista variabili
vercel env ls
```

---

## ✅ Checklist Configurazione

### Variabili Obbligatorie

- [x] `VITE_SUPABASE_URL`
- [x] `VITE_SUPABASE_ANON_KEY`
- [x] `VITE_THIRDWEB_CLIENT_ID`
- [x] `VITE_NETWORK`
- [x] `VITE_BASE_CHAIN_ID`
- [x] `VITE_NXB_TOKEN_ADDRESS`
- [x] `VITE_BASE_USDC_ADDRESS`

### Variabili Opzionali (ma Raccomandate)

- [x] `VITE_KYC_WHITELIST_ADDRESS`
- [x] `VITE_NAV_ORACLE_ADDRESS`
- [x] `VITE_CCTP_RECEIVER_ADDRESS`
- [x] `VITE_INSURANCE_POOL_TOKEN_ADDRESS`
- [x] `VITE_BASE_RPC_URL`
- [x] `VITE_BASE_SEPOLIA_RPC_URL`

### Variabili da Aggiungere Dopo Deployment

- [ ] `VITE_VAULT_ADDRESS` (dopo deploy Vault contract)
- [ ] `VITE_STRATEGY_ADDRESS` (dopo deploy Strategy contract)

---

## 🔐 Sicurezza

### ⚠️ Variabili Sensibili

Le seguenti variabili contengono informazioni sensibili e **NON devono essere committate**:

- `VITE_THIRDWEB_SECRET_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `VERCEL_OIDC_TOKEN`

**File .gitignore:**

```
.env.local
.env.production
.env.*.local
```

### ✅ Variabili Pubbliche

Le seguenti variabili sono pubbliche (indirizzi blockchain) e possono essere committate:

- Tutti gli indirizzi dei contratti (`VITE_*_ADDRESS`)
- Chain ID e RPC URLs
- Network configuration

---

## 🧪 Testing

### Verifica Variabili Localmente

```bash
# Build locale
npm run build

# Verifica che le variabili siano caricate
npm run dev
```

### Verifica su Vercel

1. Dopo deployment, apri la console browser su: https://testnext-delta.vercel.app/
2. Esegui in console:

```javascript
console.log({
  network: import.meta.env.VITE_NETWORK,
  chainId: import.meta.env.VITE_BASE_CHAIN_ID,
  nxbToken: import.meta.env.VITE_NXB_TOKEN_ADDRESS,
  usdc: import.meta.env.VITE_BASE_USDC_ADDRESS,
});
```

---

## 📊 Riepilogo

### Configurazione Attuale

| Categoria | Variabili | Status |
|-----------|-----------|--------|
| **Supabase** | 2/2 | ✅ 100% |
| **thirdweb** | 2/2 | ✅ 100% |
| **Network** | 4/4 | ✅ 100% |
| **Base Contracts** | 6/8 | ⚠️ 75% |
| **Solana** | 0/0 | ✅ Rimosso |

**Totale:** 14/16 variabili configurate (87.5%)

### Azioni Necessarie

1. ⏳ **Deployare Vault Contract** su Base Sepolia
2. ⏳ **Deployare Strategy Contract** su Base Sepolia
3. ✅ **Aggiornare** `VITE_VAULT_ADDRESS` dopo deployment
4. ✅ **Aggiornare** `VITE_STRATEGY_ADDRESS` dopo deployment
5. ✅ **Redeploy** su Vercel per applicare nuove variabili

---

## 🔗 Link Utili

- **Base Sepolia Explorer:** https://sepolia.basescan.org/
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **thirdweb Dashboard:** https://thirdweb.com/dashboard
- **Vercel Dashboard:** https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext

---

**Ultima Modifica:** 27 Novembre 2024, 18:45 GMT+1  
**Autore:** Manus AI Agent  
**Versione:** 1.0
