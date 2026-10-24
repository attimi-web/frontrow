import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { AvatarTile, gradientFor } from '@/components/ui/AvatarTile'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/stores/useUIStore'
import { useSetTourTotal, useTour, useTourShows } from '../hooks/useTour'
import type { Tour, TourShow } from '../api/tours'

/** Segment dots are one per show; past this they'd be thinner than a hairline. */
const MAX_SEGMENTS = 40

export function TourTracker() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tour, isLoading, error } = useTour(id)
  const { data: shows } = useTourShows(id)

  const seen = (shows ?? []).filter((s) => s.status === 'attended')
  const upcoming = (shows ?? []).filter((s) => s.status === 'planned')

  return (
    <div className="min-h-dvh bg-app">
      {/* Back + title */}
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-3.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-white/[0.06] transition hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="#f0eeeb" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="flex-1 text-center font-display text-lg font-extrabold tracking-[-0.3px] text-fg">
          Tour Tracker
        </h2>
        <div className="w-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-orange">
          <Spinner size={24} />
        </div>
      ) : error || !tour ? (
        <p className="px-6 py-16 text-center font-body text-sm text-fg-subtle">Tour not found.</p>
      ) : (
        <>
          <TourCard tour={tour} seen={seen.length} shows={shows ?? []} />

          <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
            <p className="mb-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled">
              Tour Dates
            </p>
            {seen.map((s) => (
              <DateRow key={s.id} show={s} state="seen" />
            ))}
            {upcoming.map((s) => (
              <DateRow key={s.id} show={s} state="upcoming" />
            ))}
            <NotSeenRow tour={tour} logged={seen.length + upcoming.length} />
          </div>
        </>
      )}
    </div>
  )
}

function yearRange(tour: Tour, shows: TourShow[]): string | null {
  const years = [tour.start_date, tour.end_date, ...shows.map((s) => s.date)]
    .filter((d): d is string => !!d)
    .map((d) => d.slice(0, 4))
    .sort()
  if (years.length === 0) return null
  const first = years[0]
  const last = years[years.length - 1]
  return first === last ? first : `${first}–${last}`
}

