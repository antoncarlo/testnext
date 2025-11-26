# TESTNEXT - Insurance Tokenization Platform

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Overview

TESTNEXT è una piattaforma completa per la tokenizzazione di portafogli assicurativi, che integra l'applicazione web completa di nextblock-re-engine con l'infrastruttura completa di NEXTBLOCK-RE. La piattaforma permette agli investitori di guadagnare rendimenti attraverso asset assicurativi tokenizzati, operando su un'architettura dual-chain (Base + Solana) con un sistema di punti e rewards off-chain.

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
├── contracts-base/          # Smart contracts Solidity per Base
│   ├── src/                 # File sorgenti dei contratti
│   ├── script/              # Script di deployment
│   ├── test/                # File di test
│   └── README.md
│
├── solana-program/          # Programma Rust per Solana
│   ├── programs/            # Programma Anchor
│   ├── scripts/             # Script di testing
│   └── README.md
│
├── backend-supabase/        # Backend off-chain
│   ├── supabase/
│   │   ├── functions/       # Edge Functions
│   │   └── migrations/      # Migrazioni database
│   ├── scripts/             # Script di setup
│   └── README.md
│
├── frontend/                # Applicazione web completa
│   ├── src/                 # Codice sorgente React
│   │   ├── components/      # Componenti riutilizzabili
│   │   ├── pages/           # Pagine dell'applicazione
│   │   ├── hooks/           # Custom hooks
│   │   └── lib/             # Utilities e helpers
│   ├── public/              # Asset statici
│   ├── supabase/            # Configurazione Supabase
│   └── README.md
│
└── docs/                    # Documentazione aggiuntiva
    ├── INTEGRATION_GUIDE.md
    ├── DEPLOYMENT_GUIDE.md
    └── API_DOCUMENTATION.md
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

## Quick Start

### Prerequisiti

- Node.js 18+
- Rust e Anchor CLI
- Foundry
- Supabase CLI
- Git

### Clone Repository

```bash
git clone https://github.com/antoncarlo/testnext.git
cd testnext
```

### Deploy Base Contracts

```bash
cd contracts-base
forge install
forge build
forge script script/DeployTestnet.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast
```

### Deploy Solana Program

```bash
cd solana-program
anchor build
anchor deploy --provider.cluster devnet
```

### Setup Backend

```bash
cd backend-supabase
npm install
cp .env.example .env
# Modifica .env con la tua configurazione
supabase start
supabase db push
supabase functions deploy
```

### Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Modifica .env con la tua configurazione
npm run dev
```

## Documentazione

- [Guida all'Integrazione](./docs/INTEGRATION_GUIDE.md)
- [Guida al Deployment](./docs/DEPLOYMENT_GUIDE.md)
- [Documentazione API](./docs/API_DOCUMENTATION.md)
- [Contratti Base README](./contracts-base/README.md)
- [Programma Solana README](./solana-program/README.md)
- [Backend README](./backend-supabase/README.md)

## Deployment Status

| Componente | Testnet | Mainnet |
|-----------|---------|---------|
| Contratti Base | Ready | Pending |
| Programma Solana | Ready | Pending |
| Backend Supabase | Deployed | Pending |
| Frontend | Completed | Pending |

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
- **Website**: [To be configured]
- **Email**: [To be configured]

## Acknowledgments

Questo progetto si basa su e adatta codice da:
- OpenZeppelin Contracts
- Beefy Finance
- Yearn Finance
- OnRe.finance
- Circle CCTP

## Disclaimer

Questo software è fornito "as is", senza garanzie di alcun tipo. Utilizzare a proprio rischio.
