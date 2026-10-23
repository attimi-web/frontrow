# FrontRow — Stato del progetto

> Aggiorna questo file alla fine di ogni sprint/step rilevante.
> Ultimo aggiornamento: fine Sprint 6 (Social).

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
| 7 | Stats & Delight (Stats dashboard, Year Wrapped, Artist Page, Venue Page) | 🟡 Step 1–5 fatti (manca solo Year Wrapped, screen 11/29/19/28) → `sprints/sprint-07-stats-delight.md` |
| 8 | Map & Gamification (World Map, Achievements, Tour Tracker) | ⬜ → `sprints/sprint-08-map-gamification.md` |
| 9 | Discovery & Notifications (Search, Wishlist, Notifications, Press/Media) | ⬜ → `sprints/sprint-09-discovery-notifications.md` |
| 10 | PWA (manifest, service worker, offline, install, Settings, Shareable card, Confirm modal) | ⬜ → `sprints/sprint-10-pwa.md` |

MVP = Sprint 0–3 (raggiunto). Il resto è crescita.

## Schermate (37) — stato
Fatte: 01 Onboarding, 02 Sign Up, 03 Home, 04 Log a Show, 05 Concert Detail,
06 My Shows, 07 Festival Detail, 08 Setlist, 10 Profile, 13 Friends, 17 Photos,
20 On This Day (pagina), 23 Public Profile, 24 Edit Concert, 30 Festival Schedule
(dentro detail), 31 Artist Role Picker (inline), 35 Skeleton, 37 Toasts.

Da fare: 09 Year Wrapped, 11 Stats, 12 Search & Discover, 14 Wishlist,
15 Notifications, 16 Press/Media form (parziale: accreditation già nel form),
18 World Map, 19 Artist Page, 21 Achievements, 22 Tour Tracker, 25 Empty States
(parziale), 26 Settings, 27 Shareable Card, 28 Venue Page, 29 Stats Extended,
32 PWA Install, 33 Offline Mode, 34 Form Validation (parziale), 36 Confirmation Modal.

## Design già allineati al prototipo
Onboarding, Sign Up/In, Home, My Shows, Concert/Festival Detail, Profile, Stats (card),
Find Friends, Public Profile, Setlist, Photos. Logo = SVG esatto del handoff.
Componente firma: `AvatarTile` (gradiente duotone + stripe + iniziali).

## Debito / note aperte
- **Log a Show form**: funzionale e on-brand ma NON allineato al prototipo (label inline,
  chip ticket, artist come AvatarTile card). Vedi `sprints/backlog.md`.
- **Confirmation modal**: la delete usa `window.confirm` → da sostituire con modal (Sprint 10 / screen 36).
- **Google OAuth**: da configurare client id/secret in Supabase + redirect URL.
- **setlist.fm**: import pronto, manca il secret `SETLISTFM_API_KEY`.
- **Dati di test** nel DB dev: account claudetest/friendtest + qualche show. Innocui.

## Ultimi commit chiave
```
a4908ba feat: Sprint 6 — social (friends, public profiles, buddy tagging)
41f5cca feat: Sprint 5 — setlists & photos
... (design: realign ...)
a481ff7 feat: Sprint 4 — festivals
```
