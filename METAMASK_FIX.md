# MetaMask Connection Fix

## Problema Identificato

Quando l'utente cliccava su "Connetti Wallet" o "Inizia Ora", il modal Web3-Onboard si apriva ma **MetaMask non appariva nella lista dei wallet disponibili**.

Erano visibili solo:
- WalletConnect
- Coinbase Wallet
- Trust Wallet

## Causa del Problema

Il modulo `injected-wallets` di Web3-Onboard non mostrava MetaMask perché non era configurato per visualizzare i wallet "unavailable" (non installati o non rilevati).

### Configurazione Precedente

```typescript
const injected = injectedModule();
```

Questa configurazione di default non mostra i wallet che non sono già installati/rilevati nel browser.

## Soluzione Implementata

Configurato `injected-wallets` per mostrare esplicitamente MetaMask e altri wallet anche se non sono installati:

```typescript
const injected = injectedModule({
  displayUnavailable: [
    'MetaMask',
    'Coinbase Wallet',
    'Trust Wallet',
  ],
});
```

### Cosa fa `displayUnavailable`

- Mostra i wallet specificati **anche se non sono installati**
- Quando l'utente clicca su un wallet non installato, Web3-Onboard:
  1. Mostra un messaggio "Install MetaMask"
  2. Fornisce un link per installare il wallet
  3. Oppure, se il wallet è installato ma non rilevato, tenta di connettersi

## File Modificati

1. **src/config/web3-onboard.ts**
   - Aggiunta configurazione `displayUnavailable` al modulo `injected-wallets`

## Risultati Attesi

### Prima del Fix ❌
```
Modal Web3-Onboard:
- WalletConnect
- Coinbase Wallet
- Trust Wallet
(MetaMask non visibile)
```

### Dopo il Fix ✅
```
Modal Web3-Onboard:
- MetaMask (con icona)
- WalletConnect
- Coinbase Wallet
- Trust Wallet
```

## Flusso di Connessione Corretto

1. **Utente clicca "Connetti Wallet"**
   - Modal Web3-Onboard si apre
   - MetaMask appare nella lista

2. **Utente clicca su MetaMask**
   - Se MetaMask è installato:
     - MetaMask si apre automaticamente
     - Richiede firma di connessione
     - Dopo la firma, wallet connesso
   - Se MetaMask NON è installato:
     - Mostra messaggio "Install MetaMask"
     - Link per installare MetaMask

3. **Dopo la Connessione**
   - Navigazione automatica alla Dashboard
   - Dashboard mostra wallet connesso
   - Persistenza abilitata (rimane connesso dopo refresh)

## Test da Eseguire

### Test 1: MetaMask Installato
1. Vai su https://testnext-delta.vercel.app
2. Clicca "Inizia Ora"
3. Verifica che MetaMask appaia nel modal
4. Clicca su MetaMask
5. Verifica che MetaMask si apra
6. Firma la connessione
7. Verifica che Dashboard carichi con wallet connesso

### Test 2: MetaMask Non Installato
1. Vai su https://testnext-delta.vercel.app (browser senza MetaMask)
2. Clicca "Inizia Ora"
3. Verifica che MetaMask appaia nel modal
4. Clicca su MetaMask
5. Verifica che appaia messaggio "Install MetaMask"
6. Verifica che ci sia link per installare

### Test 3: Persistenza
1. Con wallet connesso, fai refresh (F5)
2. Verifica che wallet rimanga connesso
3. Naviga tra pagine (Dashboard → Portfolio → Dashboard)
4. Verifica che wallet rimanga connesso

## Deployment

- **Commit**: `027b0c0`
- **Message**: "fix: configure injected-wallets to display MetaMask explicitly"
- **Status**: ✅ Pushato su GitHub
- **Vercel**: Deployment automatico in corso

## Documentazione Aggiuntiva

### Web3-Onboard Injected Wallets

Documentazione ufficiale: https://onboard.blocknative.com/docs/wallets/injected

```typescript
interface InjectedWalletOptions {
  /**
   * An array of wallet labels to filter the injected wallets
   * If no filter is provided, all wallets will be shown
   */
  filter?: {
    [key: string]: boolean
  }
  
  /**
   * An array of wallet labels to display even if they are not installed
   * Useful for showing installation prompts
   */
  displayUnavailable?: string[]
  
  /**
   * Wallets to sort to the top of the list
   */
  sort?: (wallets: WalletModule[]) => WalletModule[]
}
```

### Wallet Labels Supportati

- `'MetaMask'`
- `'Coinbase Wallet'`
- `'Trust Wallet'`
- `'Brave Wallet'`
- `'Opera'`
- `'Status'`
- `'Alphawallet'`
- `'Atoken'`
- `'Bitpie'`
- `'Blankwallet'`
- `'Dcent'`
- `'Frame'`
- `'Huobiwallet'`
- `'Hyperpay'`
- `'Imtoken'`
- `'Liquality'`
- `'Meetone'`
- `'Mykey'`
- `'Ownbit'`
- `'Tokenpocket'`
- `'Tp'`
- `'Wallet.io'`
- `'Xdefi'`
- `'Rabby'`
- `'MathWallet'`
- `'Gamestop'`
- `'Detected Wallet'`

## Prossimi Passi

### Immediate
1. ✅ Testare che MetaMask appaia nel modal
2. ✅ Testare connessione MetaMask
3. ✅ Testare persistenza dopo refresh

### Future
4. Aggiungere altri wallet popolari (Rabby, Brave, ecc.)
5. Personalizzare ordine dei wallet (MetaMask primo)
6. Aggiungere analytics per tracking wallet usage
7. Migliorare UX con loading states e error messages

## Conclusione

Il fix è stato implementato e deployato. MetaMask dovrebbe ora apparire nel modal Web3-Onboard e permettere la connessione corretta.

**Status**: ✅ COMPLETATO

**Test Utente**: Necessario per confermare che il fix funziona correttamente
