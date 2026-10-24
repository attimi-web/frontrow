import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { attendedOnly, availableYears, inYear } from '@/features/stats/stats'
import { WorldMapCanvas } from '../components/WorldMapCanvas'
import { cityCount, cityPoints, countryCounts, flagEmoji, formatKm, kmTravelled } from '../geo'

export function WorldMap() {
  const navigate = useNavigate()
  const { data: concerts, isLoading } = useConcerts()
  const attended = useMemo(() => attendedOnly(concerts ?? []), [concerts])
  const years = useMemo(() => availableYears(attended), [attended])
  const [year, setYear] = useState<string | null>(null)

  const shows = useMemo(() => inYear(attended, year), [attended, year])
  const points = useMemo(() => cityPoints(shows), [shows])
  const countries = useMemo(() => countryCounts(shows), [shows])
  const cities = useMemo(() => cityCount(shows), [shows])
  const km = useMemo(() => kmTravelled(shows), [shows])

  const [picked, setPicked] = useState<string | null>(null)
  const selectedKey = points.some((p) => p.key === picked) ? picked : (points[0]?.key ?? null)
  const maxCountry = countries[0]?.count ?? 1

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-3.5">
        <div className="-ml-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition hover:bg-white/[0.05]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.5px] text-fg">World Map</h2>
        </div>
        <div className="flex h-8 items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3">
          <span className="font-body text-[13px] text-fg">{year ?? 'All time'}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="#6a6882" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Year chips */}
      {years.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-6 pt-3 [scrollbar-width:none]">
          {[null, ...years].map((y) => {
            const active = y === year
            return (
              <button
                key={y ?? 'all'}
                type="button"
                onClick={() => setYear(y)}
                className={cn(
                  'flex h-7 flex-none items-center rounded-lg px-3 font-body text-xs transition',
                  active
                    ? 'bg-orange font-semibold text-white'
                    : 'border border-white/[0.08] bg-white/5 text-fg-disabled hover:text-fg-subtle',
                )}
              >
                {y ?? 'All'}
              </button>
            )
          })}
        </div>
      )}

      {/* Map */}
      <div className="relative mt-3 overflow-hidden">
        <WorldMapCanvas
          points={points}
          selectedKey={selectedKey}
          onSelect={setPicked}
          animationKey={year ?? 'all'}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-app" />
      </div>

      {/* Stats strip */}
      <div className="relative z-[2] -mt-5 flex px-6">
        <StripCell value={String(countries.length)} label="countries" className="rounded-l-[14px] border-r-0" />
        <StripCell value={String(cities)} label="cities" className="border-x-0" />
        <StripCell value={formatKm(km)} label="km total" className="rounded-r-[14px]" />
      </div>

      {/* Top countries */}
      <div className="px-6 pb-6 pt-4">
        <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled">
          Top Countries
        </p>
        {!isLoading && countries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
            <p className="font-body text-sm text-fg-subtle">
              Log a show to start pinning the map.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {countries.map((c, i) => (
              <div
                key={c.code}
                className="flex h-10 items-center gap-3 rounded-xl border border-border bg-white/[0.03] px-3.5"
              >
                <span className="font-body text-lg leading-none">{flagEmoji(c.code)}</span>
                <span className="flex-1 truncate font-body text-[13px] text-fg-muted">{c.name}</span>
                <div className="h-1 w-20 flex-none overflow-hidden rounded-sm bg-white/[0.06]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.max(4, (c.count / maxCountry) * 100)}%`,
                      background: i === 0 ? '#e8752a' : `rgba(232,117,42,${Math.max(0.3, 0.6 - (i - 1) * 0.1)})`,
                    }}
                  />
                </div>
                <span
                  className={cn(
                    'w-6 flex-none text-right font-display text-[13px] font-bold',
                    i === 0 ? 'text-orange' : 'text-fg-muted',
                  )}
                >
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StripCell({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn('flex-1 border border-border bg-white/[0.03] px-3 py-3.5 text-center', className)}>
      <p className="font-display text-[22px] font-extrabold tracking-[-0.5px] text-orange">{value}</p>
      <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.04em] text-fg-disabled">{label}</p>
    </div>
  )
}
