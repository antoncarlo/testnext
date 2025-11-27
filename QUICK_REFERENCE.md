# 🚀 NetBlock Re - Quick Reference

## 📍 URLs Importanti

- **Produzione**: https://testnext-delta.vercel.app/
- **GitHub**: https://github.com/antoncarlo/testnext
- **Vercel Dashboard**: https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext
- **Supabase**: https://supabase.com/dashboard/project/ykfxrjmjdqhqjkqvqzxv

## 🏷️ Versioni Stabili

| Versione | Tag | Commit | Data | Note |
|----------|-----|--------|------|------|
| **v1.1.0** | v1.1.0-stable | 9959e86 | 27 Nov 2024 | ✅ CURRENT - Sidebar + fixes |
| v1.0.0 | v1.0.0-stable | 86cd752 | 27 Nov 2024 | ✅ Pre-sidebar |

## 🔄 Comandi Rapidi

### Build e Deploy
```bash
npm run build          # Build locale
npm run dev           # Dev server locale
git push origin main  # Auto-deploy su Vercel
```

### Rollback
```bash
# Rollback a v1.1.0
git checkout v1.1.0-stable
git push origin main --force

# Rollback a v1.0.0
git checkout v1.0.0-stable
git push origin main --force
```

### Backup
```bash
# Creare nuovo backup
git tag -a v1.x.x-stable -m "Descrizione"
git branch backup/v1.x.x-stable
git push origin v1.x.x-stable backup/v1.x.x-stable
```

## 📁 File Critici

| File | Descrizione | ⚠️ Attenzione |
|------|-------------|---------------|
| `vercel.json` | Config routing Vercel | NON modificare routes senza test |
| `src/App.tsx` | Routing principale | Usare layout direttamente nelle route |
| `.env.local` | Environment vars | MAI committare |
| `src/config/thirdweb.ts` | Base Chain config | Verificare contract addresses |

## 🐛 Troubleshooting

### Pagina Bianca
1. Verificare `vercel.json` routes
2. Controllare console browser per errori
3. Testare `/assets/*.js` accessibili direttamente

### Build Fallito
1. Pulire cache: `rm -rf node_modules dist .vite`
2. Reinstallare: `npm install`
3. Rebuild: `npm run build`

### Deployment Fallito
1. Verificare Vercel logs
2. Controllare environment variables
3. Testare build locale prima

## 📚 Documentazione

- `VERSION_v1.1.0_STABLE_FINAL.md` - Documentazione completa versione
- `BLANK_PAGE_FIX_COMPLETE.md` - Analisi fix pagina bianca
- `SUPABASE_FIX_COMPLETE.md` - Fix database Supabase
- `BACKUP_V1.0.0_STABLE.md` - Backup versione precedente

## ✅ Checklist Deploy

- [ ] Build locale OK
- [ ] Test su deployment preview
- [ ] Verificare console browser
- [ ] Testare `/assets/*.js` accessibili
- [ ] Creare tag Git
- [ ] Creare branch backup
- [ ] Aggiornare documentazione
- [ ] Push su GitHub
- [ ] Verificare produzione

## 🆘 Contatti

- **Email**: anton@nextblock.io
- **GitHub**: @antoncarlo

---
**Ultima Modifica**: 27 Nov 2024
