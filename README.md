# TESTNEXT - Insurance Tokenization Platform

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Overview

TESTNEXT è una piattaforma completa per la tokenizzazione di portafogli assicurativi, che integra l'applicazione web completa di nextblock-re-engine con l'infrastruttura completa di NEXTBLOCK-RE. La piattaforma permette agli investitori di guadagnare rendimenti attraverso asset assicurativi tokenizzati, operando su un'architettura dual-chain (Base + Solana) con un sistema di punti e rewards off-chain.

## Quick Start

### Installazione

```bash
git clone https://github.com/antoncarlo/testnext.git
cd testnext
npm install
```

### Configurazione

Copia il file `.env.example` in `.env` e configura le variabili:

```bash
cp .env.example .env
```

### Sviluppo Locale

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

### Build Produzione

```bash
npm run build
```

### Deploy su Vercel

```bash
vercel deploy --prod
```

## Architettura

### Blockchain Layer

**Base (Core Chain)**
- Vault ERC-4626 compliant per depositi USDC
- Strategia assicurativa per la gestione del portafoglio
- Oracle NAV per la valutazione in tempo reale
- Whitelist KYC per la compliance
- CCTP receiver per depositi cross-chain

**Solana (Satellite Chain)**
- Gateway per depositi USDC
- Bridge Circle CCTP verso Base
- Tracking e storico dei depositi

### Off-Chain Backend

**Infrastruttura Supabase**
- Database PostgreSQL per utenti e punti
- Edge Functions per indicizzazione e API
- Cron jobs schedulati per calcoli automatici
- REST API per integrazione frontend

### Frontend Application

**Applicazione Web Completa**
- React con Vite per performance ottimali
- Integrazione wallet per Base e Solana
- UI moderna con shadcn/ui e Tailwind CSS
- Sistema di autenticazione completo
- Dashboard per gestione portafoglio
- Sistema di referral e leaderboard

## Struttura Repository

```
testnext/
├── src/                     # Codice sorgente React
│   ├── components/          # Componenti riutilizzabili
│   ├── pages/               # Pagine dell'applicazione
│   ├── hooks/               # Custom hooks
│   ├── config/              # Configurazioni
│   └── lib/                 # Utilities e helpers
│
├── public/                  # Asset statici
├── server/                  # Backend tRPC
├── supabase/                # Configurazione Supabase
├── drizzle/                 # Schema database
│
├── blockchain/              # Infrastruttura blockchain
│   ├── contracts-base/      # Smart contracts Solidity per Base
│   ├── solana-program/      # Programma Rust per Solana
│   └── backend-supabase/    # Backend off-chain Supabase
│
├── docs/                    # Documentazione aggiuntiva
│   ├── INTEGRATION_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── API_DOCUMENTATION.md
│
├── package.json             # Dipendenze frontend
├── vite.config.ts           # Configurazione Vite
├── vercel.json              # Configurazione Vercel
└── README.md                # Questo file
```

## Features

### Smart Contracts (Base)

- **NextBlockVault**: Vault ERC-4626 per depositi USDC con pricing basato su NAV
- **InsuranceStrategy**: Strategia di investimento per portafogli assicurativi
- **NavOracle**: Oracle on-chain per aggiornamenti Net Asset Value
- **KycWhitelist**: Layer di compliance per verifica utenti
- **CCTPReceiver**: Receiver per depositi cross-chain da Solana

### Solana Program

- **NextBlockSatellite**: Gateway per utenti Solana per depositare USDC
- **Integrazione CCTP**: Bridge seamless verso Base usando Circle CCTP
- **Deposit Tracking**: Storico completo dei depositi cross-chain

### Frontend Application

- **React + Vite**: Framework moderno per performance ottimali
- **Wallet Integration**: Supporto per Base (Web3-Onboard) e Solana (Wallet Adapter)
- **Pagine Complete**: Dashboard, Deposit, Withdraw, Portfolio, Analytics, Leaderboard
- **CCTP Bridge UI**: Flow completo per depositi cross-chain
- **Points Dashboard**: Punti in tempo reale e leaderboard
- **Sistema di Referral**: Programma referral con bonus
- **Admin Panel**: Gestione utenti e configurazioni

### Sistema Punti

Gli utenti guadagnano punti basati sulla loro attività:
- **1x**: Holding di token nbkUSDC
- **2x**: Fornitura di liquidità su DEX
- **3x**: Utilizzo di nbkUSDC come collaterale per lending
- **4x**: Bonus programma referral

## Technology Stack

| Componente | Tecnologia |
|-----------|------------|
| Contratti Base | Solidity 0.8.20, Foundry |
| Programma Solana | Rust, Anchor Framework |
| Backend | TypeScript, Deno, Supabase |
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | PostgreSQL 15 |
| RPC | QuickNode, Alchemy |

## Environment Variables

Crea un file `.env` con le seguenti variabili:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Base Chain
VITE_NETWORK=mainnet
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_VAULT_ADDRESS=your_vault_address
VITE_STRATEGY_ADDRESS=your_strategy_address
VITE_NAV_ORACLE_ADDRESS=your_nav_oracle_address
VITE_KYC_WHITELIST_ADDRESS=your_kyc_whitelist_address
VITE_CCTP_RECEIVER_ADDRESS=your_cctp_receiver_address
VITE_BASE_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Solana
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_PROGRAM_ID=your_solana_program_id
VITE_SOLANA_USDC_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## Deployment

### Deploy Smart Contracts

```bash
cd blockchain/contracts-base
forge install
forge build
forge script script/DeployTestnet.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast
```

### Deploy Solana Program

```bash
cd blockchain/solana-program
anchor build
anchor deploy --provider.cluster devnet
```

### Setup Backend

```bash
cd blockchain/backend-supabase
npm install
supabase start
supabase db push
supabase functions deploy
```

### Deploy Frontend

#### Vercel (Raccomandato)

```bash
vercel deploy --prod
```

#### Netlify

```bash
netlify deploy --prod
```

#### Supabase

```bash
supabase deploy
```

## Documentazione

- [Integration Guide](./docs/INTEGRATION_GUIDE.md) - Guida all'integrazione completa
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Guida al deployment
- [Smart Contracts](./blockchain/contracts-base/README.md) - Documentazione contratti Base
- [Solana Program](./blockchain/solana-program/README.md) - Documentazione programma Solana
- [Backend](./blockchain/backend-supabase/README.md) - Documentazione backend

## Deployment Status

| Componente | Status | Environment |
|-----------|--------|-------------|
| Base Contracts | Ready | Testnet |
| Solana Program | Ready | Devnet |
| Supabase Backend | Ready | Production |
| Frontend | Deployed | Vercel |
| GitHub Repository | Public | Production |

## Security

Questo codebase non è stato ancora auditato. Non utilizzare in produzione senza un audit di sicurezza professionale.

### Auditor Raccomandati

- OpenZeppelin
- Trail of Bits
- Certik
- Halborn

## License

Proprietary. All rights reserved.

Copyright (c) 2025 Anton Carlo Santoro

## Contact

- **Developer**: Anton Carlo Santoro
- **Project**: TESTNEXT
- **Repository**: https://github.com/antoncarlo/testnext
- **Issues**: https://github.com/antoncarlo/testnext/issues

## Acknowledgments

Questo progetto si basa su e adatta codice da:
- OpenZeppelin Contracts
- Beefy Finance
- Yearn Finance
- OnRe.finance
- Circle CCTP

## Disclaimer

Questo software è fornito "as is", senza garanzie di alcun tipo. Utilizzare a proprio rischio.
# Force rebuild Thu Nov 27 17:49:48 EST 2025
