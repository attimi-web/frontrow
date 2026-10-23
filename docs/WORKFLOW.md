# FrontRow — Workflow per ogni chat/step

Obiettivo: ogni chat fa **un solo step** in modo completo e verificato, poi committa.

## Rituale di inizio chat
1. Leggi `docs/CONTEXT.md` (fatti chiave) e, se serve, `ARCHITECTURE.md` / `DATABASE.md`.
2. Apri il file dello sprint indicato e individua lo **step** richiesto.
3. Se lo step tocca uno schermo del prototipo → **guarda il design** prima di scrivere codice.
4. Costruisci, verifica, committa, aggiorna lo stato.

## Come leggere il design (fedeltà al prototipo)
Il prototipo è `design_handoff/FrontRow.dc.html` (37 schermate, griglia di mockup 390px).
Due modi:
- **Visivo**: avvia `python3 -m http.server 5050 --directory design_handoff`, apri
  `http://localhost:5050/FrontRow.dc.html`, e porta in vista lo schermo con uno script tipo:
  ```js
  // trova il cell dello schermo N e scrolla lì, poi screenshot
  ```
  (gli schermi hanno label "NN — Titolo"; ognuno è un div largo 390px).
- **Markup**: `grep -n "NN — Titolo" design_handoff/FrontRow.dc.html` e leggi le righe
  successive. Gli stili sono inline → prendi i valori esatti (colori, dimensioni, copy).
Riusa `AvatarTile`, `Badge`, `BackHeader`, i token Tailwind. NON inventare stili nuovi.

## Verifica (sempre prima del commit)
```bash
npm run typecheck     # deve uscire pulito
npm run build         # deve passare
```
Poi verifica nel browser (preview):
- Avvia il dev server (`preview_start` name "dev", o `npm run dev`).
- Fai login con `claudetest@example.com` / `testpassword123`.
- Esercita il flusso dello step e fai 1–2 screenshot a conferma.
- Controlla la console: 0 errori.
- Per flussi social/multi-utente usa anche `friendtest@example.com`.

Suggerimento per pilotare il browser via JS (input controllati React):
```js
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
setter.call(el, 'valore'); el.dispatchEvent(new Event('input',{bubbles:true}));
```
Per submit dei form: `document.querySelector('form').requestSubmit()`.

## Commit & push
- Branch: `develop`. Committa solo i file dello step (`git add src/ supabase/ docs/ ...`),
  evitando le modifiche di working-tree non tue (`.claude/launch.json`, file cancellati del handoff).
- Messaggio in inglese `feat:/fix:/design:/chore:`, chiuso con la riga Co-Authored-By (vedi CONTEXT.md).
- `git push origin develop`.

## Database in uno step
- Se serve una tabella/colonna/policy/RPC → nuova migrazione in `supabase/migrations/`
  e **applicala** (MCP o dashboard, vedi DATABASE.md). Non basta scrivere il file.
- Dopo DDL rigenera/aggiorna `src/types/database.ts`.

## Alla fine dello step
- Aggiorna lo stato nel file dello sprint (checkbox dello step) e, se chiudi uno sprint,
  aggiorna `docs/PROJECT_STATUS.md`.
- Riassumi all'utente: cosa fatto, come verificato, commit, cosa manca.

## Definizione di "fatto" per uno step
- Typecheck + build verdi.
- Schermo fedele al prototipo (se applicabile).
- Flusso verificato nel browser senza errori console.
- Commit + push su `develop`.
- Stato aggiornato nei docs.
