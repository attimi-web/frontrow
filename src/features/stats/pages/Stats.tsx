import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { BarChart, type BarDatum } from '../components/BarChart'
import { HBars } from '../components/HBars'
import {
  summaryStats,
  showsPerYear,
  topArtists,
  countriesVisited,
  spendingPerYear,
  totalSpent,
  formatCompactMoney,
  formatMoney,
} from '../stats'

const SECTION =
  'rounded-2xl border border-border bg-white/[0.03] p-4'
const SECTION_LABEL =
  'font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled'

export function Stats() {
  const { data: concerts, isLoading } = useConcerts()
  const list = useMemo(() => concerts ?? [], [concerts])

  const summary = useMemo(() => summaryStats(list), [list])
  const years = useMemo(() => fillYears(showsPerYear(list), 7), [list])
  const artists = useMemo(() => topArtists(list, 5), [list])
  const countries = useMemo(() => countriesVisited(list, 5), [list])
  const spendYears = useMemo(() => spendingPerYear(list), [list])
  const spent = useMemo(() => totalSpent(list), [list])

  const hasShows = summary.shows > 0

  return (
    <div className="px-6 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.5px] text-fg">
          Stats
        </h1>
        <div className="flex h-[34px] items-center gap-1.5 rounded-[10px] border border-border-strong bg-white/5 px-3.5">
          <span className="font-body text-[13px] text-fg-muted">All time</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="#6a6882" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <SummaryCard value={String(summary.shows)} label="Shows" />
        <SummaryCard value={String(summary.countries)} label="Countries" />
        <SummaryCard
          value={spent.amount > 0 ? formatCompactMoney(spent) : '—'}
          label="Spent"
        />
      </div>

      {!hasShows ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="font-body text-sm text-fg-subtle">
            {isLoading
              ? 'Loading your stats…'
              : 'Log a few shows and your stats will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Year Wrapped entry */}
          <Link
            to="/wrapped"
            className="mt-5 flex items-center gap-3.5 overflow-hidden rounded-2xl border border-orange/25 p-4"
            style={{
              background:
                'radial-gradient(ellipse at 100% 0%, rgba(232,117,42,0.22) 0%, transparent 60%), rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-orange/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3l2.09 4.26L18.82 8l-3.41 3.32.8 4.68L12 13.77 7.79 16l.8-4.68L5.18 8l4.73-.74L12 3z"
                  stroke="#e8752a"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold tracking-[-0.3px] text-fg">
                Your Year Wrapped
              </p>
              <p className="mt-0.5 font-body text-xs text-fg-subtle">
                Relive your year in live music
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none text-orange">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Shows per year */}
          <section className={`mt-5 ${SECTION}`}>
            <p className={`${SECTION_LABEL} mb-4`}>Shows per year</p>
            <BarChart data={years} />
          </section>

          {/* Top artists */}
          {artists.length > 0 && (
            <section className={`mt-3 ${SECTION}`}>
              <p className={`${SECTION_LABEL} mb-3.5`}>Top artists</p>
              <HBars
                data={artists.map((a) => ({ key: a.name, label: a.name, value: a.count }))}
              />
            </section>
          )}

          {/* Countries visited */}
          {countries.length > 0 && (
            <section className={`mt-3 ${SECTION}`}>
              <p className={`${SECTION_LABEL} mb-3.5`}>Countries visited</p>
              <div className="flex flex-col gap-2.5">
                {countries.map((c) => (
                  <div key={c.country} className="flex items-center justify-between">
                    <span className="font-body text-[13px] text-fg-muted">{c.country}</span>
                    <span className="font-display text-[13px] font-bold text-fg">{c.count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Money spent */}
          {spent.amount > 0 && (
            <section className={`mt-3 ${SECTION}`}>
              <div className="mb-3.5 flex items-center justify-between">
                <p className={SECTION_LABEL}>Money spent</p>
                <p className="font-display text-sm font-extrabold text-orange">
                  {formatMoney(spent)} total
                </p>
              </div>
              <MoneyAreaChart data={spendYears} />
            </section>
          )}

          <Link
            to="/stats/extended"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-white/[0.03] p-3.5 font-body text-[13px] font-medium text-orange transition hover:bg-white/[0.05]"
          >
            See all stats
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </>
      )}
    </div>
  )
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-white/[0.03] p-3 text-center">
      <p className="font-display text-[22px] font-extrabold tracking-[-0.8px] text-orange">
        {value}
      </p>
      <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.04em] text-fg-disabled">
        {label}
      </p>
    </div>
  )
}

/** Area chart for spend over time (screen 11), normalised into a 320×60 viewBox. */
function MoneyAreaChart({ data }: { data: { year: string; amount: number }[] }) {
  const W = 320
  const H = 60
  const pts = data.length
    ? data
    : [{ year: '', amount: 0 }]
  const max = Math.max(1, ...pts.map((p) => p.amount))

  const coords = pts.map((p, i) => {
    const x = pts.length === 1 ? W : (i / (pts.length - 1)) * W
    const y = H - 4 - (p.amount / max) * (H - 8)
    return { x, y }
  })

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(0)},${c.y.toFixed(0)}`).join(' ')
  const area = `${line} L${W},${H} L${coords[0].x.toFixed(0)},${H} Z`
  const last = coords[coords.length - 1]
  const firstYear = pts[0]?.year
  const lastYear = pts[pts.length - 1]?.year

  return (
    <div>
      <svg width="100%" height="60" viewBox="0 0 320 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g_money" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8752a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e8752a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#g_money)" />
        <path
          d={line}
          stroke="#e8752a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="3" fill="#e8752a" />
      </svg>
      {data.length > 1 && (
        <div className="mt-1 flex justify-between">
          <span className="font-body text-[9px] text-fg-disabled">{`'${firstYear?.slice(2)}`}</span>
          <span className="font-body text-[9px] font-semibold text-orange">{`'${lastYear?.slice(2)}`}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Fill year gaps so the bar chart shows consecutive years (zero-years get a
 * stub bar, like the prototype), then keep the most recent `count` years.
 */
function fillYears(data: { year: string; count: number }[], count: number): BarDatum[] {
  if (data.length === 0) return []
  const first = Number(data[0].year)
  const last = Number(data[data.length - 1].year)
  const byYear = new Map(data.map((d) => [d.year, d.count]))
  const full: BarDatum[] = []
  for (let y = first; y <= last; y++) {
    const year = String(y)
    full.push({ label: `'${year.slice(2)}`, value: byYear.get(year) ?? 0 })
  }
  return full.slice(-count)
}
