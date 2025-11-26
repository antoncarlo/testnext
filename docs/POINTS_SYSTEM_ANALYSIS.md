# NextBlock - Analisi Sistema di Punti e Backend Off-Chain

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.  
**Data**: 26 Novembre 2025

## Executive Summary

Dopo aver analizzato i documenti forniti, ho identificato i requisiti per implementare un sistema di punti e rewards per NextBlock basato sull'approccio di OnRe.finance. Il sistema sarà completamente off-chain, gestito da un backend serverless su Supabase.

## Conclusioni Chiave dall'Analisi OnRe.finance

### Sistema Off-Chain

Il sistema di punti di OnRe NON è implementato on-chain negli smart contract. Si tratta di un sistema off-chain gestito da un backend centralizzato che:

1. Monitora l'attività on-chain degli utenti
2. Calcola i punti in base a regole predefinite
3. Memorizza i punti in un database centralizzato
4. Espone i dati tramite API alla web app

Questo approccio è comune nel mondo DeFi: il protocollo core è decentralizzato, mentre il programma di incentivi è gestito off-chain per maggiore flessibilità.

### Meccanismo di Calcolo OnRe

Il sistema OnRe premia la "capital efficiency", ovvero l'utilizzo attivo del token ONyc:

**Moltiplicatori di Punti:**
- 1x: Semplice possesso di ONyc nel wallet
- 2x: Fornire liquidità su DEX (es. Kamino, Orca)
- 3x: Usare ONyc come collaterale nel lending (es. Loopscale)
- 4x: Yield trading (es. Exponent)

**Flusso Operativo:**
1. Indexer (Cron Job): Eseguito a intervalli regolari tramite Supabase Edge Function
2. Raccolta Dati: Interroga RPC endpoints per ottenere indirizzi utenti con token
3. Tracciamento Token: Controlla saldo e posizione nei vari protocolli DeFi
4. Calcolo Punti: Applica moltiplicatori in base all'attività
5. Salvataggio: Memorizza nel database PostgreSQL
6. API Frontend: Edge Function REST per esporre i dati

## Architettura Proposta per NextBlock

### Stack Tecnologico

| Componente | Tecnologia | Motivazione |
|------------|------------|-------------|
| Piattaforma Cloud | Supabase | Ambiente integrato con PostgreSQL, Auth, Edge Functions e Storage |
| Linguaggio Backend | TypeScript | Sicurezza dei tipi ed ecosistema robusto |
| Runtime Backend | Deno (Supabase Edge Functions) | Runtime predefinito per Supabase Edge Functions |
| Database | Supabase (PostgreSQL) | Database relazionale potente e affidabile |
| Accesso Blockchain | Servizi RPC (QuickNode, Alchemy) | API ad alte prestazioni per Base e Solana |

### Componenti del Sistema

L'architettura è composta da tre componenti principali:

1. **Indexer (Processo Schedulato)**: Supabase Edge Function eseguita a intervalli regolari
2. **Database**: PostgreSQL per memorizzare utenti, punti e cronologia
3. **API per Frontend**: Edge Functions REST per esporre i dati

## Schema Database PostgreSQL

### Tabella: users

Memorizza le informazioni di base degli utenti.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
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

