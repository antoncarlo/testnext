# 🧪 Guida al Testing - Vault Integration

**Progetto**: NextBlock Re - DeFi Platform  
**Network**: Base Sepolia (Testnet)  
**Vault Contract**: `0x8db501230a8636FC4405191E47A35f81B797dE48`

---

## 📋 Prerequisiti

### 1. Wallet Setup

**Opzione A: MetaMask**
1. Installa [MetaMask](https://metamask.io/)
2. Aggiungi Base Sepolia network:
   - Network Name: `Base Sepolia`
   - RPC URL: `https://sepolia.base.org`
   - Chain ID: `84532`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.basescan.org`

**Opzione B: Trust Wallet**
1. Installa [Trust Wallet](https://trustwallet.com/)
2. Configura Base Sepolia (stesso procedimento)

### 2. Ottieni ETH Testnet

**Faucet Base Sepolia**:
- https://www.alchemy.com/faucets/base-sepolia
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- https://faucet.quicknode.com/base/sepolia

**Importo consigliato**: 0.5 - 1 ETH (testnet)

### 3. Account Utente

**Opzione A: Usa account esistente**
- Email: `antoncarlo1995@gmail.com`
- Password: `piuomeno`
- Ruolo: Admin (può vedere tutto)

**Opzione B: Crea nuovo account**
1. Vai su https://testnext-delta.vercel.app
2. Clicca "Sign Up"
3. Inserisci email e password
4. Conferma email (se richiesto)

---

## 🚀 Test Flow Completo

### Step 1: Login

1. Vai su https://testnext-delta.vercel.app
2. Clicca "Launch App"
3. Inserisci credenziali:
   - Email: `antoncarlo1995@gmail.com`
   - Password: `piuomeno`
4. Clicca "Sign In"

✅ **Verifica**: Dovresti vedere la dashboard con il tuo email in alto

---

### Step 2: Connetti Wallet

1. Nella sezione "Connect Your Wallet", clicca "Connect Wallet"
2. Seleziona il tuo wallet (MetaMask/Trust Wallet/ecc.)
3. Approva la connessione nel wallet
4. **IMPORTANTE**: Assicurati di essere su **Base Sepolia** network

✅ **Verifica**: Il pulsante dovrebbe cambiare in "Connected" e mostrare il tuo indirizzo

---

### Step 3: Seleziona Vault

1. Nella sezione "Deposit to Vault", clicca sul dropdown "Select Vault"
2. Dovresti vedere: **"ETH Staking Pool - 12.5% APY (3x points)"**
3. Selezionalo (dovrebbe essere già selezionato di default)

✅ **Verifica**: Sotto il dropdown dovresti vedere:
```
Contract: 0x8db5...dE48
```

---

### Step 4: Inserisci Importo

1. Nel campo "Amount (ETH)", inserisci un importo di test (es. `0.01`)
2. Osserva il calcolo dei punti:
   - Per 0.01 ETH: `0.01 × 1000 × 3 = 30 punti`
   - Per 0.1 ETH: `0.1 × 1000 × 3 = 300 punti`

✅ **Verifica**: Il box sotto dovrebbe mostrare:
```
Earn 30 points (3x multiplier)
Base APY: 12.5%
```

---

### Step 5: Esegui Deposito

1. Clicca "Deposit to Vault"
2. Il wallet chiederà conferma della transazione
3. **Controlla i dettagli**:
   - To: `0x8db501230a8636FC4405191E47A35f81B797dE48`
   - Value: `0.01 ETH` (o l'importo che hai inserito)
   - Gas Fee: ~$0.01 (testnet)
4. Conferma la transazione nel wallet

✅ **Verifica**: Dovresti vedere:
```
Transaction Sent
Transaction hash: 0x...
```

---

### Step 6: Attendi Conferma

1. Aspetta 2-5 secondi per la conferma on-chain
2. Dovresti vedere un box verde:
   ```
   Transaction submitted!
   View on Basescan 🔗
   ```
3. Clicca sul link "View on Basescan"

✅ **Verifica**: Basescan dovrebbe mostrare:
- **Status**: Success ✅
- **From**: Il tuo wallet address
- **To**: `0x8db501230a8636FC4405191E47A35f81B797dE48` (Vault Contract)
- **Value**: 0.01 ETH

---

### Step 7: Verifica Database

1. Aspetta che la pagina si ricarichi automaticamente (2-3 secondi)
2. Vai nel menu laterale → **"Admin"**
3. Clicca sulla tab **"DeFi Positions"**
4. Dovresti vedere la tua posizione:
   - User: `antoncarlo1995@gmail.com`
   - Vault: `ETH Staking Pool`
   - Amount: `0.01 ETH`
   - Status: `Active`
   - TX Hash: `0x...` (clicca per vedere su Basescan)

✅ **Verifica**: La posizione è salvata correttamente nel database

---

### Step 8: Verifica Punti

1. Torna alla **Dashboard**
2. Controlla la sezione "Total Points"
3. Dovresti vedere i punti aggiornati:
   - Se hai depositato 0.01 ETH: `+30 punti`
   - Se hai depositato 0.1 ETH: `+300 punti`

✅ **Verifica**: I punti sono calcolati con il moltiplicatore 3x

---

## 🔍 Verifica On-Chain

### Controlla il Contratto su Basescan

1. Vai su https://sepolia.basescan.org/address/0x8db501230a8636FC4405191E47A35f81B797dE48
2. Clicca su **"Contract"** tab
3. Clicca su **"Read Contract"**
4. Chiama le funzioni:

**getTotalDeposits()**
- Dovrebbe mostrare il totale depositato nel vault
- Es: `10000000000000000` (0.01 ETH in wei)

**getUserDeposit(address)**
- Inserisci il tuo wallet address
- Dovrebbe mostrare quanto hai depositato
- Es: `10000000000000000` (0.01 ETH in wei)

✅ **Verifica**: I dati on-chain corrispondono al database

---

## 📊 Test Cases

### Test Case 1: Deposito Minimo
- **Input**: 0.001 ETH
- **Expected**: 3 punti (0.001 × 1000 × 3)
- **Status**: ⏳ Da testare

### Test Case 2: Deposito Standard
- **Input**: 0.1 ETH
- **Expected**: 300 punti (0.1 × 1000 × 3)
- **Status**: ⏳ Da testare

### Test Case 3: Deposito Grande
- **Input**: 1 ETH
- **Expected**: 3000 punti (1 × 1000 × 3)
- **Status**: ⏳ Da testare

### Test Case 4: Network Sbagliato
- **Setup**: Connetti wallet su Ethereum Sepolia
- **Expected**: Warning "Please switch to Base network"
- **Status**: ⏳ Da testare

### Test Case 5: Wallet Non Connesso
- **Setup**: Non connettere wallet
- **Expected**: Input disabilitato, messaggio "Connect your wallet to deposit"
- **Status**: ✅ Verificato

### Test Case 6: Importo Invalido
- **Input**: -1 o 0
- **Expected**: Errore "Please enter a valid amount"
- **Status**: ⏳ Da testare

---

## 🐛 Troubleshooting

### Problema: "Transaction Failed"

**Possibili Cause**:
1. **Insufficient Funds**: Non hai abbastanza ETH per gas + deposito
   - Soluzione: Richiedi più ETH dal faucet

2. **Wrong Network**: Sei su un network diverso da Base Sepolia
   - Soluzione: Cambia network nel wallet

3. **Gas Price Too Low**: Gas price troppo basso
   - Soluzione: Aumenta il gas price nel wallet

### Problema: "Contract Address Not Found"

**Causa**: Il vault non ha un contract address
- Soluzione: Vai in Admin → Vaults → Edit vault → Inserisci contract address

### Problema: "Wallet Not Connected"

**Causa**: Web3-Onboard non ha rilevato il wallet
- Soluzione: Ricarica la pagina e riconnetti il wallet

### Problema: "Transaction Hash Not Showing"

**Causa**: La transazione è stata rifiutata o fallita
- Soluzione: Controlla la console del browser per errori

---

## 📸 Screenshots Attesi

### 1. Dashboard con Vault Selection
```
┌─────────────────────────────────────┐
│ Deposit to Vault                    │
├─────────────────────────────────────┤
│ Select Vault                        │
│ [ETH Staking Pool - 12.5% APY (3x)] │
│ Contract: 0x8db5...dE48             │
│                                     │
│ Amount (ETH)                        │
│ [0.1                              ] │
│                                     │
│ Earn 300 points (3x multiplier)     │
│ Base APY: 12.5%                     │
│                                     │
│ [Deposit to Vault]                  │
└─────────────────────────────────────┘
```

### 2. Transaction Submitted
```
┌─────────────────────────────────────┐
│ ✅ Transaction submitted!           │
│ View on Basescan 🔗                 │
└─────────────────────────────────────┘
```

### 3. Basescan Transaction
```
Transaction Details
Status: Success ✅
From: 0xYourWallet...
To: 0x8db501230a8636FC4405191E47A35f81B797dE48
Value: 0.1 ETH
```

### 4. Admin Panel - DeFi Positions
```
┌──────────────────────────────────────────────────────────────┐
│ User                     │ Vault            │ Amount │ Status │
├──────────────────────────┼──────────────────┼────────┼────────┤
│ antoncarlo1995@gmail.com │ ETH Staking Pool │ 0.1    │ Active │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Testing

Prima di considerare il test completo, verifica:

- [ ] Login effettuato con successo
- [ ] Wallet connesso su Base Sepolia
- [ ] Vault selezionato correttamente
- [ ] Contract address visibile
- [ ] Importo inserito e punti calcolati
- [ ] Transazione confermata nel wallet
- [ ] Transaction hash ricevuto
- [ ] Link Basescan funzionante
- [ ] Transazione visibile su Basescan con status "Success"
- [ ] Posizione salvata in Admin → DeFi Positions
- [ ] Punti aggiornati nella dashboard
- [ ] Contratto on-chain mostra il deposito corretto

---

## 🎯 Obiettivi del Test

1. **Funzionalità**: Verificare che il deposito funzioni end-to-end
2. **On-Chain**: Confermare che i fondi arrivano al contratto vault
3. **Database**: Verificare che le posizioni siano salvate correttamente
4. **UX**: Assicurarsi che il flusso sia chiaro e senza errori
5. **Sicurezza**: Confermare che solo transazioni valide vengano accettate

---

## 📞 Supporto

Se incontri problemi durante il testing:

1. **Controlla la console del browser** (F12) per errori JavaScript
2. **Verifica il network** nel wallet (deve essere Base Sepolia)
3. **Controlla il saldo** ETH nel wallet
4. **Ricarica la pagina** e riprova
5. **Contatta il team** con screenshot e dettagli dell'errore

---

## 🎉 Prossimi Passi Dopo il Test

Una volta completato il testing con successo:

1. **Deploy contratti per altri vault** (USDC Lending, BTC Liquidity, ecc.)
2. **Implementare withdrawal** (prelievo dai vault)
3. **Aggiungere APY tracking** (calcolo rendimenti nel tempo)
4. **Testare su Base mainnet** (con importi reali)
5. **Audit del codice** (sicurezza e ottimizzazioni)

---

*Buon testing! 🚀*
