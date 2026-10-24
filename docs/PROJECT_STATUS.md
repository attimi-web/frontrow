# FrontRow — Stato del progetto

> Aggiorna questo file alla fine di ogni sprint/step rilevante.
> Ultimo aggiornamento: fine Sprint 8 (Map & Gamification).

## Legenda
✅ fatto · 🟡 parziale · ⬜ da fare

## Sprint

| Sprint | Tema | Stato |
|---|---|---|
| 0 | Foundation (Vite, Tailwind v4, token, struttura, UI primitives) | ✅ |
| 1 | Auth (email/password + Google, username selection) | ✅ (Google OAuth da configurare in Supabase) |
| 2 | Log a Show (form, artist/venue search-or-create, detail, edit) | ✅ |
| 3 | Browse & Dashboard (bottom nav, My Shows, Home, Stats/Profile placeholder) | ✅ |
| 4 | Festivals (builder giorni/palchi/performance, RPC save_festival) | ✅ |
| 5 | Setlists & Photos (editor setlist, Photos su Storage, edge function setlist.fm) | ✅ |
| 6 | Social (friends, public profile + mutual shows, buddy tagging) | ✅ |
| 7 | Stats & Delight (Stats dashboard, Year Wrapped, Artist Page, Venue Page) | ✅ (screen 11/29/09/19/28) → `sprints/sprint-07-stats-delight.md` |
| 8 | Map & Gamification (World Map, Achievements, Tour Tracker) | ✅ (screen 18/21/22 + geocoding venue) → `sprints/sprint-08-map-gamification.md` |
| 9 | Discovery & Notifications (Search, Wishlist, Notifications, Press/Media) | ⬜ → `sprints/sprint-09-discovery-notifications.md` |
| 10 | PWA (manifest, service worker, offline, install, Settings, Shareable card, Confirm modal) | ⬜ → `sprints/sprint-10-pwa.md` |

MVP = Sprint 0–3 (raggiunto). Il resto è crescita.

## Schermate (37) — stato
Fatte: 01 Onboarding, 02 Sign Up, 03 Home, 04 Log a Show, 05 Concert Detail,
06 My Shows, 07 Festival Detail, 08 Setlist, 09 Year Wrapped, 10 Profile, 11 Stats,
13 Friends, 17 Photos, 19 Artist Page, 20 On This Day (pagina), 23 Public Profile,
24 Edit Concert, 28 Venue Page, 29 Stats Extended, 30 Festival Schedule
(dentro detail), 31 Artist Role Picker (inline), 35 Skeleton, 37 Toasts,
18 World Map, 21 Achievements, 22 Tour Tracker.

Da fare: 12 Search & Discover, 14 Wishlist, 15 Notifications, 16 Press/Media form
(parziale: accreditation già nel form), 25 Empty States (parziale), 26 Settings, 27 Shareable Card,
32 PWA Install, 33 Offline Mode, 34 Form Validation (parziale), 36 Confirmation Modal.

## Design già allineati al prototipo
Onboarding, Sign Up/In, Home, My Shows, Concert/Festival Detail, Profile, Stats,
Stats Extended, Year Wrapped, Artist Page, Venue Page, Find Friends, Public Profile,
Setlist, Photos, World Map, Tour Tracker, Achievements. Logo = SVG esatto del handoff.
Componente firma: `AvatarTile` (gradiente duotone + stripe + iniziali).

## Debito / note aperte
- **Log a Show form**: funzionale e on-brand ma NON allineato al prototipo (label inline,
  chip ticket, artist come AvatarTile card). Vedi `sprints/backlog.md`.
- **Confirmation modal**: la delete usa `window.confirm` → da sostituire con modal (Sprint 10 / screen 36).
- **Google OAuth**: da configurare client id/secret in Supabase + redirect URL.
- **setlist.fm**: import pronto, manca il secret `SETLISTFM_API_KEY`.
- **Trigger notifiche** (`0010`) già attivi sul DB dev: le righe in `notifications` si accumulano
  ma la UI arriva con lo Sprint 9.
- **Geocoding venue**: Photon dall'edge è instabile → molti venue nuovi hanno coordinate a
  livello città (fallback Open-Meteo). Per pin precisi serve un provider con chiave.
- **Tour**: le date mancate non hanno venue/data (manca il calendario completo → setlist.fm).
- **Achievements**: calcolo lato client, `user_achievements` scritta dal client (falsificabile).
- **Admin**: tabella `app_admins` (dev: `tomm`). In prod va popolata a mano.
- **Dati di test** nel DB dev: account claudetest/friendtest + qualche show. Innocui.

## Ultimi commit chiave
```
(Sprint 8) feat: geocoding venue, World Map (18), Tour Tracker (22), Achievements (21)
(Sprint 7) feat: Year Wrapped (screen 09) + Stats/Artist/Venue (11/29/19/28)
a4908ba feat: Sprint 6 — social (friends, public profiles, buddy tagging)
41f5cca feat: Sprint 5 — setlists & photos
... (design: realign ...)
a481ff7 feat: Sprint 4 — festivals
```