CREATE INDEX idx_points_rank ON points(rank);
CREATE INDEX idx_points_total ON points(total_points DESC);
```

### Tabella: points_history

Traccia ogni singolo calcolo di punti, fornendo una cronologia dettagliata.

```sql
CREATE TABLE points_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    points_earned NUMERIC(20, 8) NOT NULL,
    calculation_date DATE NOT NULL,
    source_activity TEXT NOT NULL, -- 'holding', 'lp_beefy_usdc_next', etc.
    multiplier NUMERIC(4, 2) NOT NULL,
    raw_balance NUMERIC(30, 18) NOT NULL, -- Saldo che ha generato i punti
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_points_history_user ON points_history(user_id);
CREATE INDEX idx_points_history_date ON points_history(calculation_date);
CREATE INDEX idx_points_history_activity ON points_history(source_activity);
```

## Regole di Business per NextBlock

### Attività Premiate

Basandoci sul modello OnRe, adattiamo per NextBlock:

**Token Principale**: nbkUSDC (shares del vault)

**Moltiplicatori Proposti:**

1. **1x - Holding nbkUSDC**
   - Semplice possesso di shares nel wallet
   - Calcolo: `balance_nbkUSDC * 1`

2. **2x - Fornire Liquidità DEX**
   - LP su pool nbkUSDC/USDC su Base (es. Uniswap V3, Aerodrome)
   - Calcolo: `lp_balance_nbkUSDC * 2`

3. **3x - Collaterale Lending**
   - Usare nbkUSDC come collaterale su piattaforme lending Base
   - Calcolo: `lending_balance_nbkUSDC * 3`

4. **4x - Referral Program**
   - Punti bonus per utenti che portano nuovi investitori
   - Calcolo: `referred_deposits * 4`

### Calcolo Giornaliero

L'Indexer viene eseguito ogni 24 ore (o ogni ora per maggiore granularità):

1. Recupera tutti gli utenti dal database
2. Per ogni utente:
   - Query balance nbkUSDC nel vault
   - Query posizioni LP su DEX
   - Query posizioni lending
   - Query referral attivi
3. Applica moltiplicatori
4. Calcola punti giornalieri totali
5. Salva in `points_history`
6. Aggiorna `points` con nuovo totale

**Formula Esempio:**
```typescript
const dailyPoints = 
    (holdingBalance * 1) +
    (lpBalance * 2) +
    (lendingBalance * 3) +
    (referralVolume * 4);
```

## API Endpoints

### Endpoint 1: Ottenere i dati di un utente

**Route**: `GET /api/points/{walletAddress}`

**Descrizione**: Restituisce i punti totali, il rank e la cronologia recente per un dato wallet.

**Risposta Esempio (JSON)**:
```json
{
    "walletAddress": "0x123...",
    "totalPoints": "12540.78",
    "rank": 42,
    "history": [
        {
            "date": "2025-11-25",
            "pointsEarned": "540.12",
            "activity": "lp_beefy_usdc_next",
            "multiplier": 2.0
        },
        {
            "date": "2025-11-24",
            "pointsEarned": "538.90",
            "activity": "lp_beefy_usdc_next",
            "multiplier": 2.0
        }
    ]
}
```

### Endpoint 2: Ottenere la classifica

**Route**: `GET /api/leaderboard?page=1&limit=20`

**Descrizione**: Restituisce la classifica degli utenti con più punti, con paginazione.

**Risposta Esempio (JSON)**:
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
        },
        {
            "rank": 2,
            "walletAddress": "0xdef...",
            "totalPoints": "512345.10"
        }
    ]
}
```

## Implementazione Indexer (TypeScript)

### Struttura Edge Function

