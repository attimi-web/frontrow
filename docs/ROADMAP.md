# FrontRow — Roadmap completa

Priorità: prima MVP (0–3), poi crescita (4→10). Ogni sprint mappa alcune delle 37 schermate.

| Sprint | Tema | Schermate | Stato |
|---|---|---|---|
| 0 | Foundation | — | ✅ |
| 1 | Auth | 01, 02, (username) | ✅ |
| 2 | Log a Show | 04, 05, 24, 31 | ✅ |
| 3 | Browse & Dashboard | 03, 06, bottom nav | ✅ |
| 4 | Festivals | 07, 30 | ✅ |
| 5 | Setlists & Photos | 08, 17 | ✅ |
| 6 | Social | 13, 23 | ✅ |
| 7 | Stats & Delight | 11, 09, 19, 28, 29 | ✅ |
| 8 | Map & Gamification | 18, 21, 22 | ✅ |
| 9 | Discovery & Notifications | 12, 14, 15, 16 | ⬜ |
| 10 | PWA & System | 26, 27, 32, 33, 34, 36 | ⬜ |

## Dettaglio sprint rimanenti
Ogni sprint ha un file in `sprints/` con step pensati per **una chat ciascuno**.

- **Sprint 7 — Stats & Delight** ✅ → `sprints/sprint-07-stats-delight.md`
  Stats dashboard con grafici, Year Wrapped (card stile Spotify), Artist Page, Venue Page.
- **Sprint 8 — Map & Gamification** ✅ → `sprints/sprint-08-map-gamification.md`
  World Map (d3-geo), geocoding venue, Achievements (badge), Tour Tracker.
- **Sprint 9 — Discovery & Notifications** → `sprints/sprint-09-discovery-notifications.md`
  Search & Discover, Wishlist + alert, Notifications (con trigger DB), Press/Media.
- **Sprint 10 — PWA & System** → `sprints/sprint-10-pwa.md`
  Manifest + service worker (vite-plugin-pwa), offline, install prompt, Settings,
  Shareable Card, Confirmation Modal, stati di validazione.

## Backlog (fuori sprint)
`sprints/backlog.md`: restyle form Log a Show, config Google OAuth, secret setlist.fm,
cleanup dati di test, ecc.

## Ordine consigliato
~~7~~ → ~~8~~ → 9 → 10. Dentro ogni sprint, segui l'ordine degli step (alcuni dipendono dai precedenti).
Prima di "lanciare" (prod): creare progetto Supabase prod, replay migrazioni, config OAuth,
branch `main`, deploy (Vercel).
