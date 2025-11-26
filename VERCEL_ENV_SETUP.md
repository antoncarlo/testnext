# Configurazione Environment Variables su Vercel

## Credenziali Supabase per testnext

Il progetto testnext è ora collegato al nuovo database Supabase.

### Informazioni Progetto Supabase

- **Project ID**: ybxyciosasuawhswccxd
- **Region**: us-east-1
- **URL**: https://ybxyciosasuawhswccxd.supabase.co
- **Status**: ACTIVE_HEALTHY

### Variabili d'Ambiente Richieste

Le seguenti variabili devono essere configurate su Vercel:

```
VITE_SUPABASE_URL=https://ybxyciosasuawhswccxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHljaW9zYXN1YXdoc3djY3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTk2MzIsImV4cCI6MjA3OTczNTYzMn0.v2lZM-ZDyOZGdG6YcuXhiijoX9eKhpuACtLWXqTRvgw
```

### Come Configurare su Vercel

#### Opzione 1: Tramite Dashboard Vercel (Consigliato)

1. Vai su https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext/settings/environment-variables
2. Aggiungi le seguenti variabili:
   - Nome: `VITE_SUPABASE_URL`
   - Valore: `https://ybxyciosasuawhswccxd.supabase.co`
   - Environment: Production, Preview, Development
   
   - Nome: `VITE_SUPABASE_ANON_KEY`
   - Valore: (la chiave completa sopra)
   - Environment: Production, Preview, Development

3. Clicca "Save"
4. Fai un nuovo deployment o redeploy dell'ultimo commit

#### Opzione 2: Tramite Vercel CLI

```bash
# Installa Vercel CLI se non l'hai già
npm i -g vercel

# Login
vercel login

# Vai nella directory del progetto
cd testnext

# Aggiungi le variabili
vercel env add VITE_SUPABASE_URL production
# Incolla: https://ybxyciosasuawhswccxd.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Incolla la chiave completa

# Redeploy
vercel --prod
```

### Verifica Configurazione

Dopo aver configurato le variabili e fatto il redeploy:

1. Apri https://testnext-delta.vercel.app
2. Apri la console del browser (F12)
3. Verifica che non ci siano errori di connessione a Supabase
4. La pagina dovrebbe caricare correttamente con il contenuto

### Database Schema

Il database include le seguenti tabelle:

- `profiles` - Profili utente con wallet address
- `deposits` - Depositi cross-chain (Base + Solana)
- `points_history` - Cronologia punti
- `defi_strategies` - Strategie DeFi disponibili
- `user_defi_positions` - Posizioni DeFi degli utenti
- `referrals` - Sistema referral
- `user_roles` - Ruoli utente (admin/user)
- `user_activity` - Log attività utente

Tutte le tabelle hanno RLS (Row Level Security) abilitato.

### Prossimi Passi

1. Configurare le variabili d'ambiente su Vercel
2. Fare un redeploy
3. Testare l'applicazione
4. Deployare le Edge Functions se necessario
5. Configurare gli indirizzi dei contratti smart quando disponibili

### Note Importanti

- Il file `.env.local` nel repository contiene le stesse variabili per lo sviluppo locale
- Il file `.env.example` è stato aggiornato con le credenziali reali
- Le chiavi API sono pubbliche (anon key) e sicure per l'uso client-side
- Il progetto NextBlock originale è stato messo in pausa

### Supporto

Per problemi o domande:
- Verifica i log di deployment su Vercel
- Controlla i log del database su Supabase Dashboard
- Verifica che le variabili siano state salvate correttamente

Author: Anton Carlo Santoro
Date: 2025-11-26
