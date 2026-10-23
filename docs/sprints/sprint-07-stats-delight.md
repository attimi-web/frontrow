# Sprint 7 — Stats & Delight

Obiettivo: trasformare FrontRow da "diario" a "prodotto che ti fa rivivere l'anno".
Grafici statistici, Year Wrapped, pagine Artista e Venue.

Schermate prototipo: **11** (Stats Dashboard), **29** (Stats Extended), **09** (Year Wrapped),
**19** (Artist Page), **28** (Venue Page).

Prerequisiti: leggi `docs/CONTEXT.md` + `ARCHITECTURE.md`. Nessuna migrazione necessaria
(tutto deriva dalla tabella `concerts` e dai join esistenti), tranne eventualmente un RPC
di aggregazione opzionale (vedi Step 1).

> Nota grafici: NON aggiungere librerie pesanti. Costruisci barre/donut con SVG/CSS inline
> coerenti ai token (arancione su sfondo scuro). Se vuoi una libreria, `recharts` è ok ma
> valuta prima il peso del bundle.

---

## Step 1 — Data layer statistiche
**Cosa**: funzioni/hook che aggregano i dati per i grafici, a partire dagli show dell'utente.
- `src/features/stats/stats.ts`: a partire da `ConcertListItem[]` (da `useConcerts`) calcola:
  shows per anno, shows per mese (ultimo anno), top artisti (conteggio headliner),
  breakdown per paese/città, per venue, spesa totale (`ticket_price_paid`) per anno,
  % festival vs concerti. (Il genere richiede `artists.genres`: per ora opzionale — se serve,
  fai una query extra agli artisti headliner e aggrega i generi.)
- Aggiungi test manuale mentale: con gli show di `claudetest` i numeri devono tornare.
**File**: `features/stats/stats.ts` (+ eventuale `useStatsData` hook).
**Done**: funzioni pure tipizzate, usate nello Step 2. typecheck verde.

## Step 2 — Stats Dashboard (screen 11)
**Design**: `grep "11 — Stats" design_handoff/FrontRow.dc.html`, leggi il markup.
**Cosa**: sostituisci il placeholder in `features/stats/pages/Stats.tsx`:
- Strip stat in alto (riusa lo stile card arancione già presente).
- Grafico a barre "Shows per anno".
- Breakdown generi (o paesi se i generi non ci sono) a barre orizzontali.
- Top artisti (lista con conteggio e AvatarTile).
- Link "Vedi tutto" → Stats Extended (Step 3).
**File**: `features/stats/pages/Stats.tsx` + `features/stats/components/BarChart.tsx` (SVG).
**Done**: Stats tab mostra i grafici reali, fedele al prototipo; nessun errore console.

## Step 3 — Stats Extended (screen 29)
**Design**: `grep "29 — Stats Extended"`.
**Cosa**: pagina full-screen `/stats/extended` con BackHeader: breakdown venue, grafico generi,
spesa nel tempo (barre per anno), altre metriche. Riusa i componenti dello Step 2.
**File**: `features/stats/pages/StatsExtended.tsx`; route in `router.tsx` (sotto RequireProfile).
**Done**: raggiungibile da "Vedi tutto" nello Stats dashboard.

## Step 4 — Artist Page (screen 19)
**Design**: `grep "19 — Artist Page"`.
**Cosa**: `/artist/:id` — header con nome artista + "visto N volte", timeline raggruppata per
tour, tab (Panoramica / Setlist). Query: concerti dove l'artista è headliner
(`concerts.headliner_id = :id`) **o** support (`concert_artists.artist_id = :id`) **o**
performance in festival (`performances.artist_id = :id`), per l'utente corrente.
- API: `features/artists/api/artists.ts` → `getArtist(id)`, `getArtistShows(userId, artistId)`.
- Rendi cliccabili verso `/artist/:id`: il titolo in Concert Detail (headliner) e le righe lineup.
**File**: `features/artists/pages/ArtistPage.tsx`, api, hook; route; link dal detail.
**Done**: da un concerto, tap sull'headliner → pagina artista con tutti i suoi show.

## Step 5 — Venue Page (screen 28)
**Design**: `grep "28 — Venue Page"`.
**Cosa**: `/venue/:id` — nome venue + città/paese, mappa/pin (se lat/lng presenti, altrimenti
placeholder), lista di tutti gli show in quel venue (dell'utente), eventuali upcoming.
- API: `getVenue(id)`, `getVenueShows(userId, venueId)` (concerts.venue_id).
- Rendi cliccabile il venue in Concert Detail → `/venue/:id`.
**File**: `features/venues/pages/VenuePage.tsx`, api, hook; route; link dal detail.
**Done**: da un concerto, tap sul venue → pagina venue con gli show lì.

## Step 6 — Year Wrapped (screen 09)
**Design**: `grep "09 — Year Wrapped"`.
**Cosa**: `/wrapped` (anno corrente) o `/wrapped/:year` — card stile Spotify Wrapped con
reveal sequenziale (stat per stat, ~400ms) su gradienti/arancione: n° show, top artista,
città/paesi, festival, spesa, ecc. Pulsante per generare una card condivisibile (link allo
Shareable Card dello Sprint 10, per ora può essere placeholder/screenshot).
- Dati: dallo Step 1 filtrati per anno.
- Animazioni: CSS transitions + delay incrementale.
**File**: `features/stats/pages/YearWrapped.tsx`; route; entry point dallo Stats dashboard o Home.
**Done**: `/wrapped` mostra il riepilogo animato dell'anno con i dati reali.

---

## Checklist chiusura sprint
- [x] Step 1 data layer — `features/stats/stats.ts` (summary, showsPerYear, topArtists,
      countriesVisited, totalSpent/spendingPerYear, formatter valuta). Aggiunti
      `ticket_price_paid`/`ticket_currency` a `ConcertListItem` + `LIST_SELECT`.
- [x] Step 2 Stats Dashboard (screen 11) — `features/stats/pages/Stats.tsx` +
      `components/BarChart.tsx`. Summary cards, shows per year, top artists, countries,
      money spent (area chart). Verificato nel browser (claudetest), console pulita.
- [x] Step 3 Stats Extended (screen 29) — `features/stats/pages/StatsExtended.tsx`,
      route `/stats/extended`, link "See all stats" dalla dashboard. Top venues +
      buddy leaderboard via `components/HBars.tsx` (riusato anche nei Top artists),
      genre breakdown + buddy leaderboard via `api/stats.ts` (query generi headliner
      + `concert_buddies`). Selettore anno. Monthly spend riusa `BarChart`.
      Verificato nel browser (claudetest): venues, buddy @friendtest, empty states
      per generi/spesa (dati di test senza generi/prezzi). Console pulita.
- [ ] Step 4 Artist Page
- [ ] Step 5 Venue Page
- [ ] Step 6 Year Wrapped
- [ ] Aggiorna `PROJECT_STATUS.md` (Sprint 7 ✅, schermate 11/29/09/19/28)

### Note per i prossimi step
- Il link "Vedi tutto" → Stats Extended **non** è stato aggiunto (route Step 3 ancora
  assente, e il prototipo di screen 11 non lo mostra). Aggiungilo facendo lo Step 3.
- Il pill "All time" in alto è **statico** (decorativo, fedele al prototipo). Il filtro
  per periodo è da implementare (nessuno step lo richiede ancora).
- La spesa usa la valuta dominante (somma per valuta, mostra quella col totale più alto).
  Gli show di test non hanno prezzo → card "Money spent" nascosta e "Spent" = "—".