```typescript
// supabase/functions/calculate-points/index.ts

import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

interface UserPosition {
    walletAddress: string;
    holdingBalance: ethers.BigNumber;
    lpBalance: ethers.BigNumber;
}

// Funzione principale della Edge Function
serve(async (req) => {
    // 1. Inizializza i client
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const provider = new ethers.providers.JsonRpcProvider(
        Deno.env.get('BASE_RPC_URL')!
    );
    
    // 2. Ottieni tutti gli utenti dal database
    const { data: users, error } = await supabase
        .from('users')
        .select('wallet_address');
    
    if (error) throw error;
    
    for (const user of users) {
        // 3. Per ogni utente, ottieni le posizioni on-chain
        const position: UserPosition = await getOnChainPositions(
            user.wallet_address,
            provider
        );
        
        // 4. Calcola i punti
        const holdingPoints = parseFloat(
            ethers.utils.formatUnits(position.holdingBalance, 18)
        ) * 1; // 1x multiplier
        
        const lpPoints = parseFloat(
            ethers.utils.formatUnits(position.lpBalance, 18)
        ) * 2; // 2x multiplier
        
        const totalPointsEarned = holdingPoints + lpPoints;
        
        // 5. Salva i risultati nel database
        await supabase.rpc('update_user_points', {
            p_user_address: user.wallet_address,
            p_points_earned: totalPointsEarned
        });
    }
    
    return new Response(
        JSON.stringify({ message: 'Points calculation complete' }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});

// Funzione di supporto per ottenere le posizioni on-chain
async function getOnChainPositions(
    address: string,
    provider: any
): Promise<UserPosition> {
    // Logica per interrogare i saldi del token NextBlock, i saldi dei token LP, etc.
    // Esempio:
    // const nextTokenContract = new ethers.Contract(NEXT_TOKEN_ADDRESS, ABI, provider);
    // const holdingBalance = await nextTokenContract.balanceOf(address);
    
    return {
        walletAddress: address,
        holdingBalance: ethers.BigNumber.from(0),
        lpBalance: ethers.BigNumber.from(0)
    };
}
```

### Stored Procedure PostgreSQL

```sql
CREATE OR REPLACE FUNCTION update_user_points(
    p_user_address TEXT,
    p_points_earned NUMERIC
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Trova o crea utente
    INSERT INTO users (wallet_address)
    VALUES (p_user_address)
    ON CONFLICT (wallet_address) DO NOTHING
    RETURNING id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE wallet_address = p_user_address;
    END IF;
    
    -- Inserisci in points_history
    INSERT INTO points_history (
        user_id,
        points_earned,
        calculation_date,
        source_activity,
        multiplier,
        raw_balance
    ) VALUES (
        v_user_id,
        p_points_earned,
        CURRENT_DATE,
        'daily_calculation',
        1.0,
        p_points_earned
    );
    
    -- Aggiorna points totali
    INSERT INTO points (user_id, total_points)
    VALUES (v_user_id, p_points_earned)
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_points = points.total_points + p_points_earned,
        updated_at = now();
    
    -- Ricalcola rank
    WITH ranked_users AS (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
        FROM points
    )
    UPDATE points p
    SET rank = r.new_rank
    FROM ranked_users r
    WHERE p.user_id = r.user_id;
END;
$$;
```

## Configurazione Supabase

### 1. Setup Progetto

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Inizializza progetto
supabase init

# Link al progetto cloud
supabase link --project-ref <your-project-ref>
```

### 2. Crea Database Schema

```bash
# Crea migration
supabase migration new create_points_system

# Edita il file migration con gli schema SQL sopra
# Poi applica
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy indexer
supabase functions deploy calculate-points

