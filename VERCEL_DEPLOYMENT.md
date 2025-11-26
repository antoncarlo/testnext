# TESTNEXT - Vercel Deployment Guide

**Author**: Anton Carlo Santoro  
**Copyright**: (c) 2025 Anton Carlo Santoro. All rights reserved.

## Quick Deploy

Il repository è ora configurato correttamente per il deployment su Vercel.

### Metodo 1: Re-deploy Automatico

Se hai già collegato il repository a Vercel, il push su GitHub attiverà automaticamente un nuovo deployment.

Verifica su: https://vercel.com/dashboard

### Metodo 2: Deploy Manuale

Se devi fare un nuovo deployment:

1. **Vai su Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Importa il Repository**
   - Click su "Add New" → "Project"
   - Seleziona il repository `antoncarlo/testnext`

3. **Configurazione Build**
   
   Vercel dovrebbe rilevare automaticamente le impostazioni da `vercel.json`:
   
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**
   
   Aggiungi le seguenti variabili di ambiente:
   
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_BASE_RPC_URL=https://mainnet.base.org
   VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```
   
   (Aggiungi tutte le altre variabili dal file `.env.example`)

5. **Deploy**
   - Click su "Deploy"
   - Attendi il completamento del build

## Struttura Repository

Il repository è stato ristrutturato per Vercel:

```
testnext/
├── src/                  # Codice React (root level)
├── public/               # Asset statici (root level)
├── package.json          # Dipendenze (root level)
├── vite.config.ts        # Config Vite (root level)
├── vercel.json           # Config Vercel (root level)
└── blockchain/           # Componenti blockchain (separati)
```

## Vercel Configuration

Il file `vercel.json` è configurato per:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: Tutte le route reindirizzate a `index.html`

## Troubleshooting

### Build Fallisce

**Errore**: "Cannot find module"

**Soluzione**: Verifica che tutte le dipendenze siano in `package.json`

```bash
npm install
npm run build
```

---

**Errore**: "Environment variable missing"

**Soluzione**: Aggiungi tutte le variabili di ambiente richieste su Vercel Dashboard

---

### Pagina Bianca

**Problema**: Il sito si carica ma mostra una pagina bianca

**Soluzione**: 
1. Apri la console del browser (F12)
2. Verifica gli errori JavaScript
3. Controlla che le variabili di ambiente siano configurate correttamente

---

### 404 su Route

**Problema**: Le route dell'app ritornano 404

**Soluzione**: Il file `vercel.json` include già la configurazione per SPA routing. Se il problema persiste, verifica che il file sia presente nel repository.

---

### Build Lento

**Problema**: Il build impiega troppo tempo

**Soluzione**: 
1. Verifica che `node_modules` non sia incluso nel repository
2. Controlla il file `.gitignore`
3. Considera di usare `pnpm` invece di `npm`

## Post-Deployment

### Verifica Funzionalità

Dopo il deployment, verifica:

1. **Homepage**: Carica correttamente
2. **Routing**: Tutte le pagine sono accessibili
3. **Wallet Connection**: I wallet si connettono correttamente
4. **API Calls**: Le chiamate a Supabase funzionano
5. **Assets**: Immagini e icone si caricano

### Custom Domain

Per aggiungere un dominio personalizzato:

1. Vai su Vercel Dashboard → Settings → Domains
2. Aggiungi il tuo dominio
3. Configura i DNS records come indicato

### Environment Variables

Per aggiornare le variabili di ambiente:

1. Vai su Vercel Dashboard → Settings → Environment Variables
2. Modifica o aggiungi variabili
3. Re-deploy per applicare le modifiche

## Continuous Deployment

Ogni push su `main` attiverà automaticamente un nuovo deployment su Vercel.

Per disabilitare:
1. Vai su Vercel Dashboard → Settings → Git
2. Disabilita "Production Branch"

## Monitoring

Monitora il deployment:

- **Logs**: https://vercel.com/dashboard → Deployments → Logs
- **Analytics**: https://vercel.com/dashboard → Analytics
- **Performance**: https://vercel.com/dashboard → Speed Insights

## Rollback

Per fare rollback a una versione precedente:

1. Vai su Vercel Dashboard → Deployments
2. Trova il deployment precedente
3. Click su "..." → "Promote to Production"

## Support

Per problemi con il deployment:

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Repository Issues**: https://github.com/antoncarlo/testnext/issues

---

**Author**: Anton Carlo Santoro  
**License**: Proprietary
