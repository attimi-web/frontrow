import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Spinner } from '@/components/ui/Spinner'
import { AvatarTile, gradientFor } from '@/components/ui/AvatarTile'
import { cn } from '@/lib/utils/cn'
import { totalSpent, formatCompactMoney } from '@/features/stats/stats'
import type { ConcertListItem } from '@/features/concerts/api/concerts'
import type { Venue } from '@/types/domain'
import { useVenue, useVenueShows } from '../hooks/useVenue'
import { venueShowTitle, type VenueShow } from '../api/venues'

const TABS = ['My Shows', 'Upcoming', 'Info'] as const
type Tab = (typeof TABS)[number]

export function VenuePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: venue, isLoading: venueLoading } = useVenue(id)
  const { data: shows, isLoading: showsLoading } = useVenueShows(id)
  const [tab, setTab] = useState<Tab>('My Shows')

  const list = useMemo(() => shows ?? [], [shows])
  const attended = useMemo(() => list.filter((s) => s.status === 'attended'), [list])
  const upcoming = useMemo(() => list.filter((s) => s.status !== 'attended'), [list])

  const stats = useMemo(() => {
    const artists = new Set<string>()
    for (const s of attended) artists.add(venueShowTitle(s).toLowerCase())
    const spent = totalSpent(list as unknown as ConcertListItem[])
    return { visits: attended.length, artists: artists.size, spent }
  }, [attended, list])

  const firstVisit = useMemo(() => {
    // `attended` is date-desc; the earliest is the last entry.
    return attended.length > 0 ? attended[attended.length - 1] : null
  }, [attended])

  if (venueLoading || !venue) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-[440px]">
        <div className="flex justify-center py-20 text-orange">
          <Spinner size={28} />
        </div>
      </div>
    )
  }

  const place = [venue.city, venue.country_name || venue.country].filter(Boolean).join(', ')
  const meta = [place, venue.capacity ? `Cap. ${venue.capacity.toLocaleString()}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[440px] pb-10">
      {/* Hero */}
      <div
        className="relative h-[180px] w-full overflow-hidden"
        style={{ background: gradientFor(venue.name) }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(20deg, rgba(255,255,255,0.04) 0 5px, transparent 5px 10px)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #08080d)' }}
        />
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/50 backdrop-blur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="#f0eeeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="absolute inset-x-6 bottom-3.5">
          <div className="mb-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#e8752a" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="#e8752a" strokeWidth="1.8" />
            </svg>
            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.05em] text-orange">
              Venue
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.5px] text-fg">
            {venue.name}
          </h1>
          {meta && <p className="mt-0.5 font-body text-[13px] text-fg-faint">{meta}</p>}
        </div>
      </div>

      {/* Your stats */}
      <div className="mx-6 flex overflow-hidden rounded-2xl border border-border bg-white/[0.03]">
        <StatCell value={String(stats.visits)} label="Your visits" />
        <StatCell value={String(stats.artists)} label="Artists" />
        <StatCell
          value={stats.spent.amount > 0 ? formatCompactMoney(stats.spent) : '—'}
          label="Spent here"
          last
        />
      </div>

      {/* First visit callout */}
      {firstVisit && (
        <div className="mx-6 mt-2.5 flex items-center gap-2.5 rounded-xl border border-orange/[0.14] bg-orange/[0.06] px-3.5 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="#e8752a"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="font-body text-xs text-orange">
            First visited <strong>{format(parseISO(firstVisit.date), 'MMM yyyy')}</strong> ·{' '}
            {venueShowTitle(firstVisit)}
            {firstVisit.tour_name ? `, ${firstVisit.tour_name}` : ''}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-3.5 flex border-b border-border px-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 border-b-2 pb-2.5 text-center font-body text-[13px] transition',
              tab === t
                ? 'border-orange font-semibold text-orange'
                : 'border-transparent text-[#3a3a50]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-6 py-4">
        {showsLoading ? (
          <div className="flex justify-center py-12 text-orange">
            <Spinner size={24} />
          </div>
        ) : tab === 'My Shows' ? (
          attended.length > 0 ? (
            <ShowList shows={attended} />
          ) : (
            <Empty text="No shows logged at this venue yet." />
          )
        ) : tab === 'Upcoming' ? (
          upcoming.length > 0 ? (
            <ShowList shows={upcoming} />
          ) : (
            <Empty text="Nothing planned here yet." />
          )
        ) : (
          <VenueInfo venue={venue} />
        )}
      </div>
    </div>
  )
}

function StatCell({ value, label, last }: { value: string; label: string; last?: boolean }) {
  return (
    <div className={cn('flex-1 px-2.5 py-3.5 text-center', !last && 'border-r border-border')}>
      <p className="font-display text-[22px] font-extrabold tracking-[-0.5px] text-orange">
        {value}
      </p>
      <p className="mt-0.5 font-body text-[9px] uppercase tracking-[0.04em] text-fg-disabled">
        {label}
      </p>
    </div>
  )
}

function ShowList({ shows }: { shows: VenueShow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {shows.map((s) => {
        const title = venueShowTitle(s)
        const subtitle = [format(parseISO(s.date), 'MMM d, yyyy'), s.tour_name]
          .filter(Boolean)
          .join(' · ')
        return (
          <Link
            key={s.id}
            to={`/show/${s.id}`}
            className="flex items-center gap-3 rounded-[14px] border border-border bg-white/[0.03] px-3.5 py-2.5 transition hover:bg-white/[0.05]"
          >
            <AvatarTile name={title} size={42} radius={11} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold tracking-[-0.2px] text-fg">
                {title}
              </p>
              <p className="mt-0.5 truncate font-body text-[11px] text-fg-faint">{subtitle}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none">
              <path d="M9 18l6-6-6-6" stroke="#3a3a50" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
        )
      })}
    </div>
  )
}

function VenueInfo({ venue }: { venue: Venue }) {
  const hasCoords = venue.lat != null && venue.lng != null
  const rows: { label: string; value: string }[] = []
  if (venue.type) rows.push({ label: 'Type', value: venue.type.replace(/_/g, ' ') })
  if (venue.capacity) rows.push({ label: 'Capacity', value: venue.capacity.toLocaleString() })
  rows.push({
    label: 'Location',
    value: [venue.city, venue.country_name || venue.country].filter(Boolean).join(', '),
  })

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-border"
        style={{ background: 'linear-gradient(135deg, #0d1a0d, #1a1a0d, #1a0d0d)' }}
      >
        <div className="flex flex-col items-center gap-1.5 text-orange">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <span className="font-body text-[11px] text-fg-faint">
            {hasCoords ? `${venue.lat?.toFixed(4)}, ${venue.lng?.toFixed(4)}` : 'No location set'}
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="font-body text-[13px] text-fg-faint">{r.label}</span>
              <span className="font-body text-[13px] capitalize text-fg-muted">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
      <p className="font-body text-sm text-fg-subtle">{text}</p>
    </div>
  )
}
