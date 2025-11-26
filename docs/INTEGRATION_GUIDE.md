# TESTNEXT - Integration Guide

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Overview

Questa guida descrive come tutte le componenti di TESTNEXT sono integrate tra loro per creare una piattaforma completa di tokenizzazione assicurativa.

## Architettura Integrata

TESTNEXT integra tre componenti principali:

1. **Frontend Application** (da nextblock-re-engine)
2. **Blockchain Infrastructure** (da NEXTBLOCK-RE)
3. **Backend & Database** (Supabase)

## Flow di Integrazione

### 1. Connessione Wallet

#### Base Chain (Web3-Onboard)

```typescript
import { useConnectWallet } from '@web3-onboard/react';

const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();

// Connetti wallet Base
await connect();
```

#### Solana (Wallet Adapter)

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

const { publicKey, connect, disconnect } = useWallet();

// Connetti wallet Solana
await connect();
```

### 2. Interazione con Smart Contracts

#### Deposito su Base

```typescript
import { useBaseContracts } from '@/hooks/useBaseContracts';

const { deposit, vaultInfo } = useBaseContracts();

// 1. Approva USDC
// 2. Deposita nel vault
const receipt = await deposit('100.00');

// 3. Aggiorna UI con nuove informazioni vault
await fetchVaultInfo(userAddress);
```

#### Deposito da Solana via CCTP

```typescript
import { useSolanaProgram } from '@/hooks/useSolanaProgram';

const { depositViaCCTP } = useSolanaProgram();

// 1. Deposita USDC da Solana
const result = await depositViaCCTP(100, baseWalletAddress);

// 2. CCTP bridge trasferisce fondi a Base
// 3. Fondi arrivano nel vault Base
```

### 3. Sistema Punti

Il sistema punti è completamente integrato con Supabase e si aggiorna automaticamente.

#### Calcolo Punti

I punti vengono calcolati in base a:

- **1x**: Holding nbkUSDC tokens
- **2x**: Liquidity provision su DEX
- **3x**: Lending collateral con nbkUSDC
- **4x**: Referral program

#### Aggiornamento Automatico

```typescript
// Edge Function su Supabase (cron job ogni ora)
// backend-supabase/supabase/functions/calculate-points/index.ts

export async function calculateUserPoints(address: string) {
  // 1. Recupera balance nbkUSDC dal vault Base
  const balance = await fetchVaultBalance(address);
  
  // 2. Calcola punti holding
  const holdingPoints = balance * 1;
  
  // 3. Recupera posizioni DeFi
  const defiPositions = await fetchDefiPositions(address);
  
  // 4. Calcola punti liquidity
  const liquidityPoints = defiPositions.liquidity * 2;
  
  // 5. Calcola punti lending
  const lendingPoints = defiPositions.lending * 3;
  
  // 6. Calcola punti referral
  const referralPoints = await calculateReferralPoints(address);
  
  // 7. Aggiorna database
  await updateUserPoints(address, {
    holding: holdingPoints,
    liquidity: liquidityPoints,
    lending: lendingPoints,
    referral: referralPoints,
    total: holdingPoints + liquidityPoints + lendingPoints + referralPoints,
  });
}
```

#### Visualizzazione Frontend

```typescript
import { usePointsSystem } from '@/hooks/usePointsSystem';

const { userPoints, leaderboard } = usePointsSystem(userAddress);

// Mostra punti utente
<div>
  <h3>I tuoi punti: {userPoints?.totalPoints}</h3>
  <p>Rank: #{userPoints?.rank}</p>
  
  <h4>Breakdown:</h4>
  <ul>
    <li>Holding: {userPoints?.breakdown.holding}</li>
    <li>Liquidity: {userPoints?.breakdown.liquidity}</li>
    <li>Lending: {userPoints?.breakdown.lending}</li>
    <li>Referral: {userPoints?.breakdown.referral}</li>
  </ul>