function TourCard({ tour, seen, shows }: { tour: Tour; seen: number; shows: TourShow[] }) {
  const total = tour.total_shows
  const [editing, setEditing] = useState(false)
  const years = yearRange(tour, shows)
  const pct = total ? Math.min(100, Math.round((seen / total) * 100)) : 0
  const left = total ? Math.max(0, total - seen) : 0

  return (
    <div
      className="relative mx-6 mt-3.5 overflow-hidden rounded-[20px] border border-white/10 p-5"
      style={{ background: gradientFor(tour.artist.name) }}
    >
      <div className="pointer-events-none absolute -bottom-[30px] -right-[30px] h-[140px] w-[140px] rounded-full bg-[rgba(124,58,237,0.15)] blur-[40px]" />

      <div className="relative mb-4 flex items-center gap-3.5">
        <AvatarTile name={tour.artist.name} size={56} radius={14} className="border-[1.5px] border-white/10" />
        <div className="min-w-0">
          <Link
            to={`/artist/${tour.artist.id}`}
            className="block truncate font-display text-lg font-extrabold tracking-[-0.4px] text-fg transition hover:text-orange"
          >
            {tour.artist.name}
          </Link>
          <p className="mt-[3px] font-body text-[13px] text-fg-subtle">
            {tour.name}
            {years && ` · ${years}`}
          </p>
        </div>
      </div>

      {total && !editing ? (
        <>
          <div className="relative mb-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 font-body text-xs text-fg-subtle transition hover:text-fg-muted"
                title="Edit the number of tour dates"
              >
                Your completion
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="font-display text-lg font-extrabold tracking-[-0.5px] text-orange">
                {seen} / {total}{' '}
                <span className="text-xs font-normal text-fg-faint">shows</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-white/[0.08]">
              <div
                className="h-full rounded bg-orange shadow-[0_0_10px_rgba(232,117,42,0.4)] transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            {total <= MAX_SEGMENTS && (
              <div className="mt-2 flex gap-1">
                {Array.from({ length: total }, (_, i) => (
                  <div
                    key={i}
                    className={cn('h-[3px] flex-1 rounded-sm', i < seen ? 'bg-orange' : 'bg-white/[0.12]')}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Chip tone="green">{pct}% complete</Chip>
            <Chip>{left === 0 ? 'Tour complete' : `${left} left to see`}</Chip>
          </div>
        </>
      ) : (
        <TotalEditor
          tourId={tour.id}
          seen={seen}
          initial={total}
          onDone={() => setEditing(false)}
          onCancel={total ? () => setEditing(false) : undefined}
        />
      )}
    </div>
  )
}

function TotalEditor({
  tourId,
  seen,
  initial,
  onDone,
  onCancel,
}: {
  tourId: string
  seen: number
  initial: number | null
  onDone: () => void
  onCancel?: () => void
}) {
  const [value, setValue] = useState(initial ? String(initial) : '')
  const save = useSetTourTotal(tourId)
  const n = Number(value)
  const valid = Number.isInteger(n) && n >= 1 && n <= 1000

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    save.mutate(n, {
      onSuccess: () => {
        toast.success('Tour length saved')
        onDone()
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save'),
    })
  }

  return (
    <form onSubmit={submit} className="relative">
      <p className="mb-1 font-body text-xs text-fg-subtle">
        You've seen <strong className="font-semibold text-fg">{seen}</strong>{' '}
        {seen === 1 ? 'show' : 'shows'} on this tour.
      </p>
      <p className="mb-2.5 font-body text-xs text-fg-faint">How many dates does the tour have?</p>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 24"
          aria-label="Total tour dates"
          className="h-10 w-full min-w-0 flex-1 rounded-[10px] border border-white/10 bg-black/25 px-3 font-body text-sm text-fg placeholder:text-fg-disabled focus:border-orange/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!valid || save.isPending}
          className="h-10 flex-none rounded-[10px] bg-orange px-4 font-body text-[13px] font-semibold text-white transition disabled:bg-orange-mid disabled:text-white/40"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 flex-none rounded-[10px] px-2 font-body text-[13px] text-fg-subtle"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function Chip({ tone, children }: { tone?: 'green'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'flex h-5 items-center rounded-md px-2 font-body text-[9px] font-semibold uppercase tracking-[0.05em]',
        tone === 'green'
          ? 'border border-success/20 bg-success/[0.12] text-success'
          : 'bg-white/5 text-fg-faint',
      )}
    >
      {children}
    </span>
  )
}

function DateRow({ show, state }: { show: TourShow; state: 'seen' | 'upcoming' }) {
  const title = show.venue
    ? [show.venue.name, show.venue.city].filter(Boolean).join(' · ')
    : 'Unknown venue'
  const seen = state === 'seen'
  return (
    <Link
      to={`/show/${show.id}`}
      className={cn(
        'flex h-14 items-center gap-3 rounded-[14px] border px-3.5 transition',
        seen
          ? 'border-border bg-white/[0.03] hover:bg-white/[0.05]'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]',
      )}
    >
      {seen ? (
        <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] border-[1.5px] border-orange bg-orange/[0.14]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="#e8752a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
      ) : (
        <span className="h-[26px] w-[26px] flex-none rounded-[7px] border-[1.5px] border-dashed border-orange/50" />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-body text-[13px] font-medium', seen ? 'text-fg' : 'text-fg-muted')}>
          {title}
        </p>
        <p className="mt-px font-body text-[11px] text-fg-disabled">
          {format(parseISO(show.date), 'MMM d, yyyy')}
        </p>
      </div>
      {!seen && (
        <span className="flex h-5 flex-none items-center rounded-md border border-orange/25 bg-orange/[0.12] px-2 font-body text-[9px] font-semibold uppercase tracking-[0.04em] text-orange">
          Upcoming
        </span>
      )}
    </Link>
  )
}

/** We don't know the other dates of the tour, only how many there are.
 *  "Missed" only once the tour is known to be over. */
function NotSeenRow({ tour, logged }: { tour: Tour; logged: number }) {
  const rest = tour.total_shows ? tour.total_shows - logged : 0
  if (rest <= 0) return null
  const over = !!tour.end_date && tour.end_date < new Date().toISOString().slice(0, 10)
  return (
    <div className="flex h-14 items-center gap-3 rounded-[14px] border border-white/5 bg-white/[0.02] px-3.5 opacity-60">
      <span className="h-[26px] w-[26px] flex-none rounded-[7px] border-[1.5px] border-white/15" />
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13px] text-fg-faint">
          {rest} other {rest === 1 ? 'date' : 'dates'}
        </p>
        <p className="mt-px font-body text-[11px] text-[#3a3a50]">Not in your log</p>
      </div>
      <span className="flex h-5 flex-none items-center rounded-md bg-white/[0.04] px-2 font-body text-[9px] uppercase tracking-[0.04em] text-[#3a3a50]">
        {over ? 'Missed' : 'Not seen'}
      </span>
    </div>
  )
}
