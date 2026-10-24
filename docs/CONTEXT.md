# FrontRow — Context (bootstrap per ogni chat)

Leggi questo file per primo in ogni chat nuova. Contiene i fatti che una chat "fredda"
non può sapere.

## Cos'è
FrontRow: PWA mobile-first (dark mode) per appassionati di concerti — logga, traccia e
rivivi ogni concerto e festival. Larghezza di design 390px. Solo dark mode.

## Repo & branch
- GitHub: `github.com/attimilabs-org/frontrow` (remote `git@github.com:attimilabs-org/frontrow.git`; ex `TommasoAttimi/frontrow`)
- Branch di lavoro: **`develop`** (→ DB di sviluppo). `main` → produzione (si crea al lancio).
- Commit: in inglese, in stile `feat:/fix:/design:/chore:`, e termina con:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- Working tree: `/Users/tommaso/WebApps/frontrow` (può variare se la sessione è forkata).

## Stack
React 18 · TypeScript · Vite · Tailwind CSS v4 · Zustand · TanStack Query ·
React Hook Form + Zod · React Router v7 · Supabase (Auth/Postgres/Storage/Edge) ·
date-fns · d3-geo + topojson-client + world-atlas (World Map). Build: `vite`.

## Supabase (progetto DEV)
- Nome: `frontrow` · ref: **`aznauvbcnisndwitunjb`** · region eu-west-1
- URL: `https://aznauvbcnisndwitunjb.supabase.co`
- Publishable (anon) key: `sb_publishable_U_gHUcrQEFiaeS6HcZ3uqw_0_V5qLFf` (pubblica, già in `.env.example`)
- Migrazioni applicate: `0001`–`0013` (vedi `DATABASE.md`)
- Edge function deployate: `setlist-import` (richiede secret `SETLISTFM_API_KEY`, non ancora impostato),
  `geocode-venue` (lat/lng dei venue, nessun secret)
- Storage bucket: `concert-photos` (pubblico in lettura, scrittura solo owner)

## Env locale
`.env.local` (gitignored) con:
```
VITE_SUPABASE_URL=https://aznauvbcnisndwitunjb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_U_gHUcrQEFiaeS6HcZ3uqw_0_V5qLFf
```
Se manca: `cp .env.example .env.local` (i valori sono già corretti per dev).

## Come far girare l'app
```bash
npm install            # solo se node_modules manca
npm run dev            # dev server (porta 5173, o 5174 se occupata)
npm run typecheck      # tsc --noEmit — deve essere pulito
npm run build          # build di produzione — deve passare
```
Per vedere il **design di riferimento**: `python3 -m http.server 5050 --directory design_handoff`
poi apri `http://localhost:5050/FrontRow.dc.html` (config `design` in `.claude/launch.json`).

## Account di test (sul DB dev)
- `claudetest@example.com` / `testpassword123` (username: claudetest) — ha alcuni show
- `friendtest@example.com` / `testpassword123` (username: friendtest) — amico di claudetest, share Muse
- Il flow Google OAuth richiede ancora la config in Supabase (client id/secret) → non testabile finché non impostato.

## Tool disponibili (variano per sessione)
- **Supabase MCP** (`apply_migration`, `execute_sql`, `generate_typescript_types`,
  `deploy_edge_function`, …): a volte connesso, a volte no. Se NON connesso e serve una
  migrazione → scrivi il file SQL in `supabase/migrations/` e chiedi all'utente di
  eseguirlo nel **SQL editor della dashboard Supabase** (o `supabase db push` via CLI).
- **Browser integrato** (`mcp__Claude_Browser__*`) o **Claude_Preview**: per verificare
  nel browser (preview_start → screenshot/navigate/eval). Uno dei due è di solito presente.

## Gotcha già risolti (NON rifare, ma sappi che esistono)
1. Tabelle create via MCP non ricevono i grant di ruolo → `0005` concede
   select/insert/update/delete a `authenticated`/`anon`. Se una nuova tabella dà 403
   "permission denied for table", mancano i grant (non è RLS).
2. `concerts_read` usa un check owner **inline** (non la funzione STABLE) così
   `insert().select()` funziona in RETURNING (`0006`).
3. `user_id` nelle mutation si prende da `supabase.auth.getSession()` al submit, non dallo store.
4. Catalogo artisti/venue/tour: usa gli RPC `find_or_create_artist` / `find_or_create_venue` (`0007`) /
   `find_or_create_tour` (`0012`), mai insert diretti.
5. setlist.fm: chiamate server-side via edge function; la chiave sta nel secret, non nel client.
