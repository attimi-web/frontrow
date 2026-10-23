import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AvatarTile } from '@/components/ui/AvatarTile'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { useAuthStore } from '@/stores/useAuthStore'
import { getBuddyLeaderboard } from '../api/stats'
import {
  attendedOnly,
  availableYears,
  inYear,
  topArtists,
  wrappedStats,
  formatCompactMoney,
} from '../stats'

/**
 * Year Wrapped (screen 09) — a Spotify-Wrapped-style recap of one year of live
 * music, revealed stat by stat. All figures come from the stats data layer;
 * the concert buddy is the all-time top buddy (buddy links carry no date).
 */
export function YearWrapped() {
  const navigate = useNavigate()
  const { year: yearParam } = useParams<{ year: string }>()
  const userId = useAuthStore((s) => s.user?.id)
  const { data: concerts, isLoading } = useConcerts()

  const attended = useMemo(() => attendedOnly(concerts ?? []), [concerts])
  const years = useMemo(() => availableYears(attended), [attended])

  // Resolve the year: the URL param if it has shows, else the current year,
  // else the most recent year with shows.
  const thisYear = String(new Date().getFullYear())
  const year =
    yearParam && years.includes(yearParam)
      ? yearParam
      : years.includes(thisYear)
        ? thisYear
        : (years[0] ?? thisYear)

  const yearShows = useMemo(() => inYear(attended, year), [attended, year])
  const summary = useMemo(() => wrappedStats(yearShows), [yearShows])
  const artists = useMemo(() => topArtists(yearShows, 3), [yearShows])

  const { data: buddies } = useQuery({
    queryKey: ['stats-buddies', userId],
    queryFn: () => getBuddyLeaderboard(userId as string, 1),
    enabled: !!userId,
  })
  const buddy = buddies?.[0]

  // Sequential reveal: flip `shown` on after mount so the CSS transitions
  // (each with an incremental delay) play from the initial hidden state.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [year])

  const hasShows = yearShows.length > 0

  function onShare() {
    const text = `My ${year} in live music: ${summary.shows} shows across ${summary.countries} countries${
      artists[0] ? `, most-seen ${artists[0].name}` : ''
    }. — FrontRow`
    if (navigator.share) {
      navigator.share({ title: `FrontRow ${year} Wrapped`, text }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#08080d]">
      {/* Warm glow from the top, like the prototype */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{
          background:
            'radial-gradient(ellipse at 50% -10%, rgba(232,117,42,0.28) 0%, transparent 55%)',
        }}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Close"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-fg-muted backdrop-blur transition hover:text-fg"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative z-10 mx-auto max-w-md px-8 pb-10">
        {!hasShows ? (
          <div className="flex min-h-dvh flex-col items-center justify-center text-center">
            <p className="font-body text-sm text-fg-subtle">
              {isLoading
                ? 'Loading your year…'
                : 'No shows logged yet — your Wrapped will appear once you do.'}
            </p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <Reveal shown={shown} delay={0}>
              <div className="border-b border-white/[0.06] pt-10 pb-6">
                <div className="mb-5 flex items-center gap-2.5">
                  <FrMark />
                  <span className="font-body text-xs tracking-[0.05em] text-fg-subtle">
                    FrontRow · {year}
                  </span>
                </div>
                <p className="font-display text-[88px] font-extrabold leading-[0.9] tracking-[-4px] text-fg">
                  {year}
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-[-0.5px] text-orange">
                  WRAPPED
                </p>
                <p className="mt-1.5 font-body text-sm text-fg-subtle">
                  your year in live music
                </p>
              </div>
            </Reveal>

            {/* Big stat */}
            <Reveal shown={shown} delay={0.15}>
              <div className="border-b border-white/[0.06] py-6">
                <p className="font-body text-[13px] uppercase tracking-[0.08em] text-fg-subtle">
                  You attended
                </p>
                <p className="mt-1 font-display text-[64px] font-extrabold leading-none tracking-[-3px] text-fg">
                  {summary.shows}
                  <span className="ml-2 font-display text-[22px] font-semibold tracking-[-0.5px] text-fg-subtle">
                    {summary.shows === 1 ? 'show' : 'shows'}
                  </span>
                </p>
                <p className="mt-2 font-body text-sm text-fg-subtle">
                  across {summary.countries}{' '}
                  {summary.countries === 1 ? 'country' : 'countries'} and {summary.cities}{' '}
                  {summary.cities === 1 ? 'city' : 'cities'}
                </p>
              </div>
            </Reveal>

            {/* Top artists */}
            {artists.length > 0 && (
              <Reveal shown={shown} delay={0.3}>
                <div className="border-b border-white/[0.06] py-5">
                  <SectionLabel>Top Artists</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {artists.map((a, i) => (
                      <TopArtistRow
                        key={a.name}
                        rank={i + 1}
                        name={a.name}
                        count={a.count}
                        max={artists[0].count}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Stats grid */}
            <Reveal shown={shown} delay={0.45}>
              <div className="grid grid-cols-2 gap-3 border-b border-white/[0.06] py-5">
                {summary.spent.amount > 0 && (
                  <GridStat
                    value={formatCompactMoney(summary.spent)}
                    label="spent on tickets"
                  />
                )}
                {summary.topCity && (
                  <GridStat
                    value={summary.topCity.city}
                    label="most visited city"
                    valueClassName="text-[22px] leading-[1.05] break-words"
                  />
                )}
                <GridStat
                  value={String(summary.cities)}
                  label={summary.cities === 1 ? 'city' : 'cities visited'}
                />
                <GridStat
                  value={String(summary.countries)}
                  label={summary.countries === 1 ? 'country' : 'countries visited'}
                />
              </div>
            </Reveal>

            {/* Concert buddy of the year */}
            {buddy && (
              <Reveal shown={shown} delay={0.6}>
                <div className="py-5">
                  <SectionLabel>Concert Buddy of the Year</SectionLabel>
                  <div className="flex items-center gap-3.5 rounded-[18px] border border-orange/[0.16] bg-orange/[0.07] px-4 py-4">
                    <AvatarTile
                      name={buddy.user.display_name || buddy.user.username}
                      size={48}
                      radius={14}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[17px] font-bold tracking-[-0.3px] text-fg">
                        {buddy.user.display_name || `@${buddy.user.username}`}
                      </p>
                      <p className="mt-0.5 font-body text-[13px] font-medium text-orange">
                        {buddy.count} {buddy.count === 1 ? 'show' : 'shows'} together
                      </p>
                    </div>
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-orange/[0.15]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                          stroke="#e8752a"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Share */}
            <Reveal shown={shown} delay={0.75}>
              <button
                type="button"
                onClick={onShare}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 font-display text-sm font-bold text-[#1a0c04] transition hover:brightness-110"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Share your {year}
              </button>
            </Reveal>

            {/* Year switcher */}
            {years.length > 1 && (
              <Reveal shown={shown} delay={0.85}>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => navigate(`/wrapped/${y}`)}
                      className={`rounded-full border px-3.5 py-1.5 font-body text-[13px] transition ${
                        y === year
                          ? 'border-orange/40 bg-orange/15 text-orange'
                          : 'border-border-strong text-fg-subtle hover:text-fg'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </Reveal>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Reveal({
  shown,
  delay,
  children,
}: {
  shown: boolean
  delay: number
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: '500ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}s`,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-disabled">
      {children}
    </p>
  )
}

function TopArtistRow({
  rank,
  name,
  count,
  max,
}: {
  rank: number
  name: string
  count: number
  max: number
}) {
  const isFirst = rank === 1
  const barW = Math.max(14, Math.round((count / max) * 40))
  return (
    <div className="flex items-center gap-3.5">
      <span
        className={`w-9 flex-none font-display font-extrabold leading-none ${
          isFirst ? 'text-[22px] text-orange' : 'text-[18px] text-fg-faint'
        }`}
      >
        #{rank}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-display font-bold tracking-[-0.3px] ${
            isFirst ? 'text-[18px] text-fg' : 'text-base text-fg-muted'
          }`}
        >
          {name}
        </p>
        <p className="mt-0.5 font-body text-xs text-fg-subtle">
          {count} {count === 1 ? 'show' : 'shows'}
          {isFirst ? ' this year' : ''}
        </p>
      </div>
      <div
        className="h-1.5 flex-none rounded-full"
        style={{
          width: `${barW}px`,
          background: isFirst ? 'var(--color-orange)' : 'rgba(255,255,255,0.15)',
          boxShadow: isFirst ? '0 2px 8px rgba(232,117,42,0.4)' : undefined,
        }}
      />
    </div>
  )
}

function GridStat({
  value,
  label,
  valueClassName,
}: {
  value: string
  label: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <p
        className={`font-display font-extrabold tracking-[-0.8px] text-fg ${
          valueClassName ?? 'truncate text-[28px]'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 font-body text-xs leading-tight text-fg-subtle">{label}</p>
    </div>
  )
}

function FrMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 80 80" className="flex-none" aria-hidden="true">
      <rect width="80" height="80" rx="18" fill="#111118" />
      <rect x="8" y="28" width="64" height="24" rx="12" fill="#e8752a" />
      <line
        x1="56"
        y1="28"
        x2="56"
        y2="52"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />
      <text
        x="28"
        y="44"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="14"
        fill="white"
      >
        FR
      </text>
    </svg>
  )
}
