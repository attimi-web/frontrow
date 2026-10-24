# Sprint 8 — Map & Gamification

Obiettivo: World Map dei concerti + sistema achievement + Tour Tracker.

Schermate prototipo: **18** (World Map), **21** (Achievements), **22** (Tour Tracker).

Prerequisiti: leggi `docs/CONTEXT.md` + `DATABASE.md`. Richiede:
- aggiunta dipendenza `react-simple-maps` (+ topojson world) per la mappa (vedi Step 2);
- geocoding dei venue (lat/lng) — vedi Step 1;
- migrazione per seed achievements + eventuale logica di unlock (Step 4).

---

## Step 1 — Geocoding dei venue (lat/lng)
**Cosa**: popolare `venues.lat`/`venues.lng` così la mappa può posizionare i punti.
Decisione architetturale (handoff Q4): **geocodifica una volta alla creazione** del venue,
server-side, e salva. Opzioni:
- Edge function `geocode-venue` che chiama **Nominatim** (OpenStreetMap, free, rate-limited
  1 req/s) con `city, country_name` e aggiorna il venue. Deploy come `setlist-import`.
- Trigger/edge chiamata dopo `find_or_create_venue`, oppure un pulsante "geocodifica" lato admin.
Per gli step successivi puoi anche pre-geocodificare i venue esistenti con una query una-tantum.
**File**: `supabase/functions/geocode-venue/index.ts`; wiring lato client in `createVenue`/hook.
**Done**: i venue nuovi (e quelli esistenti via backfill) hanno lat/lng.
**Nota**: rispetta i termini Nominatim (User-Agent, 1 req/s). In alternativa Google Geocoding (API key).

## Step 2 — World Map (screen 18)
**Design**: `grep "18 — World Map"`.
**Cosa**: `/map` (o tab/entry da Home/Stats) — globo/mappa stilizzata scura con un punto per
ogni paese/città in cui l'utente ha visto show, strip stat (paesi, città, show), filtro per anno.
- Lib: `react-simple-maps` + un topojson del mondo (countries). Stile dark, punti arancioni,
  scale-in con stagger al load.
- Dati: dagli show dell'utente con venue lat/lng; raggruppa per paese/città.
**File**: `features/map/pages/WorldMap.tsx`, componenti; route; dipendenze in package.json.
**Done**: mappa con i punti dei concerti, fedele all'estetica del prototipo.

## Step 3 — Tour Tracker (screen 22)
**Design**: `grep "22 — Tour Tracker"`.
**Cosa**: per un tour (tabella `tours`) mostra % completamento (show visti / `total_shows`),
dot per show (visti/mancati), timeline. Entry point: dal `tour_name`/tour di un concerto o
dalla Artist Page.
- `total_shows` può essere manuale o (futuro) da setlist.fm. Per ora usa i dati disponibili.
**File**: `features/tours/pages/TourTracker.tsx`, api, hook; route.
**Done**: pagina tour con % e dot per show.

## Step 4 — Achievements (screen 21)
**Design**: `grep "21 — Achievements"`.
**Cosa**: griglia badge (18/42 stile), unlocked/locked/in-progress con barra, rarità.
- **DB**: seed del catalogo `achievements` (migrazione, es. `0013_seed_achievements.sql`)
  con slug/name/description/rarity/criteria(jsonb). `user_achievements` traccia unlock+progress.
- **Logica unlock**: due approcci —
  (a) calcolo lato client dai dati (semplice, per MVP): deriva quali achievement sono sbloccati
      da `concerts`/stats e mostra; opzionalmente scrivi in `user_achievements`.
  (b) funzione DB/edge che valuta i criteri (più robusto). Per ora va bene (a).
- Esempi criteri: "Century Club" (100 show), "Globe Trotter" (10 paesi), "Festival Head"
  (N festival), "First Timer" (primo show), ecc. Definisci ~12–42 badge coerenti col prototipo.
**File**: migrazione seed; `features/achievements/pages/Achievements.tsx`, api/logic, hook; route;
entry point (Profile o Home).
**Done**: griglia badge con stato corretto in base ai dati dell'utente.

---

