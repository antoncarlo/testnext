# 🚀 Guida Rapida: Aggiungere Vault e Strategy Addresses

**Data:** 27 Novembre 2024  
**Versione:** 1.0

---

## 📋 Quando Hai gli Indirizzi dei Contratti

Dopo aver deployato i contratti **Vault** e **Strategy** su Base Sepolia, usa questi comandi per aggiungerli al progetto.

---

## ✅ Metodo 1: Script Automatico (RACCOMANDATO)

### Passo 1: Naviga nella directory del progetto

```bash
cd /home/ubuntu/testnext
```

### Passo 2: Esegui lo script con gli indirizzi

```bash
./scripts/add-vault-strategy-addresses.sh <VAULT_ADDRESS> <STRATEGY_ADDRESS>
```

### Esempio Completo

```bash
./scripts/add-vault-strategy-addresses.sh \
  0x1234567890abcdef1234567890abcdef12345678 \
  0xabcdef1234567890abcdef1234567890abcdef12
```

### Solo Vault Address (senza Strategy)

```bash
./scripts/add-vault-strategy-addresses.sh 0x1234567890abcdef1234567890abcdef12345678
```

### Cosa Fa lo Script

1. ✅ Valida il formato degli indirizzi (0x + 40 caratteri hex)
2. ✅ Aggiunge `VITE_VAULT_ADDRESS` a Vercel (production, preview, development)
3. ✅ Aggiunge `VITE_STRATEGY_ADDRESS` a Vercel (se fornito)
4. ✅ Aggiorna `.env.local` con i nuovi indirizzi
5. ✅ Mostra riepilogo e prossimi passi

---

## 🔧 Metodo 2: Comandi Manuali

### Aggiungi VITE_VAULT_ADDRESS

```bash
# Sostituisci YOUR_VAULT_ADDRESS con l'indirizzo reale
VAULT_ADDRESS="0xYOUR_VAULT_ADDRESS_HERE"

# Aggiungi a production
echo "$VAULT_ADDRESS" | vercel env add VITE_VAULT_ADDRESS production

# Aggiungi a preview
echo "$VAULT_ADDRESS" | vercel env add VITE_VAULT_ADDRESS preview

# Aggiungi a development
echo "$VAULT_ADDRESS" | vercel env add VITE_VAULT_ADDRESS development
```

### Aggiungi VITE_STRATEGY_ADDRESS

```bash
# Sostituisci YOUR_STRATEGY_ADDRESS con l'indirizzo reale
STRATEGY_ADDRESS="0xYOUR_STRATEGY_ADDRESS_HERE"

# Aggiungi a production
echo "$STRATEGY_ADDRESS" | vercel env add VITE_STRATEGY_ADDRESS production

# Aggiungi a preview
echo "$STRATEGY_ADDRESS" | vercel env add VITE_STRATEGY_ADDRESS preview

# Aggiungi a development
echo "$STRATEGY_ADDRESS" | vercel env add VITE_STRATEGY_ADDRESS development
```

### Aggiorna .env.local

```bash
# Aggiungi al file .env.local
echo 'VITE_VAULT_ADDRESS="0xYOUR_VAULT_ADDRESS_HERE"' >> .env.local
echo 'VITE_STRATEGY_ADDRESS="0xYOUR_STRATEGY_ADDRESS_HERE"' >> .env.local
```

---

## 📝 Metodo 3: Vercel Dashboard (Manuale)

### Passo 1: Apri Vercel Dashboard

https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext/settings/environment-variables

### Passo 2: Aggiungi VITE_VAULT_ADDRESS

1. Clicca su "Add New"
2. **Name:** `VITE_VAULT_ADDRESS`
3. **Value:** `0xYOUR_VAULT_ADDRESS_HERE`
4. **Environments:** Seleziona tutti (Production, Preview, Development)
5. Clicca "Save"

### Passo 3: Aggiungi VITE_STRATEGY_ADDRESS

1. Clicca su "Add New"
2. **Name:** `VITE_STRATEGY_ADDRESS`
3. **Value:** `0xYOUR_STRATEGY_ADDRESS_HERE`
4. **Environments:** Seleziona tutti (Production, Preview, Development)
5. Clicca "Save"

---

## 🔄 Dopo Aver Aggiunto le Variabili

### Opzione A: Redeploy Automatico

```bash
# Fai un commit dummy per triggerare redeploy
git commit --allow-empty -m "chore: trigger redeploy with new contract addresses"
git push origin main
```

### Opzione B: Redeploy Manuale

1. Vai su: https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext
2. Clicca su "Deployments"
3. Clicca sui tre puntini dell'ultimo deployment
4. Seleziona "Redeploy"

---

## ✅ Verifica Configurazione

### 1. Verifica su Vercel Dashboard

Vai su: https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext/settings/environment-variables

Dovresti vedere:
- ✅ `VITE_VAULT_ADDRESS` = `0x...` (production, preview, development)
- ✅ `VITE_STRATEGY_ADDRESS` = `0x...` (production, preview, development)

### 2. Verifica nel Browser

