# FrontRow — Architettura & convenzioni

## Struttura cartelle (feature-first)
```
src/
  main.tsx  router.tsx
  app/
    providers/AuthProvider.tsx        # init sessione Supabase + onAuthStateChange
    layouts/TabLayout.tsx             # frame con bottom nav per le tab principali
  lib/
    supabase.ts                       # client tipizzato (Database)
    queryClient.ts                    # TanStack Query client
    utils/cn.ts  utils/dates.ts
    constants/countries.ts            # ISO alpha-2 + Intl.DisplayNames
  styles/index.css                    # Tailwind v4 @theme con i design token
  types/
    database.ts                       # tipi generati da Supabase (NON a mano, se possibile)
    domain.ts                         # alias comodi (Profile, Concert, …)
  stores/
    useAuthStore.ts                   # session, user, ready
    useUIStore.ts                     # toasts (+ helper `toast`)
  components/
    ui/                               # primitives: Button, Input, Select, Textarea,
                                      #   Combobox, SegmentedControl, Skeleton, Spinner,
                                      #   Toaster, Badge, AvatarTile
    layout/BackHeader.tsx  layout/BottomNav.tsx
    brand/Logo.tsx                    # Logo (wristband SVG) + Wordmark
  features/
    auth/        (pages, api, hooks, components, schemas)
    concerts/    (Log/Detail/Edit/MyShows, FestivalForm, SetlistEditor, api, hooks, utils)
    home/        (Home dashboard, OnThisDay)
    stats/       (Stats tab — placeholder, da espandere in Sprint 7)
    profile/     (Profile tab)
    social/      (FindFriends, PublicProfile, BuddiesTab, api/social.ts, hooks.ts)
supabase/
  migrations/*.sql                    # fonte di verità dello schema (replay su prod)
  functions/<name>/index.ts           # edge functions (Deno)
design_handoff/                       # prototipo + spec + logo + style guide
docs/                                 # questi file di pianificazione
```

## Routing (`src/router.tsx`)
- `PublicOnly` wrappa `/`, `/signin`, `/signup`.
- `/auth/callback` (OAuth).
- `RequireOnboarding` → `/username`.
- `RequireProfile` wrappa tutto il resto:
  - `TabLayout` children: `/home`, `/shows`, `/stats`, `/profile` (hanno la bottom nav).
  - Full-screen (no bottom nav): `/log`, `/show/:id`, `/show/:id/edit`,
    `/show/:id/setlist`, `/friends`, `/u/:username`.
- `*` → redirect a `/`.

## Design token (Tailwind v4, in `styles/index.css` @theme)
Colori principali (usali SEMPRE via classi utility):
- bg: `bg-app` #0d0c16, `bg-page`, `bg-card` #111118, `bg-surface` #16151f
- accent: `text-orange`/`bg-orange` #e8752a, `orange-dim/mid/glow`
- testo: `text-fg` #f0eeeb, `fg-muted`, `fg-subtle`, `fg-faint`, `fg-disabled` (#45445a)
- bordi: `border-border`, `border-border-strong`, `border-border-accent`
- semantici: `success` #1ed760, `error` #ef4444, `warning` #f59e0b
- font: `font-display` = Syne (headings/numeri), `font-body` = DM Sans
- radius: `rounded-lg`=14, `rounded-xl`=16, `rounded-2xl`=20, `rounded-3xl`=24

## Componenti firma da riusare
- **`AvatarTile`** (`components/ui/AvatarTile.tsx`): tile quadrata gradiente duotone +
  stripe 45° + iniziali. `brand` = variante arancione (avatar utente). `gradientFor(name)`
  esporta il css del gradiente (usato per l'hero del detail).
- **`Badge`** (tone: orange/green/neutral) per etichette (FESTIVAL, Upcoming, You too…).
- **`ConcertCard`** per le liste di show (avatar + titolo + sub + data/badge).
- **`BackHeader`** per le pagine full-screen; **`BottomNav`** gestita da `TabLayout`.

## Pattern dati
- **Server state** → TanStack Query (`useQuery`/`useMutation`), key tipo `['concerts', userId]`,
  `['concert', id]`, `['setlist', id]`, `['friendships', userId]`, `['concert-buddies', id]`.
- **Auth/UI** → Zustand (`useAuthStore`, `useUIStore`). Toast: `import { toast } from '@/stores/useUIStore'`.
- **Form** → React Hook Form + Zod (schemas in `features/*/schemas.ts`). Nei form molto
  dinamici (festival, setlist) si usa `useState` con update immutabili.
- **API** → funzioni in `features/*/api/*.ts` che chiamano `supabase`. Niente fetch diretti ai REST URL.
- Query Supabase con embed: usa hint FK espliciti quando c'è ambiguità, es.
  `headliner:artists!concerts_headliner_id_fkey(...)` (artists è collegato a concerts sia
  via `headliner_id` sia via la junction `concert_artists` → serve il hint).

## Convenzioni di stile codice
- TypeScript strict, `noUnusedLocals`/`Parameters` attivi: niente variabili inutilizzate.
- Match della densità/idiomi del codice intorno. Classi Tailwind, niente CSS inline tranne
  gradienti dinamici / glow (dove serve `style`).
- Pronomi neutri (they/them) per persone non identificate.