</div>
```

### 4. Tracking Transazioni

Tutte le transazioni vengono tracciatte su Supabase per analytics e storico.

#### Indexing Deposits

```typescript
// Edge Function: index-deposit
export async function indexDeposit(txHash: string, chain: 'base' | 'solana') {
  // 1. Recupera dettagli transazione dalla blockchain
  const tx = await fetchTransaction(txHash, chain);
  
  // 2. Estrai dati rilevanti
  const depositData = {
    user_address: tx.from,
    amount: tx.value,
    chain: chain,
    tx_hash: txHash,
    timestamp: tx.timestamp,
    status: 'completed',
  };
  
  // 3. Salva nel database
  await supabase.from('deposits').insert(depositData);
  
  // 4. Trigger calcolo punti
  await calculateUserPoints(tx.from);
}
```

### 5. Cross-Chain Bridge (CCTP)

L'integrazione CCTP permette depositi seamless da Solana a Base.

#### Flow Completo

1. **Utente deposita USDC su Solana**
   - Transazione verso programma Solana
   - Programma brucia USDC su Solana
   - Emette messaggio CCTP

2. **CCTP Bridge**
   - Circle CCTP valida messaggio
   - Minta USDC su Base
   - Invia a CCTPReceiver contract

3. **CCTPReceiver su Base**
   - Riceve USDC
   - Approva vault
   - Deposita automaticamente nel vault
   - Minta nbkUSDC per utente

4. **Aggiornamento Database**
   - Edge Function indicizza deposito
   - Aggiorna balance utente
   - Calcola nuovi punti

### 6. Analytics e Reporting

Tutti i dati sono aggregati per analytics in tempo reale.

#### Dashboard Metrics

```typescript
// Recupera metriche aggregate
const metrics = {
  totalValueLocked: await getTotalVaultAssets(),
  totalUsers: await getUserCount(),
  totalDeposits: await getDepositCount(),
  averageAPY: await calculateAverageAPY(),
  topHolders: await getTopHolders(10),
};
```

## Database Schema

### Tabelle Principali

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  referral_code TEXT UNIQUE,
  referred_by TEXT REFERENCES users(referral_code)
);
```

#### user_points
```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  total_points NUMERIC DEFAULT 0,
  holding_points NUMERIC DEFAULT 0,
  liquidity_points NUMERIC DEFAULT 0,
  lending_points NUMERIC DEFAULT 0,
  referral_points NUMERIC DEFAULT 0,
  rank INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

#### deposits
```sql
CREATE TABLE deposits (
  id UUID PRIMARY KEY,
  user_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);
```

#### withdrawals
```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY,
  user_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);
```

## Edge Functions

### get-user-points
Recupera punti per un utente specifico.

### get-leaderboard
Recupera la classifica degli utenti.

### index-deposit
Indicizza un nuovo deposito.

### index-withdrawal
Indicizza un nuovo prelievo.

### calculate-points
Calcola e aggiorna i punti per tutti gli utenti (cron job).

## Environment Variables

### Frontend
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BASE_RPC_URL=
VITE_VAULT_ADDRESS=
VITE_SOLANA_RPC_URL=
VITE_SOLANA_PROGRAM_ID=
```

### Backend (Supabase Edge Functions)
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BASE_RPC_URL=
SOLANA_RPC_URL=
```

## Testing Integration

### Test Deposit Flow

```typescript
// 1. Connetti wallet Base
await connectBaseWallet();

// 2. Approva USDC
await approveUSDC(vaultAddress, amount);

// 3. Deposita
const tx = await deposit(amount);

// 4. Attendi conferma
await tx.wait();

// 5. Verifica balance aggiornato
const newBalance = await getVaultBalance(userAddress);

// 6. Verifica punti aggiornati
const points = await getUserPoints(userAddress);
```

### Test CCTP Bridge

```typescript
// 1. Connetti wallet Solana
await connectSolanaWallet();

// 2. Deposita via CCTP
const signature = await depositViaCCTP(amount, baseAddress);

// 3. Attendi conferma Solana
await confirmTransaction(signature);

// 4. Attendi arrivo su Base (3-5 minuti)
await waitForCCTPCompletion(signature);

// 5. Verifica balance Base
const baseBalance = await getVaultBalance(baseAddress);
```

## Troubleshooting

### Wallet non si connette
- Verifica che il wallet sia installato
- Verifica la rete corretta
- Controlla le variabili di ambiente

### Transazione fallisce
- Verifica balance sufficiente
- Verifica allowance USDC
- Controlla gas fee

### Punti non si aggiornano
- Verifica che il cron job sia attivo
- Controlla i log delle Edge Functions
- Verifica la connessione al database

### CCTP bridge lento
- Il bridge CCTP richiede 3-5 minuti
- Verifica lo stato su Circle CCTP explorer
- Controlla che il messaggio sia stato attestato

## Best Practices

1. **Gestione Errori**: Sempre gestire errori di rete e blockchain
2. **Loading States**: Mostrare stati di caricamento durante operazioni async
3. **Transaction Confirmation**: Attendere conferme blockchain prima di aggiornare UI
4. **Cache Management**: Utilizzare React Query per caching efficiente
5. **Security**: Non esporre chiavi private, usare variabili di ambiente

## Support

Per supporto tecnico, contattare Anton Carlo Santoro.

## License

Proprietary. All rights reserved.

Copyright (c) 2025 Anton Carlo Santoro
