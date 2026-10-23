# Backlog — task singoli (una chat ciascuno)

Task fuori dagli sprint principali. Ognuno è autosufficiente.

---

## B1 — Restyle del form "Log a Show" al prototipo (screen 04) 🟡 priorità media
Il form (`src/features/concerts/components/ConcertForm.tsx`) è funzionale e on-brand ma NON
segue il prototipo. Portarlo fedele (SOLO markup/stile, logica RHF invariata):
1. Campi con **label inline a destra** dentro l'input ("VENUE" / "CITY" / "COUNTRY"); City e
   Country affiancati. Vedi `grep "SHOW DETAILS" design_handoff/FrontRow.dc.html`.
2. Ticket type come **chip** selezionabili (Floor GA / Seated / VIP / Free / Press), chip attivo arancione.
3. Headliner/artista selezionato come **AvatarTile card** + nome + ruolo + X, bordo arancione;
   support con bottone tratteggiato "+ Add support act".
4. Data con valore formattato + icona calendario.
5. Spaziature/label sezione come il prototipo (ARTIST / SHOW DETAILS / TICKET).
**Done**: form identico allo screen 04; typecheck+build; verifica che il save funzioni ancora.

## B2 — Config Google OAuth
In Supabase → Authentication → Providers → Google: incolla client id/secret (da Google Cloud
Console, redirect `https://aznauvbcnisndwitunjb.supabase.co/auth/v1/callback`), e aggiungi i
redirect URL (localhost + prod) in URL Configuration. Poi testa "Continue with Google".
(È config, non codice — ma documentala e verifica il flow /auth/callback.)

## B3 — Secret setlist.fm
Imposta `SETLISTFM_API_KEY` (chiave da api.setlist.fm) come secret edge function:
`supabase secrets set SETLISTFM_API_KEY=...` o dashboard → Edge Functions → Secrets.
Poi testa "Import from setlist.fm" nell'editor setlist di un concerto con artista/data reali.

## B4 — Cleanup dati di test (opzionale)
Sul DB dev ci sono account `claudetest`/`friendtest` e alcuni show creati per i test.
Se vuoi ripulire prima di produzione, cancellali (o parti da DB prod pulito al lancio).

## B5 — Code splitting (opzionale)
Il bundle supera 500kB (warning build). Introdurre `React.lazy` per le route pesanti
(World Map, Wrapped, Stats) e/o `manualChunks` in `vite.config.ts`.

## B6 — Test automatici (opzionale, da handoff: Vitest + Playwright)
Aggiungere qualche test unitario (utils: stats, mutual, dates) e un E2E happy-path
(login → log show → detail). Non bloccante per lo sviluppo feature.
