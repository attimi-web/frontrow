# FrontRow — Database, migrazioni, storage, edge functions

Progetto DEV: ref `aznauvbcnisndwitunjb`.

## Tabelle (public)
`profiles` (1:1 con auth.users, username unico citext), `artists`, `venues` (con lat/lng),
`tours`, `concerts` (type concert|festival; headliner_id, venue_id, ticket_*, photos text[],
setlist_fm_id, accred_*), `concert_artists` (lineup junction), `festival_days`,
`festival_stages`, `performances`, `setlist_songs`, `concert_buddies`, `friendships`,
`achievements` (catalogo), `user_achievements`, `wishlist_artists`, `notifications`,
`push_subscriptions`, `app_admins` (admin app, solo service role).

RLS attiva su tutte. Pattern: l'utente vede/modifica solo i propri dati; i profili pubblici
e gli show "attended" di profili pubblici sono leggibili da altri (per i profili pubblici e i mutual show).

## Migrazioni applicate (in `supabase/migrations/`)
| # | File | Cosa fa |
|---|---|---|
| 0001 | `0001_init.sql` | schema completo (enums, tabelle, indici, trigger updated_at) |
| 0002 | `0002_rls_policies.sql` | RLS + policy + helper `is_concert_owner`, `can_read_concert` (SECURITY DEFINER) |
| 0003 | `0003_harden_set_updated_at.sql` | search_path sul trigger |
| 0004 | `0004_username_available.sql` | RPC `username_available(name)` (bypassa RLS) |
| 0005 | `0005_grant_role_privileges.sql` | **grant** a anon/authenticated/service_role + default privileges |
| 0006 | `0006_fix_concerts_read_returning.sql` | `concerts_read` con owner-check inline (fix RETURNING) |
| 0007 | `0007_dedupe_catalog.sql` | merge duplicati + unique index case-insensitive + RPC `find_or_create_artist`/`find_or_create_venue` |
| 0008 | `0008_save_festival.sql` | RPC `save_festival(p_concert_id, p_payload jsonb)`: crea/sostituisce la gerarchia festival in modo atomico (SECURITY INVOKER) |
| 0009 | `0009_storage_concert_photos.sql` | bucket storage `concert-photos` + policy owner-only |
| 0010 | `0010_social_notifications.sql` | trigger SECURITY DEFINER che scrivono in `notifications`: friend request, friend accepted, buddy tagged, buddy confirmed |
| 0011 | `0011_app_admins.sql` | tabella `app_admins(user_id)`: RLS senza policy + grant revocati → solo service role |

Prossima migrazione libera: **`0012`**.

> **Admin**: le righe di `app_admins` si inseriscono a mano per ambiente (gli id utente cambiano):
> `insert into app_admins (user_id) values ('<auth.users.id>');`. Sul dev l'admin è `tomm`.

> **Nomi nella history del DB ≠ nomi dei file.** `list_migrations` sul progetto dev mostra nomi
> storici diversi dal repo: `0006_whoami_debug` (funzione di debug, poi rimossa),
> `0007_fix_concerts_read_returning` (= file `0006_…`), e `social_notifications` (= file `0010_…`,
> applicata da una sessione sul branch `claude/chat-session-recovery-qobzyb` e recuperata in repo
> a posteriori). Lo schema reale coincide con i file. Al replay su prod usare i file del repo.

## Come applicare una NUOVA migrazione
1. Scrivi il file `supabase/migrations/00NN_descrizione.sql` (numero successivo).
2. Se hai il **Supabase MCP** connesso: `apply_migration(project_id, name, query)`.
3. Se NON ce l'hai: chiedi all'utente di incollare l'SQL nel **SQL editor della dashboard**
   (Supabase → SQL) oppure `supabase db push` via CLI. **Non** lasciare lo schema solo nel file.
4. Dopo DDL: rigenera i tipi (`generate_typescript_types` → `src/types/database.ts`) se hai l'MCP;
   altrimenti aggiorna a mano solo le parti che servono (es. firma di un nuovo RPC nel blocco `Functions`).
5. Controlla gli advisor di sicurezza (`get_advisors`) se disponibili.

## Pattern RLS importanti
- **Grant ≠ RLS**: serve il grant di tabella (ruolo authenticated) *e* la policy. Errore
  "permission denied for table X" = manca il grant → vedi 0005 (default privileges ora
  coprono le tabelle nuove create dallo stesso ruolo).
- **RETURNING**: una funzione STABLE in una SELECT policy non "vede" la riga appena inserita
  durante `INSERT ... RETURNING`. Per questo `concerts_read` fa `user_id = auth.uid()` inline.
  Regola pratica: se fai `.insert().select()`, assicurati che la SELECT policy valuti l'owner
  direttamente sulla riga.
- **auth.uid() nelle mutation**: prendi l'id da `supabase.auth.getSession()` al submit.
- **Notifiche/social cross-user**: inserire una riga per un ALTRO utente (es. notifica) richiede
  un trigger SECURITY DEFINER o un RPC/edge (service role). I trigger social esistono già (`0010`);
  la UI notifiche è prevista in Sprint 9 (Step 3).

## Storage
- Bucket `concert-photos` (pubblico in lettura). Path: `{user_id}/{concert_id}/{uuid}.ext`.
- Policy: insert/update/delete solo se `(storage.foldername(name))[1] = auth.uid()::text`.
- API client: `features/concerts/api/photos.ts` (upload + update `concerts.photos`/`ticket_scan_url`).

## Edge functions (Deno, in `supabase/functions/`)
- `setlist-import`: cerca su setlist.fm (artist+date) e normalizza in `{title,is_encore,note}`.
  Legge `SETLISTFM_API_KEY` dai secret (**da impostare**). verify_jwt=true.
  Deploy via MCP `deploy_edge_function` oppure `supabase functions deploy setlist-import`.
- `geocode-venue`: scrive `venues.lat/lng` con il service role (i client non possono fare UPDATE
  sui venue). Body `{venueId}` o `{backfill:true}` (backfill **solo admin**: chi chiama deve essere in `app_admins`, altrimenti 403). Photon → fallback Open-Meteo (città);
  Nominatim è bloccato dagli IP di Supabase. Nessun secret. verify_jwt=true. Chiamata dal client
  in `findOrCreateVenue` (`requestVenueGeocode`). Con il deploy via MCP includi anche
  `../_shared/cors.ts` tra i file.

## RPC disponibili
`username_available(name)`, `find_or_create_artist(p_name)`, `find_or_create_venue(p_name,p_city,p_country,p_country_name)`,
`is_concert_owner(cid)`, `can_read_concert(cid)`, `save_festival(p_concert_id,p_payload)`.
