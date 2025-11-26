# TESTNEXT - Deployment Guide

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Overview

Questa guida fornisce istruzioni dettagliate per il deployment completo della piattaforma TESTNEXT su tutti i layer: blockchain, backend e frontend.

## Prerequisiti

### Software Richiesto

- Node.js 18+
- Rust e Cargo (per Solana)
- Anchor CLI 0.32+
- Foundry (per contratti Base)
- Supabase CLI
- Git
- GitHub CLI (gh)

### Account Necessari

- Account GitHub
- Account Supabase
- Account QuickNode o Alchemy (per RPC)
- Wallet con fondi per deployment:
  - Base Sepolia ETH (testnet)
  - Solana SOL (devnet/mainnet)

## Step 1: Clone Repository

```bash
git clone https://github.com/antoncarlo/testnext.git
cd testnext
```

## Step 2: Deploy Smart Contracts Base

### 2.1 Setup Environment

```bash
cd contracts-base
cp .env.example .env
```

Modifica `.env`:

```env
PRIVATE_KEY=your_private_key
BASE_SEPOLIA_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2.2 Install Dependencies

```bash
forge install
forge build
```

### 2.3 Deploy Contracts

```bash
# Deploy su Base Sepolia (testnet)
forge script script/DeployTestnet.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify

# Salva gli indirizzi dei contratti deployati
```

### 2.4 Verify Contracts

```bash
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.20 \
  <CONTRACT_ADDRESS> \
  src/NextBlockVault.sol:NextBlockVault
```

## Step 3: Deploy Solana Program

### 3.1 Setup Environment

```bash
cd ../solana-program
```

### 3.2 Build Program

```bash
anchor build
```

### 3.3 Deploy Program

```bash
# Deploy su Devnet
anchor deploy --provider.cluster devnet

# Salva il Program ID
```

### 3.4 Initialize Program

```bash
# Esegui script di inizializzazione
ts-node scripts/initialize-program.ts
```

## Step 4: Setup Supabase Backend

### 4.1 Create Supabase Project

1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Salva le credenziali (URL, anon key, service role key)

### 4.2 Setup Database

```bash
cd ../backend-supabase
supabase login
supabase link --project-ref your_project_ref
```

### 4.3 Run Migrations

```bash
supabase db push
```

### 4.4 Deploy Edge Functions

```bash
# Deploy tutte le Edge Functions
supabase functions deploy get-user-points
supabase functions deploy get-leaderboard
supabase functions deploy index-deposit
supabase functions deploy index-withdrawal
supabase functions deploy calculate-points
```

### 4.5 Setup Cron Jobs

```bash
# Esegui lo script per configurare i cron jobs
psql $DATABASE_URL -f scripts/setup-cron.sql
```

## Step 5: Configure Frontend

### 5.1 Setup Environment

```bash
cd ../frontend
cp .env.example .env
```

Modifica `.env` con i valori corretti:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Base Chain
VITE_NETWORK=testnet
VITE_BASE_RPC_URL=https://sepolia.base.org
VITE_VAULT_ADDRESS=0x...
VITE_STRATEGY_ADDRESS=0x...
VITE_NAV_ORACLE_ADDRESS=0x...
VITE_KYC_WHITELIST_ADDRESS=0x...
VITE_CCTP_RECEIVER_ADDRESS=0x...
VITE_BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Solana
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_PROGRAM_ID=your_program_id
VITE_SOLANA_USDC_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### 5.2 Install Dependencies

```bash
npm install
```

### 5.3 Build Frontend

```bash
npm run build
```

## Step 6: Deploy Frontend

### Option A: Deploy su Supabase

```bash
# Collega il progetto Supabase
supabase link --project-ref your_project_ref

# Deploy
supabase deploy
```

### Option B: Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option C: Deploy su Netlify

```bash
# Installa Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## Step 7: Post-Deployment Configuration

### 7.1 Update Contract Addresses

Aggiorna gli indirizzi dei contratti nel database Supabase:

```sql
INSERT INTO config (key, value) VALUES
  ('vault_address', '0x...'),
  ('strategy_address', '0x...'),
  ('nav_oracle_address', '0x...'),
  ('kyc_whitelist_address', '0x...'),
  ('cctp_receiver_address', '0x...'),
  ('solana_program_id', '...');
```

### 7.2 Initialize NAV Oracle