Dopo il deployment, apri la console su: https://testnext-delta.vercel.app/

```javascript
// Esegui in console
console.log({
  vault: import.meta.env.VITE_VAULT_ADDRESS,
  strategy: import.meta.env.VITE_STRATEGY_ADDRESS,
});
```

Dovresti vedere gli indirizzi corretti.

### 3. Verifica Locale

```bash
# Verifica .env.local
cat .env.local | grep -E "(VAULT|STRATEGY)"
```

Output atteso:
```
VITE_VAULT_ADDRESS="0x..."
VITE_STRATEGY_ADDRESS="0x..."
```

---

## 📊 Esempio Completo con Indirizzi Reali

Supponiamo di aver deployato:
- **Vault:** `0x9876543210fedcba9876543210fedcba98765432`
- **Strategy:** `0xfedcba9876543210fedcba9876543210fedcba98`

### Comando Script

```bash
cd /home/ubuntu/testnext

./scripts/add-vault-strategy-addresses.sh \
  0x9876543210fedcba9876543210fedcba98765432 \
  0xfedcba9876543210fedcba9876543210fedcba98
```

### Output Atteso

```
🚀 Adding Vault and Strategy Addresses to Vercel
==========================================================

✅ Addresses validated

  VAULT_ADDRESS:    0x9876543210fedcba9876543210fedcba98765432
  STRATEGY_ADDRESS: 0xfedcba9876543210fedcba9876543210fedcba98

🔐 Checking Vercel authentication...
Vercel CLI 48.11.1
> info-70735851

📝 Adding VITE_VAULT_ADDRESS...

Added Environment Variable VITE_VAULT_ADDRESS to Project testnext
✅ VITE_VAULT_ADDRESS added to all environments

📝 Adding VITE_STRATEGY_ADDRESS...

Added Environment Variable VITE_STRATEGY_ADDRESS to Project testnext
✅ VITE_STRATEGY_ADDRESS added to all environments

📝 Updating .env.local...

✅ Updated VITE_VAULT_ADDRESS in .env.local
✅ Updated VITE_STRATEGY_ADDRESS in .env.local

✅ Configuration complete!

📋 Summary:
   - VITE_VAULT_ADDRESS: 0x9876543210fedcba9876543210fedcba98765432
   - VITE_STRATEGY_ADDRESS: 0xfedcba9876543210fedcba9876543210fedcba98
   - Environments: production, preview, development
   - .env.local updated

🔄 Next steps:
   1. Commit changes (optional, .env.local is gitignored)
   2. Redeploy on Vercel: git push origin main
   3. Or trigger manual redeploy in Vercel Dashboard

🔗 Verify in Vercel Dashboard:
   https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext/settings/environment-variables
```

---

## 🔧 Troubleshooting

### Errore: "Invalid address format"

**Causa:** L'indirizzo non inizia con `0x` o non ha 40 caratteri hex.

**Soluzione:** Verifica che l'indirizzo sia nel formato corretto:
- Deve iniziare con `0x`
- Deve avere esattamente 42 caratteri totali (0x + 40 hex)
- Esempio: `0x1234567890abcdef1234567890abcdef12345678`

### Errore: "Variable already exists"

**Causa:** La variabile esiste già su Vercel.

**Soluzione:** 
1. Rimuovi la variabile esistente dal dashboard
2. Oppure usa `vercel env rm VITE_VAULT_ADDRESS production` prima di aggiungerla

### Script non eseguibile

**Causa:** Permessi mancanti.

**Soluzione:**
```bash
chmod +x scripts/add-vault-strategy-addresses.sh
```

---

## 📚 Riferimenti

### File Correlati

- `scripts/add-vault-strategy-addresses.sh` - Script automatico
- `scripts/setup-vercel-env.sh` - Script setup iniziale
- `.env.local` - Configurazione locale
- `ENV_VARIABLES_BASE_CHAIN.md` - Documentazione completa

### Link Utili

- **Vercel Env Variables:** https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext/settings/environment-variables
- **Base Sepolia Explorer:** https://sepolia.basescan.org/
- **Vercel CLI Docs:** https://vercel.com/docs/cli/env

---

## 🎯 Checklist

Prima di eseguire i comandi:

- [ ] Ho deployato il contratto Vault su Base Sepolia
- [ ] Ho deployato il contratto Strategy su Base Sepolia
- [ ] Ho copiato gli indirizzi corretti (con 0x)
- [ ] Ho verificato gli indirizzi su Base Sepolia Explorer
- [ ] Sono nella directory `/home/ubuntu/testnext`
- [ ] Ho accesso a Vercel CLI (o Dashboard)

Dopo aver eseguito i comandi:

- [ ] Le variabili sono visibili nel Vercel Dashboard
- [ ] Ho triggerato un redeploy
- [ ] Il deployment è completato con successo
- [ ] Ho verificato gli indirizzi nella console browser
- [ ] L'applicazione funziona correttamente

---

**Ultima Modifica:** 27 Novembre 2024, 19:05 GMT+1  
**Autore:** Manus AI Agent  
**Versione:** 1.0
