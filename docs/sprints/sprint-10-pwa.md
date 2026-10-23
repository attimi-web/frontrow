# Sprint 10 — PWA & System

Obiettivo: rendere FrontRow una vera PWA installabile e offline, + schermate di sistema.

Schermate prototipo: **32** (PWA Install), **33** (Offline Mode), **26** (Settings),
**27** (Shareable Card), **36** (Confirmation Modal), **34** (Form Validation).

Prerequisiti: `docs/CONTEXT.md`. Richiede dipendenza `vite-plugin-pwa` (Workbox) + icone.

---

## Step 1 — Manifest + icone + service worker base
**Cosa**: installabilità.
- Aggiungi `vite-plugin-pwa` in `vite.config.ts`. Manifest (da handoff §11):
  name "FrontRow", short_name "FrontRow", description "Every show. Every moment.",
  start_url "/", display standalone, background/theme_color `#0d0c16`.
- Icone 192/512 (512 maskable) in `public/` dal mark del logo (wristband). Genera i PNG.
- Service worker: precache app shell (cache-first statici), network-first per le API.
**File**: `vite.config.ts`, `public/icon-192.png`, `public/icon-512.png`, manifest.
**Done**: Lighthouse/Chrome riconosce l'app come installabile; SW registrato.

## Step 2 — Offline Mode (screen 33)
**Design**: `grep "33 — Offline"`.
**Cosa**: lettura offline dei dati cached.
- Persisti la cache di TanStack Query su IndexedDB (`@tanstack/query-persist-client` +
  `idb-keyval`/localStorage). All'avvio ripristina; mostra banner "Offline — dati del {tempo}".
- Mutazioni offline: per MVP disabilita con toast chiaro; (upgrade futuro: background sync).
**File**: `lib/queryClient.ts` (persister), banner offline (hook `navigator.onLine`).
**Done**: con rete offline, Home/My Shows mostrano l'ultimo stato + banner.

## Step 3 — Install Prompt (screen 32)
**Design**: `grep "32 — PWA Install"`.
**Cosa**: intercetta `beforeinstallprompt`, posticipa, mostra UI custom quando l'utente ha
loggato 3+ show; re-trigger da Settings.
**File**: hook `useInstallPrompt`, componente prompt; wiring.
**Done**: prompt custom compare alle condizioni giuste e installa.

## Step 4 — Confirmation Modal (screen 36) + stati validazione (34)
**Design**: `grep "36 — Confirmation"` e `grep "34 — Form"`.
**Cosa**:
- Componente `Modal`/`ConfirmDialog` (scrim blur, scale-up) e sostituisci i `window.confirm`
  (es. delete show in `ConcertDetail`) con il modal fedele al prototipo.
- Rivedi gli stati di validazione form (error/valid/warning, submit disabled) dove mancano,
  allineandoli allo screen 34 (già in gran parte coperti da `Input`).
**File**: `components/ui/Modal.tsx`, `ConfirmDialog.tsx`; update ConcertDetail e altri usi.
**Done**: nessun `window.confirm` residuo; modal fedele; validazioni coerenti.

## Step 5 — Settings (screen 26)
**Design**: `grep "26 — Settings"`.
**Cosa**: `/settings` — account, notifiche, privacy (is_public toggle), export dati, logout,
"Add to Home Screen". Il gear nel Profile (ora fa logout) → deve aprire Settings.
- Toggle `is_public` (update profiles). Export: genera un JSON dei propri show (download client-side).
**File**: `features/settings/pages/Settings.tsx`, api; route; collega il gear del Profile.
**Done**: Settings funzionante; logout e privacy toggle lì dentro.

## Step 6 — Shareable Card (screen 27)
**Design**: `grep "27 — Shareable Card"`.
**Cosa**: card "Instagram-ready" di un concerto o del Year Wrapped, generata come immagine
(canvas/`html-to-image`) da scaricare/condividere.
**File**: `features/share/` componenti + util di export immagine; entry da Concert Detail / Wrapped.
**Done**: generi e scarichi una card immagine del concerto.

---

## Checklist chiusura sprint + pre-lancio
- [ ] Step 1 manifest+SW
- [ ] Step 2 offline
- [ ] Step 3 install prompt
- [ ] Step 4 confirm modal + validazioni
- [ ] Step 5 Settings
- [ ] Step 6 Shareable card
- [ ] Aggiorna `PROJECT_STATUS.md`
- [ ] **Pre-lancio** (separato): progetto Supabase **prod**, replay migrazioni 0001→ultima,
      config Google OAuth + redirect, secret setlist.fm, branch `main`, deploy (Vercel),
      env di produzione.
