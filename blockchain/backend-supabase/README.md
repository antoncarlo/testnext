# NextBlock Points System - Backend Off-Chain

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Panoramica

Sistema di punti e rewards off-chain per NextBlock, implementato su Supabase con TypeScript e Deno. Il sistema monitora l'attività on-chain degli utenti e calcola i punti in base a moltiplicatori predefiniti.

## Architettura

### Componenti

1. **Indexer (calculate-points)**: Edge Function schedulata che monitora la blockchain e calcola i punti
2. **Database PostgreSQL**: 3 tabelle per memorizzare utenti, punti e cronologia
3. **API REST**: 2 Edge Functions per esporre i dati al frontend

### Stack Tecnologico

- **Piattaforma**: Supabase (PostgreSQL + Edge Functions + Storage)
- **Linguaggio**: TypeScript
- **Runtime**: Deno (Supabase Edge Functions)
- **Database**: PostgreSQL 15
- **RPC Provider**: Alchemy / QuickNode

## Schema Database

### Tabella: users

Memorizza le informazioni di base degli utenti.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabella: points

Contiene il saldo totale dei punti per ogni utente.

```sql
CREATE TABLE points (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    total_points NUMERIC(20, 8) DEFAULT 0,
    rank INT,
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabella: points_history

Traccia ogni singolo calcolo di punti.

```sql
CREATE TABLE points_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    points_earned NUMERIC(20, 8) NOT NULL,
    calculation_date DATE NOT NULL,
    source_activity TEXT NOT NULL,
    multiplier NUMERIC(4, 2) NOT NULL,
    raw_balance NUMERIC(30, 18) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Moltiplicatori Punti

| Attività | Moltiplicatore | Descrizione |
|----------|----------------|-------------|
| Holding nbkUSDC | 1x | Semplice possesso di shares nel wallet |
| Fornire Liquidità DEX | 2x | LP su pool nbkUSDC/USDC |
| Collaterale Lending | 3x | Usare nbkUSDC come collaterale |
| Referral Program | 4x | Punti bonus per referral |

## Edge Functions

### 1. calculate-points (Indexer)

Funzione schedulata che calcola i punti per tutti gli utenti.

**Endpoint**: `POST /functions/v1/calculate-points`

**Autenticazione**: Bearer token (CRON_SECRET)

**Flusso**:
1. Ottiene tutti gli utenti dal database
2. Per ogni utente, query posizioni on-chain
3. Calcola punti applicando moltiplicatori
4. Salva in database tramite stored procedure
5. Ricalcola ranking globale

### 2. get-user-points

API per ottenere i punti di un utente specifico.

**Endpoint**: `GET /functions/v1/get-user-points?wallet=0x...`

**Risposta**:
```json
{
  "walletAddress": "0x123...",
  "totalPoints": "12540.78",
  "rank": 42,
  "history": [
    {
      "date": "2025-11-25",
      "pointsEarned": "540.12",
      "activity": "lp_dex",
      "multiplier": 2.0
    }
  ]
}
```

### 3. get-leaderboard

API per ottenere la classifica globale.

**Endpoint**: `GET /functions/v1/get-leaderboard?page=1&limit=20`

**Risposta**:
```json
{
  "page": 1,
  "limit": 20,
  "totalUsers": 1500,
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "0xabc...",
      "totalPoints": "543210.99"
    }
  ]
}
```

## Setup Locale

### Prerequisiti

- Node.js 18+
- Supabase CLI
- Docker (per Supabase local)

### Installazione

```bash
# 1. Installa Supabase CLI
npm install -g supabase

# 2. Installa dipendenze
npm install

# 3. Copia .env.example in .env
cp .env.example .env

# 4. Edita .env con i tuoi valori
nano .env

# 5. Avvia Supabase locale
supabase start

# 6. Applica migrations
supabase db push

# 7. Testa Edge Functions localmente
supabase functions serve
```

### Testing Locale

```bash
# Test calculate-points
curl -X POST http://localhost:54321/functions/v1/calculate-points \
  -H "Authorization: Bearer your-cron-secret"

# Test get-user-points
curl "http://localhost:54321/functions/v1/get-user-points?wallet=0x..."

# Test get-leaderboard
curl "http://localhost:54321/functions/v1/get-leaderboard?page=1&limit=20"
```

## Deployment su Supabase Cloud

### 1. Crea Progetto Supabase

```bash
# Login
supabase login

# Link al progetto
supabase link --project-ref your-project-ref
```

### 2. Deploy Database Schema

