import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BackHeader } from '@/components/layout/BackHeader'
import { AvatarTile } from '@/components/ui/AvatarTile'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { useAuthStore } from '@/stores/useAuthStore'
import { BarChart } from '../components/BarChart'
import { HBars } from '../components/HBars'
import { getAttendedGenres, getBuddyLeaderboard } from '../api/stats'
import {
  availableYears,
  inYear,
  attendedOnly,
  topVenues,
  monthlySpending,
  genreBreakdown,
  formatMoney,
  type GenreSlice,
} from '../stats'

const SECTION = 'rounded-2xl border border-border bg-white/[0.03] p-4'
const SECTION_LABEL =
  'font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled'

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const GENRE_COLORS = [
  '#e8752a',
  'rgba(108,160,255,0.7)',
  'rgba(30,215,96,0.6)',
  'rgba(220,100,220,0.6)',
  'rgba(255,255,255,0.12)',
]

export function StatsExtended() {
  const userId = useAuthStore((s) => s.user?.id)
  const { data: concerts } = useConcerts()
  const attended = useMemo(() => attendedOnly(concerts ?? []), [concerts])

  const years = useMemo(() => availableYears(attended), [attended])
  const [year, setYear] = useState<string | null>(null)
  const activeYear = year ?? years[0] ?? String(new Date().getFullYear())

  const yearShows = useMemo(() => inYear(attended, activeYear), [attended, activeYear])
  const venues = useMemo(() => topVenues(yearShows, 5), [yearShows])
  const monthly = useMemo(
    () => monthlySpending(attended, activeYear),
    [attended, activeYear],
  )

  const { data: genreRows } = useQuery({
    queryKey: ['stats-genres', userId],
    queryFn: () => getAttendedGenres(userId as string),
    enabled: !!userId,
  })
  const genres = useMemo<GenreSlice[]>(() => {
    const forYear = (genreRows ?? []).filter((r) => r.date.slice(0, 4) === activeYear)
    return genreBreakdown(forYear.map((r) => r.genres), 4)
  }, [genreRows, activeYear])

  const { data: buddies } = useQuery({
    queryKey: ['stats-buddies', userId],
    queryFn: () => getBuddyLeaderboard(userId as string, 5),
    enabled: !!userId,
  })

  const hasShows = attended.length > 0

  return (
    <div className="min-h-dvh bg-app">
      <BackHeader
        title="Stats"
        right={
          years.length > 0 && (
            <div className="relative flex h-8 items-center rounded-[10px] border border-border-strong bg-white/5">
              <select
                aria-label="Year"
                value={activeYear}
                onChange={(e) => setYear(e.target.value)}
                className="h-8 appearance-none bg-transparent pl-3 pr-8 font-body text-[13px] text-fg focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-surface text-fg">
                    {y}
                  </option>
                ))}
              </select>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute right-3"
              >
                <path d="M6 9l6 6 6-6" stroke="#6a6882" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )
        }
      />

      <div className="px-6 pb-8 pt-4">
        {!hasShows ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border-strong p-8 text-center">
            <p className="font-body text-sm text-fg-subtle">
              Log a few shows to unlock detailed stats.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Top Venues */}
            {venues.length > 0 && (
              <section className={SECTION}>
                <p className={`${SECTION_LABEL} mb-3.5`}>Top venues</p>
                <HBars
                  data={venues.map((v) => ({ key: v.name, label: v.name, value: v.count }))}
                  labelWidth={115}
                  valueWidth={18}
                />
              </section>
            )}

            {/* Genre Breakdown */}
            <section className={SECTION}>
              <p className={`${SECTION_LABEL} mb-3.5`}>Genre breakdown</p>
              {genres.length > 0 ? (
                <>
                  <div className="mb-3.5 flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]">
                    {genres.map((g, i) => (
                      <div
                        key={g.genre}
                        style={{
                          width: `${g.pct}%`,
                          background: GENRE_COLORS[i] ?? GENRE_COLORS[GENRE_COLORS.length - 1],
                        }}
                        className="first:rounded-l-[5px] last:rounded-r-[5px]"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {genres.map((g, i) => (
                      <div key={g.genre} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 flex-none rounded-[3px]"
                          style={{
                            background: GENRE_COLORS[i] ?? GENRE_COLORS[GENRE_COLORS.length - 1],
                          }}
                        />
                        <span className="flex-1 truncate font-body text-xs text-fg-subtle">
                          {g.genre}
                        </span>
                        <span
                          className={`font-display text-xs font-bold ${
                            i === 0 ? 'text-orange' : 'text-fg-muted'
                          }`}
                        >
                          {g.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="font-body text-xs text-fg-faint">
                  Add genres to your artists to see this breakdown.
                </p>
              )}
            </section>

            {/* Monthly Spend */}
            {monthly.total.amount > 0 && (
              <section className={SECTION}>
                <div className="mb-3.5 flex items-center justify-between">
                  <p className={SECTION_LABEL}>Monthly spend</p>
                  <p className="font-display text-[13px] font-extrabold text-orange">
                    {formatMoney(monthly.total)} in {activeYear}
                  </p>
                </div>
                <BarChart
                  height={56}
                  data={monthly.months.map((v, i) => ({
                    label: MONTH_INITIALS[i],
                    value: v,
                  }))}
                />
              </section>
            )}

            {/* Concert Buddies */}
            {buddies && buddies.length > 0 && (
              <section className={SECTION}>
                <p className={`${SECTION_LABEL} mb-3.5`}>Concert buddies</p>
                <div className="flex flex-col gap-2.5">
                  {buddies.map((b, i) => {
                    const max = buddies[0].count
                    const label = b.user.display_name || `@${b.user.username}`
                    const avatarName = b.user.display_name || b.user.username
                    return (
                      <div key={b.user.id} className="flex items-center gap-2.5">
                        <span
                          className={`w-[18px] flex-none font-display text-[13px] font-extrabold ${
                            i === 0 ? 'text-orange' : 'text-fg-faint'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <AvatarTile name={avatarName} size={34} radius={9} />
                        <span className="min-w-0 flex-1 truncate font-body text-[13px] text-fg-muted">
                          {label}
                        </span>
                        <div className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-white/[0.06]">
                          <div
                            className="h-full rounded-[3px]"
                            style={{
                              width: `${Math.max(6, Math.round((b.count / max) * 100))}%`,
                              background:
                                i === 0 ? 'var(--color-orange)' : 'rgba(232,117,42,0.45)',
                            }}
                          />
                        </div>
                        <span
                          className={`w-7 flex-none text-right font-display text-[13px] font-bold ${
                            i === 0 ? 'text-orange' : 'text-fg-muted'
                          }`}
                        >
                          {b.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