### Note Step 1
- **Provider**: Nominatim NON si può usare dall'edge (risponde 403 agli IP di Supabase).
  Si usa **Photon** (komoot, dati OSM, senza chiave) per il venue preciso e **Open-Meteo**
  geocoding per il centro città come fallback. Photon dall'edge viene rifiutato a intermittenza
  (connection refused, 1 retry): molti venue nuovi avranno quindi coordinate **a livello città**.
  Per la World Map (raggruppa per città/paese) va bene. Se servono pin precisi → provider con
  chiave (Mapbox, LocationIQ, Google) come secret dell'edge function.
- La precisione (venue/città) non è salvata nel DB, solo restituita dalla function.
- Il backfill (`{backfill:true}`, max 25 venue) è **solo admin** (`app_admins`, migrazione `0011`);
  gli altri utenti ricevono 403. Il geocoding del singolo venue resta aperto a tutti gli utenti
  loggati (scrive solo se le coordinate mancano).

### Note Step 2
- **Lib**: `d3-geo` + `topojson-client` + `world-atlas` (`land-110m.json`, senza Antartide) invece
  di `react-simple-maps` (che è solo un wrapper non più mantenuto di queste lib).
- **km total** = somma delle distanze (great-circle) tra show consecutivi in ordine di data,
  solo venue geocodificati. Non conosciamo la "casa" dell'utente, quindi è un'approssimazione.
- I festival senza `venue_id` non compaiono sulla mappa né nei conteggi paesi/città.
- Il pill "All time" in alto mostra la selezione corrente ma è statico (come in Stats); il filtro
  vero sono le chip anno.
- Nessun bottone back nel prototipo: aggiunto un chevron a sinistra del titolo per tornare indietro.

### Note Step 3
- **Date mancate**: non conosciamo il calendario completo del tour (servirebbe setlist.fm, B3),
  quindi le date non loggate sono una sola riga riassuntiva "N other dates". Chip "Missed" solo
  se `tours.end_date` è nel passato, altrimenti "Not seen".
- **total_shows** è condiviso (catalogo): lo imposta chiunque abbia uno show sul tour (tap su
  "Your completion ✎" per modificarlo). Validato 1–1000.
- I festival non hanno tour (il form festival non ha `tour_name`).
- Il tuo show Muse (account `tomm`) è stato collegato al tour "The Wow! Signal Europe Tour 2026"
  dal backfill; `total_shows` è ancora vuoto.

## Checklist chiusura sprint
- [x] Step 1 geocoding venue — edge function `geocode-venue` (deployata, verify_jwt).
      `findOrCreateVenue` (catalog.ts) la invoca fire-and-forget quando il venue non ha
      lat/lng (copre concerti e festival). Body `{venueId}` oppure `{backfill:true}` (max 25).
      Backfill eseguito: i 3 venue esistenti hanno lat/lng a precisione venue. Verificato:
      venue nuovo creato dal client → coordinate scritte in pochi secondi; Venue Page → Info
      mostra le coordinate.
- [x] Step 2 World Map (screen 18) — `features/map/{geo.ts,components/WorldMapCanvas.tsx,pages/WorldMap.tsx}`,
      route `/map` (lazy, chunk separato ~85kB). Entry: link "Map" nella card "Countries visited"
      dello Stats dashboard. Chip anno (All + anni), punti per città con scale-in sfalsato,
      tooltip città sul tap (default città top), strip countries/cities/km, Top Countries con
      bandiere e barre. `LIST_SELECT` ora include `venue.country/lat/lng`. Verificato (claudetest):
      London + Sesto San Giovanni, 2 paesi, 948 km, filtro 2026, tap → tooltip. Console pulita.
- [x] Step 3 Tour Tracker (screen 22) — `features/tours/{api,hooks,pages/TourTracker.tsx}`, route
      `/tour/:id`. Migrazione `0012_tours_link` (tour = headliner + nome, `find_or_create_tour`,
      `set_tour_total_shows`, backfill). Il salvataggio di un concerto con `tour_name` ora
      collega `concerts.tour_id`. Card con gradiente artista, completion `N / tot`, barra +
      segmenti (≤40), chip % e "left to see", lista date (visti ✓, planned "Upcoming", riga
      riassuntiva per le date non loggate). Entry: nome tour nel Concert Detail, tab Tours
      dell'Artist Page. Verificato (claudetest, tour di test poi rimosso): edit show → tour
      creato → link → tracker → totale 5 → 1/5 20%; guard RPC su tour altrui. Console pulita.
- [ ] Step 4 Achievements (+ seed migrazione)
- [ ] Aggiorna `PROJECT_STATUS.md` (Sprint 8 ✅, schermate 18/21/22)
