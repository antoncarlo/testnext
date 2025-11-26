# TESTNEXT Frontend

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Overview

Frontend completo per la piattaforma TESTNEXT che integra:
- Applicazione web da nextblock-re-engine (Lovable)
- Infrastruttura blockchain da NEXTBLOCK-RE
- Sistema di punti e rewards
- Integrazione CCTP per cross-chain deposits

## Architettura

### Stack Tecnologico

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + tRPC
- **Blockchain Integration**:
  - Base: ethers.js + Web3-Onboard
  - Solana: @solana/web3.js + Wallet Adapter
- **Backend**: Supabase (Database + Edge Functions)
- **Database ORM**: Drizzle ORM

### Struttura Directory

```
frontend/
├── src/
│   ├── components/         # Componenti React riutilizzabili
│   │   ├── ui/            # Componenti shadcn/ui
│   │   ├── AdminRoute.tsx
│   │   ├── DepositCard.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── TransactionHistory.tsx
│   │   ├── UserStats.tsx
│   │   └── WalletConnect.tsx
│   │
│   ├── pages/             # Pagine dell'applicazione
│   │   ├── Activity.tsx
│   │   ├── Admin.tsx
│   │   ├── Analytics.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeFiOpportunities.tsx
│   │   ├── Deposit.tsx
│   │   ├── Index.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Profile.tsx
│   │   ├── Referral.tsx
│   │   ├── Transparency.tsx
│   │   ├── UserDetail.tsx
│   │   ├── Vaults.tsx
│   │   └── Withdraw.tsx
│   │
│   ├── hooks/             # Custom React Hooks
│   │   ├── useActivityLogger.tsx
│   │   ├── useAdminCheck.tsx
│   │   ├── useAuth.tsx
│   │   ├── useBaseContracts.tsx    # Integrazione contratti Base
│   │   ├── useSolanaProgram.tsx    # Integrazione programma Solana
│   │   ├── usePointsSystem.tsx     # Sistema punti
│   │   ├── useUserDefiPositions.tsx
│   │   ├── useWallet.tsx
│   │   └── useWalletBalance.tsx
│   │
│   ├── config/            # Configurazioni
│   │   ├── blockchain.ts  # Configurazione blockchain (Base + Solana)
│   │   └── supabase.ts    # Configurazione Supabase
│   │
│   ├── lib/               # Utilities e helpers
│   │   └── utils.ts
│   │
│   ├── App.tsx            # Componente principale
│   └── main.tsx           # Entry point
│
├── server/                # Backend tRPC
│   ├── _core/            # Core server logic
│   ├── points.ts         # Router per sistema punti
│   ├── routers.ts        # Router principale
│   ├── db.ts             # Database connection
│   └── storage.ts        # Storage utilities
│
├── shared/               # Codice condiviso client/server
│   ├── const.ts
│   └── types.ts
│
├── drizzle/              # Database schema e migrations
│   ├── schema.ts
│   └── relations.ts
│
├── supabase/             # Configurazione Supabase
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
│
├── public/               # Asset statici
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Setup

### Prerequisiti

- Node.js 18+
- npm o pnpm
- Account Supabase
- Wallet per Base (MetaMask, Coinbase Wallet, etc.)
- Wallet per Solana (Phantom, Solflare, etc.)

### Installazione

```bash
cd frontend
npm install
```

### Configurazione

1. Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

2. Configura le variabili di ambiente nel file `.env`:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Base Chain
VITE_VAULT_ADDRESS=your_vault_address
VITE_STRATEGY_ADDRESS=your_strategy_address
# ... altre variabili

# Solana
VITE_SOLANA_PROGRAM_ID=your_solana_program_id
# ... altre variabili
```

### Avvio Sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

### Build Produzione

```bash
npm run build
```

I file di build saranno generati nella directory `dist/`

## Integrazione Blockchain

### Base Chain

L'integrazione con Base è gestita tramite il hook `useBaseContracts`:

```typescript
import { useBaseContracts } from '@/hooks/useBaseContracts';

const { vaultInfo, deposit, withdraw, fetchVaultInfo } = useBaseContracts();

// Deposita USDC nel vault
await deposit('100.00');

// Preleva USDC dal vault
await withdraw('50.00');
```

### Solana

L'integrazione con Solana è gestita tramite il hook `useSolanaProgram`:

```typescript
import { useSolanaProgram } from '@/hooks/useSolanaProgram';

const { depositInfo, depositViaCCTP } = useSolanaProgram();

// Deposita USDC da Solana a Base via CCTP
await depositViaCCTP(100, baseWalletAddress);
```

### Sistema Punti

Il sistema punti è integrato con Supabase tramite il hook `usePointsSystem`:

```typescript
import { usePointsSystem } from '@/hooks/usePointsSystem';

const { userPoints, leaderboard, fetchUserPoints } = usePointsSystem(userAddress);

// Recupera punti utente
await fetchUserPoints(userAddress);
```

## Pagine Principali

### Dashboard
Panoramica generale con statistiche utente, saldo vault, punti e grafici.

### Deposit
Interfaccia per depositare USDC nel vault da Base o Solana (via CCTP).

### Withdraw
Interfaccia per prelevare USDC dal vault.

### Portfolio
Visualizzazione dettagliata delle posizioni dell'utente.

### Leaderboard
Classifica degli utenti in base ai punti accumulati.

### Analytics
Grafici e statistiche avanzate della piattaforma.

### Vaults
Gestione e visualizzazione dei vault disponibili.

### DeFi Opportunities
Opportunità di yield farming e lending con nbkUSDC.

### Referral
Sistema di referral con codici e tracking.

### Admin
Pannello amministrativo per la gestione della piattaforma.

## Testing

```bash
npm run test
```

## Deployment

### Supabase

Il frontend può essere deployato su Supabase:

```bash
supabase deploy
```

### Vercel

Oppure su Vercel:

```bash
vercel deploy
```

### Netlify

O su Netlify:

```bash
netlify deploy
```

## Troubleshooting

### Wallet non si connette

Verifica che:
- Il wallet sia installato e sbloccato
- La rete corretta sia selezionata (Base Mainnet o Sepolia)
- Le variabili di ambiente siano configurate correttamente

### Errori Supabase

Verifica che:
- Le credenziali Supabase siano corrette
- Le Edge Functions siano deployate
- Le migrazioni del database siano applicate

### Errori CCTP

Verifica che:
- Gli indirizzi dei contratti CCTP siano corretti
- Il wallet abbia fondi sufficienti per le fee
- La rete Solana sia raggiungibile

## Supporto

Per supporto e domande, contattare Anton Carlo Santoro.

## License

Proprietary. All rights reserved.

Copyright (c) 2025 Anton Carlo Santoro
