import { createBrowserRouter, Navigate } from 'react-router-dom'
import {
  PublicOnly,
  RequireOnboarding,
  RequireProfile,
} from '@/features/auth/components/Guards'
import { TabLayout } from '@/app/layouts/TabLayout'
import { OnboardingSplash } from '@/features/auth/pages/OnboardingSplash'
import { SignUp } from '@/features/auth/pages/SignUp'
import { SignIn } from '@/features/auth/pages/SignIn'
import { OAuthCallback } from '@/features/auth/pages/OAuthCallback'
import { UsernameSelect } from '@/features/auth/pages/UsernameSelect'
import { Home } from '@/features/home/pages/Home'
import { OnThisDay } from '@/features/home/pages/OnThisDay'
import { MyShows } from '@/features/concerts/pages/MyShows'
import { LogShow } from '@/features/concerts/pages/LogShow'
import { EditConcert } from '@/features/concerts/pages/EditConcert'
import { ConcertDetail } from '@/features/concerts/pages/ConcertDetail'
import { SetlistEditor } from '@/features/concerts/pages/SetlistEditor'
import { FindFriends } from '@/features/social/pages/FindFriends'
import { PublicProfile } from '@/features/social/pages/PublicProfile'
import { Stats } from '@/features/stats/pages/Stats'
import { StatsExtended } from '@/features/stats/pages/StatsExtended'
import { YearWrapped } from '@/features/stats/pages/YearWrapped'
import { ArtistPage } from '@/features/artists/pages/ArtistPage'
import { VenuePage } from '@/features/venues/pages/VenuePage'
import { Profile } from '@/features/profile/pages/Profile'

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/', element: <OnboardingSplash /> },
      { path: '/signin', element: <SignIn /> },
      { path: '/signup', element: <SignUp /> },
    ],
  },
  { path: '/auth/callback', element: <OAuthCallback /> },
  {
    element: <RequireOnboarding />,
    children: [{ path: '/username', element: <UsernameSelect /> }],
  },
  {
    element: <RequireProfile />,
    children: [
      // Main tabbed app
      {
        element: <TabLayout />,
        children: [
          { path: '/home', element: <Home /> },
          { path: '/shows', element: <MyShows /> },
          { path: '/stats', element: <Stats /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
      // Full-screen routes (no bottom nav)
      { path: '/stats/extended', element: <StatsExtended /> },
      { path: '/wrapped', element: <YearWrapped /> },
      { path: '/wrapped/:year', element: <YearWrapped /> },
      { path: '/artist/:id', element: <ArtistPage /> },
      { path: '/venue/:id', element: <VenuePage /> },
      {
        path: '/map',
        // Lazy: d3-geo + the world topojson stay out of the main bundle.
        lazy: () => import('@/features/map/pages/WorldMap').then((m) => ({ Component: m.WorldMap })),
      },
      { path: '/log', element: <LogShow /> },
      { path: '/show/:id', element: <ConcertDetail /> },
      { path: '/show/:id/edit', element: <EditConcert /> },
      { path: '/show/:id/setlist', element: <SetlistEditor /> },
      { path: '/friends', element: <FindFriends /> },
      { path: '/u/:username', element: <PublicProfile /> },
      { path: '/on-this-day', element: <OnThisDay /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