```bash
# Esegui script per impostare il NAV iniziale
forge script script/InitializeNAV.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast
```

### 7.3 Setup Admin Roles

```sql
-- Aggiungi admin al database
INSERT INTO admins (address) VALUES
  ('0xYourAdminAddress');
```

### 7.4 Test Integration

```bash
# Testa la connessione al vault
npm run test:integration
```

## Step 8: Monitoring Setup

### 8.1 Setup Logging

Configura logging su Supabase:

```sql
-- Abilita logging per le Edge Functions
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
ON logs FOR SELECT
USING (auth.role() = 'authenticated');
```

### 8.2 Setup Alerts

Configura alert per eventi critici:

```sql
-- Alert per depositi grandi
CREATE OR REPLACE FUNCTION notify_large_deposit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount > 10000 THEN
    PERFORM pg_notify('large_deposit', row_to_json(NEW)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER large_deposit_trigger
AFTER INSERT ON deposits
FOR EACH ROW
EXECUTE FUNCTION notify_large_deposit();
```

## Step 9: Security Checklist

### 9.1 Smart Contracts

- [ ] Contratti verificati su Etherscan/Basescan
- [ ] Ownership trasferito a multisig
- [ ] Pause mechanism testato
- [ ] Emergency withdrawal testato
- [ ] Rate limits configurati

### 9.2 Backend

- [ ] Row Level Security (RLS) abilitato su tutte le tabelle
- [ ] Service role key protetta
- [ ] CORS configurato correttamente
- [ ] Rate limiting abilitato sulle Edge Functions
- [ ] Backup automatici configurati

### 9.3 Frontend

- [ ] Environment variables non esposte
- [ ] HTTPS abilitato
- [ ] Content Security Policy configurata
- [ ] Input validation su tutti i form
- [ ] XSS protection abilitata

## Step 10: Testing

### 10.1 Test Smart Contracts

```bash
cd contracts-base
forge test -vvv
```

### 10.2 Test Solana Program

```bash
cd solana-program
anchor test
```

### 10.3 Test Frontend

```bash
cd frontend
npm run test
```

### 10.4 Test End-to-End

```bash
# Test deposito completo
npm run test:e2e:deposit

# Test prelievo completo
npm run test:e2e:withdraw

# Test CCTP bridge
npm run test:e2e:cctp
```

## Troubleshooting

### Deployment Fallisce

**Problema**: Deployment contratti fallisce con "insufficient funds"

**Soluzione**: Verifica di avere abbastanza ETH nel wallet per gas fees

---

**Problema**: Solana deployment fallisce

**Soluzione**: Aumenta il compute budget nel programma

---

### Edge Functions Non Funzionano

**Problema**: Edge Functions ritornano errore 500

**Soluzione**: Verifica i log su Supabase dashboard e controlla le variabili di ambiente

---

### Frontend Non Si Connette

**Problema**: Frontend non si connette al backend

**Soluzione**: Verifica CORS settings su Supabase e controlla le variabili di ambiente

---

## Maintenance

### Update Smart Contracts

```bash
# Deploy nuova versione
forge script script/Upgrade.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast

# Verifica upgrade
forge verify-contract ...
```

### Update Edge Functions

```bash
# Deploy aggiornamento
supabase functions deploy function-name
```

### Update Frontend

```bash
# Build nuova versione
npm run build

# Deploy
vercel --prod
```

## Rollback Procedure

### Rollback Smart Contracts

```bash
# Usa proxy pattern per rollback
forge script script/Rollback.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast
```

### Rollback Edge Functions

```bash
# Rollback a versione precedente
supabase functions deploy function-name --version previous
```

### Rollback Frontend

```bash
# Rollback su Vercel
vercel rollback
```

## Production Checklist

Prima di andare in produzione:

- [ ] Tutti i test passano
- [ ] Audit di sicurezza completato
- [ ] Documentazione completa
- [ ] Monitoring configurato
- [ ] Backup automatici attivi
- [ ] Emergency procedures documentate
- [ ] Team training completato
- [ ] Legal compliance verificata
- [ ] Insurance coverage attiva
- [ ] Disaster recovery plan testato

## Support

Per supporto tecnico durante il deployment, contattare Anton Carlo Santoro.

## License

Proprietary. All rights reserved.

Copyright (c) 2025 Anton Carlo Santoro
