import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Spinner } from '@/components/ui/Spinner'
import { AvatarTile, gradientFor } from '@/components/ui/AvatarTile'
import { cn } from '@/lib/utils/cn'
import { useArtist, useArtistShows, useArtistSetlists } from '../hooks/useArtist'
import { groupShowsByTour, type ArtistShow } from '../api/artists'

const TABS = ['Shows', 'Setlists', 'Tours'] as const
type Tab = (typeof TABS)[number]

export function ArtistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: artist, isLoading: artistLoading } = useArtist(id)
  const { data: shows, isLoading: showsLoading } = useArtistShows(id)
  const [tab, setTab] = useState<Tab>('Shows')

  const list = useMemo(() => shows ?? [], [shows])
  const showIds = useMemo(() => list.map((s) => s.id), [list])
  const { data: setlistIds } = useArtistSetlists(showIds)
  const groups = useMemo(() => groupShowsByTour(list), [list])

  const stats = useMemo(() => {
    const venues = new Set<string>()
    const countries = new Set<string>()
    let earliest: string | null = null
    for (const s of list) {
      if (s.venue) venues.add(`${s.venue.name}|${s.venue.city}`.toLowerCase())
      if (s.venue?.country_name) countries.add(s.venue.country_name)
      if (!earliest || s.date < earliest) earliest = s.date
    }
    const since = earliest
      ? Math.max(0, new Date().getFullYear() - Number(earliest.slice(0, 4)))
      : 0
    return { shows: list.length, venues: venues.size, countries: countries.size, since }
  }, [list])

  if (artistLoading || !artist) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-[440px]">
        <div className="flex justify-center py-20 text-orange">
          <Spinner size={28} />
        </div>
      </div>
    )
  }

  const meta = [
    artist.genres?.[0],
    [artist.origin_city, artist.origin_country].filter(Boolean).join(', ') || null,
    artist.formed_year ? `Since ${artist.formed_year}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const tours = groups.filter((g) => g.tour)

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[440px] pb-10">
      {/* Hero */}
      <div className="relative h-[220px] w-full overflow-hidden" style={{ background: gradientFor(artist.name) }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(30deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[120px]"
          style={{ background: 'linear-gradient(to bottom, transparent, #08080d)' }}
        />
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/45 backdrop-blur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="#f0eeeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="absolute inset-x-6 bottom-[18px] flex items-center gap-3">
          <AvatarTile name={artist.name} size={72} radius={18} className="border-2 border-white/10" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-[-0.5px] text-fg">
              {artist.name}
            </h1>
            {meta && <p className="mt-0.5 font-body text-[13px] text-fg-faint">{meta}</p>}
          </div>
        </div>
      </div>

      {/* Your stats */}
      <div className="mx-6 flex overflow-hidden rounded-[14px] border border-border bg-white/[0.03]">
        <StatCell value={String(stats.shows)} label="shows" />
        <StatCell value={String(stats.venues)} label="venues" />
        <StatCell value={String(stats.countries)} label="countries" />
        <StatCell value={stats.since > 0 ? `${stats.since}yr` : '—'} label="since" last />
      </div>

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
        ) : list.length === 0 ? (
          <Empty text="You haven't logged any shows with this artist yet." />
        ) : tab === 'Shows' ? (
          <div className="flex flex-col gap-[18px]">
            {groups.map((g, i) => (
              <TourTimeline key={g.tour ?? '__none'} group={g} leader={i === 0} />
            ))}
          </div>
        ) : tab === 'Setlists' ? (
          <SetlistsTab shows={list} setlistIds={setlistIds} />
        ) : (
          <ToursTab tours={tours} />
        )}
      </div>
    </div>
  )
}

function StatCell({
  value,
  label,
  last,
}: {
  value: string
  label: string
  last?: boolean
}) {
  return (
    <div className={cn('flex-1 p-3 text-center', !last && 'border-r border-border')}>
      <p className="font-display text-xl font-extrabold tracking-[-0.5px] text-orange">{value}</p>
      <p className="mt-0.5 font-body text-[9px] uppercase tracking-[0.04em] text-fg-disabled">
        {label}
      </p>
    </div>
  )
}

function ShowTitle(s: ArtistShow): string {
  if (s.type === 'festival' && s.festival_name) return s.festival_name
  return s.venue?.name ?? 'Show'
}

function ShowSubtitle(s: ArtistShow): string {
  const place = s.venue
    ? [s.venue.city, s.venue.country_name].filter(Boolean).join(', ')
    : ''
  const date = format(parseISO(s.date), 'MMM d')
  return [place, date].filter(Boolean).join(' · ')
}

function ShowCard({ show }: { show: ArtistShow }) {
  return (
    <Link
      to={`/show/${show.id}`}
      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-white/[0.03] px-3.5 py-2.5 transition hover:bg-white/[0.05]"
    >
      <div className="min-w-0">
        <p className="truncate font-body text-[13px] font-medium text-fg-muted">
          {ShowTitle(show)}
        </p>
        <p className="mt-0.5 font-body text-[11px] text-fg-disabled">{ShowSubtitle(show)}</p>
      </div>
      {show.status === 'attended' ? (
        <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border border-orange bg-orange/[0.15]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="#e8752a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
      ) : (
        <span className="h-[22px] w-[22px] flex-none rounded-md border border-border-strong" />
      )}
    </Link>
  )
}

function TourTimeline({ group, leader }: { group: ReturnType<typeof groupShowsByTour>[number]; leader: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className="h-4 w-[3px] flex-none rounded-[2px]"
          style={{ background: leader ? 'var(--color-orange)' : '#6a6882' }}
        />
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-faint">
          {group.tour ? `${group.tour}${group.year ? ` · ${group.year}` : ''}` : 'Other shows'}
        </p>
        <span className="ml-auto font-body text-[11px] text-fg-disabled">
          {group.shows.length} {group.shows.length === 1 ? 'show' : 'shows'}
        </span>
      </div>
      <div className="ml-px flex flex-col gap-1.5 border-l border-border pl-[11px]">
        {group.shows.map((s) => (
          <div key={s.id} className="ml-2">
            <ShowCard show={s} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SetlistsTab({
  shows,
  setlistIds,
}: {
  shows: ArtistShow[]
  setlistIds: Set<string> | undefined
}) {
  const withSetlist = shows.filter((s) => setlistIds?.has(s.id))
  if (!setlistIds) {
    return (
      <div className="flex justify-center py-8 text-orange">
        <Spinner size={22} />
      </div>
    )
  }
  if (withSetlist.length === 0) {
    return <Empty text="No setlists logged for this artist yet." />
  }
  return (
    <div className="flex flex-col gap-1.5">
      {withSetlist.map((s) => (
        <ShowCard key={s.id} show={s} />
      ))}
    </div>
  )
}

function ToursTab({ tours }: { tours: ReturnType<typeof groupShowsByTour> }) {
  if (tours.length === 0) {
    return <Empty text="No tours yet — add a tour name when logging a show." />
  }
  return (
    <div className="flex flex-col gap-2">
      {tours.map((g) => {
        const row = (
          <>
            <span className="h-8 w-[3px] flex-none rounded-[2px] bg-orange/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm font-medium text-fg-muted">{g.tour}</p>
              {g.year && <p className="mt-0.5 font-body text-[11px] text-fg-disabled">{g.year}</p>}
            </div>
            <span className="font-display text-sm font-bold text-orange">
              {g.shows.length}
            </span>
          </>
        )
        const cls = 'flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] px-4 py-3'
        return g.tourId ? (
          <Link key={g.tour} to={`/tour/${g.tourId}`} className={`${cls} transition hover:bg-white/[0.05]`}>
            {row}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none text-fg-faint">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <div key={g.tour} className={cls}>
            {row}
          </div>
        )
      })}
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