```bash
# Applica migrations
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy tutte le functions
supabase functions deploy calculate-points
supabase functions deploy get-user-points
supabase functions deploy get-leaderboard

# Oppure deploy tutte insieme
supabase functions deploy
```

### 4. Configura Variabili Ambiente

Nel Supabase Dashboard, vai su Settings > Edge Functions > Environment Variables e aggiungi:

- `BASE_RPC_URL`
- `NEXTBLOCK_VAULT_ADDRESS`
- `USDC_BASE_ADDRESS`
- `LP_POOLS`
- `LENDING_PLATFORMS`
- `CRON_SECRET`

### 5. Setup Cron Job

Esegui questa query nel SQL Editor di Supabase:

```sql
-- Abilita pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule calculate-points ogni giorno alle 00:00 UTC
SELECT cron.schedule(
    'calculate-daily-points',
    '0 0 * * *',
    $$
    SELECT net.http_post(
        url:='https://your-project.supabase.co/functions/v1/calculate-points',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    ) as request_id;
    $$
);

-- Verifica cron jobs attivi
SELECT * FROM cron.job;
```

## Monitoring e Logging

### Visualizzare Logs

```bash
# Logs in tempo reale
supabase functions logs calculate-points --follow

# Logs specifici
supabase functions logs get-user-points --limit 100
```

### Dashboard Supabase

Nel Dashboard puoi monitorare:
- Invocazioni Edge Functions
- Errori e performance
- Database queries
- Storage usage

## Ottimizzazioni

### Performance

1. **Batch Processing**: Processa utenti in batch per ridurre carico RPC
2. **Caching**: Usa Redis per cachare leaderboard
3. **Indici Database**: Già configurati per query ottimali
4. **Rate Limiting**: Implementa rate limiting sulle API pubbliche

### Scalabilità

Per > 10K utenti:

1. **Parallelizzazione**: Usa Deno Workers per processare utenti in parallelo
2. **RPC Dedicato**: Usa QuickNode o Alchemy tier superiore
3. **Database Pooling**: Configura connection pooling
4. **CDN**: Usa Cloudflare per cachare leaderboard

## Sicurezza

### Best Practices

1. **Service Role Key**: Mai esporre nel frontend
2. **CORS**: Configurato solo per domini autorizzati
3. **Rate Limiting**: Implementato a livello Supabase
4. **Input Validation**: Tutti gli input sono validati
5. **SQL Injection**: Usato sempre parametrized queries

### Audit Trail

Ogni calcolo punti è tracciato in `points_history` con:
- Timestamp
- Saldo raw on-chain
- Moltiplicatore applicato
- Punti guadagnati

## Troubleshooting

### Problema: Cron job non si esegue

**Soluzione**:
```sql
-- Verifica che pg_cron sia abilitato
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Verifica jobs schedulati
SELECT * FROM cron.job;

-- Verifica esecuzioni
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Problema: Edge Function timeout

**Soluzione**:
- Riduci batch size
- Aumenta timeout in config.toml
- Ottimizza query RPC

### Problema: Punti duplicati

**Soluzione**:
La stored procedure `update_user_points` è idempotente. Controlla se i punti per una data sono già stati calcolati prima di inserirli.

## Costi Stimati

### Supabase

- **Free Tier**: 500MB database, 2GB bandwidth, 500K invocations/mese
- **Pro Tier** ($25/mese): 8GB database, 50GB bandwidth, 2M invocations
- **Raccomandato**: Pro tier per produzione

### RPC Services

- **Alchemy**: $49-199/mese
- **QuickNode**: $49-299/mese
- **Raccomandato**: $50-100/mese per early stage

### Totale Mensile

- **Early Stage** (< 1K utenti): ~$75/mese
- **Growth** (1K-10K utenti): ~$250/mese
- **Scale** (10K+ utenti): $500+/mese

## Roadmap

### Fase 1: MVP (Completata)

- [x] Schema database
- [x] Indexer base
- [x] API get-user-points
- [x] API get-leaderboard

### Fase 2: Ottimizzazioni

- [ ] Batch processing
- [ ] Caching con Redis
- [ ] Rate limiting avanzato
- [ ] Monitoring dashboard

### Fase 3: Features Avanzate

- [ ] Sistema referral completo
- [ ] Integrazione lending platforms
- [ ] Multi-chain support (Solana)
- [ ] Airdrop automation

## Supporto

Per domande o supporto:
- Email: support@nextblock.io
- Documentation: https://docs.nextblock.io
- GitHub Issues: https://github.com/nextblock/backend

## Licenza

Proprietario. Tutti i diritti riservati.

Copyright (c) 2025 Anton Carlo Santoro
