import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AvatarTile } from '@/components/ui/AvatarTile'
import { useProfile } from '@/features/auth/hooks/useProfile'
import { signOut } from '@/features/auth/api/auth'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { ConcertCard } from '@/features/concerts/components/ConcertCard'
import { getConcertStats, groupConcertsByYear } from '@/features/concerts/utils'
import { useDerivedFriends } from '@/features/social/hooks'
import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { toast } from '@/stores/useUIStore'
import { cn } from '@/lib/utils/cn'

const TABS = ['Shows', 'Stats', 'Friends'] as const
type Tab = (typeof TABS)[number]

export function Profile() {
  const { data: profile } = useProfile()
  const { data: concerts } = useConcerts()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('Shows')

  const stats = useMemo(() => getConcertStats(concerts ?? []), [concerts])
  const groups = useMemo(
    () => groupConcertsByYear((concerts ?? []).filter((c) => c.status === 'attended')),
    [concerts],
  )
  const sinceYears = profile
    ? Math.max(0, new Date().getFullYear() - new Date(profile.joined_at).getFullYear())
    : 0

  const name = profile?.display_name || profile?.username || ''

  async function handleSignOut() {
    await signOut()
    queryClient.clear()
  }

  return (
    <div>
      {/* Cover */}
      <div
        className="relative h-[130px] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0c04, #0d1a2e, #08080d)' }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(30deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-6 h-28 w-28 rounded-full bg-orange opacity-[0.12]"
          style={{ filter: 'blur(60px)' }}
        />
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/40 backdrop-blur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="#f0eeeb"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="px-6">
        <div className="-mt-7">
          <AvatarTile name={name || 'FR'} size={64} radius={18} brand className="border-[3px] border-app" />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <h1 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-fg">
              {name}
            </h1>
            <p className="mt-1 font-body text-sm text-fg-faint">@{profile?.username}</p>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Profile editing arrives soon')}
            className="flex h-9 items-center rounded-[10px] border border-white/10 bg-white/[0.05] px-4 font-body text-[13px] font-medium text-fg-muted"
          >
            Edit Profile
          </button>
        </div>

        {profile?.bio && (
          <p className="mt-3 font-body text-sm leading-[1.5] text-fg-subtle">{profile.bio}</p>
        )}

        {/* Stats card */}
        <div className="mt-4 flex overflow-hidden rounded-2xl border border-border bg-white/[0.03]">
          <ProfileStat value={stats.shows} label="Shows" />
          <ProfileStat value={stats.artists} label="Artists" />
          <ProfileStat value={stats.countries} label="Countries" />
          <ProfileStat value={`${sinceYears}yr`} label="Since" last />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-border px-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 border-b-2 pb-2.5 text-center font-body text-sm transition',
              tab === t
                ? 'border-orange font-semibold text-orange'
                : 'border-transparent text-[#3a3a50]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-6 py-5">
        {tab === 'Shows' &&
          (groups.length > 0 ? (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.year}>
                  <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled">
                    {group.year}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {group.items.map((c) => (
                      <ConcertCard key={c.id} concert={c} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center font-body text-sm text-fg-subtle">No shows yet.</p>
          ))}
        {tab === 'Stats' && <StatsTab />}
        {tab === 'Friends' && <FriendsTab />}
      </div>
    </div>
  )
}

function ProfileStat({
  value,
  label,
  last,
}: {
  value: number | string
  label: string
  last?: boolean
}) {
  return (
    <div className={cn('flex-1 px-3 py-3.5 text-center', !last && 'border-r border-border')}>
      <p className="font-display text-xl font-extrabold tracking-[-0.5px] text-orange">{value}</p>
      <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.04em] text-fg-disabled">
        {label}
      </p>
    </div>
  )
}

function FriendsTab() {
  const { friends, incoming } = useDerivedFriends()
  return (
    <div>
      <Link
        to="/friends"
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange font-display text-sm font-bold text-white"
      >
        + Find friends
        {incoming.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-xs">
            {incoming.length}
          </span>
        )}
      </Link>

      {friends.length === 0 ? (
        <p className="py-8 text-center font-body text-sm text-fg-subtle">
          No friends yet — find people you’ve seen shows with.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {friends.map(({ user }) => (
            <Link
              key={user.id}
              to={`/u/${user.username}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white/[0.03] p-3"
            >
              <AvatarTile name={user.display_name || user.username} size={40} radius={11} />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-fg">
                  {user.display_name || user.username}
                </p>
                <p className="truncate font-body text-xs text-fg-faint">@{user.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatsTab() {
  const { unlockedCount, total } = useAchievements()
  const links = [
    { to: '/achievements', title: 'Achievements', sub: total ? `${unlockedCount} / ${total} badges` : 'Badges' },
    { to: '/map', title: 'World Map', sub: 'Every city you saw a show in' },
    { to: '/stats', title: 'Stats', sub: 'Charts, top artists, money spent' },
    { to: '/wrapped', title: 'Year Wrapped', sub: 'Your year in live music' },
  ]
  return (
    <div className="flex flex-col gap-2">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="flex items-center gap-3 rounded-2xl border border-border bg-white/[0.03] px-4 py-3.5 transition hover:bg-white/[0.05]"
        >
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-fg">{l.title}</p>
            <p className="mt-0.5 font-body text-xs text-fg-faint">{l.sub}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-fg-faint">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ))}
    </div>
  )
}