# Deploy API
supabase functions deploy get-user-points
supabase functions deploy get-leaderboard
```

### 4. Setup Cron Job

Supabase supporta pg_cron per scheduling:

```sql
-- Esegui calculate-points ogni giorno alle 00:00 UTC
SELECT cron.schedule(
    'calculate-daily-points',
    '0 0 * * *',
    $$
    SELECT net.http_post(
        url:='https://your-project.supabase.co/functions/v1/calculate-points',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
    $$
);
```

## Considerazioni su Sicurezza e Scalabilità

### Sicurezza

- Le chiavi API per RPC e Supabase devono essere gestite come segreti
- Le Edge Functions di Supabase sono un ambiente sicuro
- Implementare rate limiting sulle API pubbliche
- Validare tutti gli input utente

### Scalabilità

- Uso di servizi RPC dedicati (QuickNode) per evitare rate limiting
- Per molti utenti, parallelizzare le richieste o processare in batch
- Ottimizzare query SQL con indici appropriati
- Considerare caching (Redis) per leaderboard

### Affidabilità

- Il processo di calcolo deve essere idempotente
- Se un'esecuzione fallisce, non deve causare doppi conteggi
- Controllare se i punti per una data sono già stati calcolati prima di inserirli

## Vantaggi Approccio Off-Chain

1. **Flessibilità**: Modificare regole e moltiplicatori senza re-deploy contratti
2. **Costi**: Nessun gas fee per calcoli e storage punti
3. **Velocità**: Aggiornamenti rapidi e query efficienti
4. **Complessità**: Logica di business complessa senza limiti gas
5. **Privacy**: Dati aggregati non pubblici on-chain

## Svantaggi e Mitigazioni

### Centralizzazione

**Problema**: Il sistema dipende da un backend centralizzato

**Mitigazione**:
- Rendere il codice open source
- Pubblicare snapshot periodici dei punti on-chain (merkle root)
- Permettere verifiche indipendenti

### Trust

**Problema**: Gli utenti devono fidarsi del calcolo off-chain

**Mitigazione**:
- Trasparenza totale nelle regole
- API pubblica per verificare i propri punti
- Audit trail completo in points_history

## Roadmap Implementazione

### Fase 1: Setup Infrastruttura (1-2 giorni)

- [ ] Creare progetto Supabase
- [ ] Setup database schema
- [ ] Configurare RPC endpoints (QuickNode/Alchemy)
- [ ] Setup variabili ambiente

### Fase 2: Sviluppo Indexer (2-3 giorni)

- [ ] Implementare getOnChainPositions per nbkUSDC
- [ ] Implementare query LP positions
- [ ] Implementare logica calcolo punti
- [ ] Implementare stored procedure update_user_points
- [ ] Testing su testnet

### Fase 3: Sviluppo API (1-2 giorni)

- [ ] Implementare GET /api/points/{wallet}
- [ ] Implementare GET /api/leaderboard
- [ ] Implementare autenticazione (opzionale)
- [ ] Testing e documentazione

### Fase 4: Scheduling e Monitoring (1 giorno)

- [ ] Setup pg_cron per esecuzione giornaliera
- [ ] Implementare logging e error handling
- [ ] Setup alerting per failures
- [ ] Dashboard monitoring

### Fase 5: Integrazione Frontend (2-3 giorni)

- [ ] Integrare API nel frontend NextBlock
- [ ] Creare dashboard punti utente
- [ ] Creare leaderboard pubblica
- [ ] Testing end-to-end

### Fase 6: Launch e Ottimizzazione (ongoing)

- [ ] Deploy su produzione
- [ ] Monitoring performance
- [ ] Ottimizzazioni query
- [ ] Raccolta feedback utenti

**Tempo Totale Stimato**: 7-12 giorni

## Costi Stimati

### Supabase

- **Free Tier**: 500MB database, 2GB bandwidth, 500K Edge Function invocations/mese
- **Pro Tier** ($25/mese): 8GB database, 50GB bandwidth, 2M invocations
- **Stima per NextBlock**: Pro tier sufficiente per primi 10K utenti

### RPC Services

- **QuickNode**: $49/mese per 40M credits (sufficiente per 1M requests)
- **Alchemy**: $199/mese per tier Growth
- **Stima**: $50-200/mese in base a volume

### Totale Mensile

- **Early Stage** (< 1K utenti): ~$75/mese
- **Growth** (1K-10K utenti): ~$250/mese
- **Scale** (10K+ utenti): $500+/mese

## Conclusioni

Il sistema di punti off-chain è la scelta ottimale per NextBlock perché:

1. Non richiede modifiche agli smart contract esistenti
2. Offre massima flessibilità per evolvere il programma
3. Costa significativamente meno di una soluzione on-chain
4. Permette logica di business complessa
5. È lo standard de-facto nel settore DeFi

L'implementazione su Supabase con TypeScript e PostgreSQL fornisce un'architettura moderna, scalabile e manutenibile che può crescere con la piattaforma.

---

**Prossimo Step**: Procedere con l'implementazione del backend off-chain seguendo la roadmap sopra.
