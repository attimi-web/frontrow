# Sprint 9 — Discovery & Notifications

Obiettivo: ricerca/scoperta, wishlist con alert, notifiche in-app, modalità press/media.

Schermate prototipo: **12** (Search & Discover), **14** (Wishlist), **15** (Notifications),
**16** (Press / Media Form).

Prerequisiti: `docs/CONTEXT.md` + `DATABASE.md`. Richiede trigger DB per le notifiche (Step 3).

---

## Step 1 — Search & Discover (screen 12)
**Design**: `grep "12 — Search"`.
**Cosa**: `/search` (o tab) — ricerca unificata artisti/venue/concerti + trending.
- Artisti/venue: query su `artists`/`venues` (leggibili da authenticated). Concerti: i propri.
- Risultati tipizzati con AvatarTile; tap → Artist/Venue/Concert page (Sprint 7).
- "Trending" per ora può essere: artisti/venue più loggati globalmente (query aggregata) o
  semplicemente i propri più frequenti.
**File**: `features/search/pages/Search.tsx`, api, hook; route; (eventuale icona search già in My Shows → collegala).
**Done**: ricerca funzionante con navigazione alle pagine.

## Step 2 — Wishlist (screen 14)
**Design**: `grep "14 — Wishlist"`.
**Cosa**: `/wishlist` — artisti che vuoi vedere (`wishlist_artists`), toggle alert on/off.
- Aggiungi/rimuovi artista dalla wishlist (riusa combobox artisti / find_or_create).
- Mostra gli artisti in wishlist; `alerts_on` per gli alert tour (gli alert veri arrivano con
  Spotify/notifiche; per ora solo flag + UI).
**File**: `features/wishlist/pages/Wishlist.tsx`, api, hook; route; entry point.
**Done**: aggiungi/rimuovi artisti in wishlist, toggle alert.

## Step 3 — Notifications (screen 15) + trigger DB
**Design**: `grep "15 — Notifications"`.
**Cosa**: `/notifications` — lista notifiche (`notifications`): friend tag, richieste amicizia,
buddy "stesso show", "On This Day". Badge/puntino sulla campanella in Home.
- **DB — GIÀ FATTO** (`0010_social_notifications.sql`, applicata sul dev): trigger SECURITY DEFINER
  che inseriscono in `notifications` (type `friend_request`, `friend_accepted`, `buddy_tagged`,
  `buddy_confirmed`; `data` jsonb con `actor_id` + `friendship_id` o `concert_id`/`buddy_id`).
  Servono perché un utente non può inserire notifiche per un altro (RLS). Aggiungi una nuova
  migrazione solo per tipi nuovi (es. "On This Day").
- Riferimento: il branch `origin/claude/chat-session-recovery-qobzyb` contiene una bozza di
  `pages/Notifications.tsx` + `useNotifications.ts` (sotto `features/social/`) — da guardare, non
  da mergiare in blocco (è una versione alternativa dello Sprint 6).
- Client: `useNotifications` query, mark-as-read (update `read_at`, consentito dalla policy owner),
  realtime opzionale (Supabase channel) per aggiornare in tempo reale.
- Collega la campanella in `Home` a `/notifications` con conteggio non lette.
**File**: `features/notifications/pages/Notifications.tsx`, api, hook; route;
wiring campanella Home.
**Done**: tagga un amico / invia richiesta con un secondo account → compare la notifica; mark read funziona.

## Step 4 — Press / Media form (screen 16)
**Design**: `grep "16 — Press"`.
**Cosa**: la sezione accreditation è GIÀ nel form concerto (`AccreditationSection`). Qui:
- Rendi l'accordion/press mode fedele al prototipo (campi: type photo/video/press/all_access,
  client/publication, photo pit, first-3-songs rule, publication_url).
- Mostra i dati di accreditation nel Concert Detail (InfoTab già ha la card "Accreditation").
- Eventuale indicatore "press mode" sul profilo (`is_press`/`press_type`).
**File**: aggiorna `AccreditationSection`/`ConcertForm`; eventuale badge press.
**Done**: modalità press completa e fedele; dati visibili nel detail.

---

## Checklist chiusura sprint
- [ ] Step 1 Search & Discover
- [ ] Step 2 Wishlist
- [ ] Step 3 Notifications (+ trigger migrazione)
- [ ] Step 4 Press / Media
- [ ] Aggiorna `PROJECT_STATUS.md` (Sprint 9 ✅, schermate 12/14/15/16)
