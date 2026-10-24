import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { AvatarTile, gradientFor } from '@/components/ui/AvatarTile'
import { SetlistTab } from '../components/SetlistTab'
import { PhotosTab } from '../components/PhotosTab'
import { BuddiesTab } from '@/features/social/components/BuddiesTab'
import { useConcert } from '../hooks/useConcerts'
import { useDeleteConcert } from '../hooks/useConcertMutations'
import { formatConcertDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/stores/useUIStore'
import type { ConcertDetail as ConcertDetailData } from '../api/concerts'

const TABS = ['Info', 'Setlist', 'Photos', 'People'] as const
type Tab = (typeof TABS)[number]

const STATUS_LABEL: Record<string, string> = {
  attended: 'Attended',
  planned: 'Planned',
  wishlist: 'Wishlist',
}

const ROLE_LABEL: Record<string, string> = {
  support: 'Support act',
  special_guest: 'Special guest',
  opener: 'Opener',
}

export function ConcertDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useConcert(id)
  const del = useDeleteConcert()
  const [tab, setTab] = useState<Tab>('Info')

  function handleDelete() {
    if (!id) return
    if (!window.confirm('Delete this show? This cannot be undone.')) return
    del.mutate(id, {
      onSuccess: () => {
        toast.success('Show deleted')
        navigate('/home', { replace: true })
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Could not delete show'),
    })
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[440px]">
        <div className="flex justify-center py-20 text-orange">
          <Spinner size={28} />
        </div>
      </div>
    )
  }

  const title =
    data.type === 'festival' && data.festival_name
      ? data.festival_name
      : (data.headliner?.name ?? 'Untitled show')

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] pb-10">
      {/* Hero */}
      <div className="relative h-[260px] w-full" style={{ background: gradientFor(title) }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-fg-faint">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m21 15-5-5L5 21" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="mt-2 font-body text-[11px] uppercase tracking-[0.1em]">Concert photo</span>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-28"
          style={{ background: 'linear-gradient(to bottom, transparent, #0d0c16)' }}
        />
        {/* Controls */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/45 backdrop-blur"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" stroke="#f0eeeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link
            to={`/show/${id}/edit`}
            aria-label="Edit"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/45 backdrop-blur"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#f0eeeb" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f0eeeb" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Title block */}
      <div className="px-6 pt-3">
        <div className="flex items-start justify-between gap-3">
          {data.type !== 'festival' && data.headliner_id ? (
            <Link
              to={`/artist/${data.headliner_id}`}
              className="font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.6px] text-fg transition hover:text-orange"
            >
              {title}
            </Link>
          ) : (
            <h1 className="font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.6px] text-fg">
              {title}
            </h1>
          )}
          <span className="mt-1.5 flex h-[26px] shrink-0 items-center rounded-lg border border-orange/[0.28] bg-orange/[0.14] px-2.5 font-body text-[11px] font-semibold text-orange">
            {STATUS_LABEL[data.status] ?? data.status}
          </span>
        </div>
        {data.tour_name &&
          (data.tour_id ? (
            <Link
              to={`/tour/${data.tour_id}`}
              className="mt-1 inline-flex items-center gap-1 font-body text-[13px] text-fg-faint transition hover:text-orange"
            >
              {data.tour_name}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <p className="mt-1 font-body text-[13px] text-fg-faint">{data.tour_name}</p>
          ))}
        <div className="mt-2.5 flex flex-wrap gap-4">
          {data.venue &&
            (data.venue_full?.id ? (
              <Link
                to={`/venue/${data.venue_full.id}`}
                className="flex items-center gap-1.5 font-body text-[13px] text-fg-faint transition hover:text-orange"
              >
                <PinIcon />
                {[data.venue.name, data.venue.city].filter(Boolean).join(', ')}
              </Link>
            ) : (
              <Meta>
                <PinIcon />
                {[data.venue.name, data.venue.city].filter(Boolean).join(', ')}
              </Meta>
            ))}
          <Meta>
            <CalIcon />
            {formatConcertDate(data.date)}
          </Meta>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex border-b border-border px-6">
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
        {tab === 'Info' && <InfoTab data={data} />}
        {tab === 'Setlist' && (
          <SetlistTab concertId={data.id} syncedFromSetlistFm={!!data.setlist_fm_id} />
        )}
        {tab === 'Photos' && <PhotosTab data={data} />}
        {tab === 'People' && <BuddiesTab concertId={data.id} ownerId={data.user_id} />}
      </div>

      <div className="px-6">
        <Button variant="destructive" fullWidth loading={del.isPending} onClick={handleDelete}>
          Delete show
        </Button>
      </div>
    </div>
  )
}

function InfoTab({ data }: { data: ConcertDetailData }) {
  if (data.type === 'festival') return <FestivalSchedule data={data} />

  const support = [...data.lineup]
    .filter((l) => l.role !== 'headliner')
    .sort((a, b) => a.billing_order - b.billing_order)
  const hasTicket = !!data.ticket_type || data.ticket_price_paid != null

  return (
    <div className="flex flex-col gap-3.5">
      {hasTicket && (
        <Card label="Ticket">
          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 font-body text-xs text-fg-faint">Type</p>
              <p className="font-display text-[17px] font-bold tracking-[-0.3px] text-fg">
                {data.ticket_type ?? '—'}
              </p>
            </div>
            {data.ticket_price_paid != null && (
              <div className="text-right">
                <p className="mb-1 font-body text-xs text-fg-faint">Paid</p>
                <p className="font-display text-[17px] font-bold tracking-[-0.3px] text-orange">
                  {data.ticket_price_paid}
                  {data.ticket_currency ? ` ${data.ticket_currency}` : ''}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {support.length > 0 && (
        <Card label="Support">
          <div className="flex flex-col gap-3">
            {support.map((l) => (
              <Link
                key={l.artist.id}
                to={`/artist/${l.artist.id}`}
                className="flex items-center gap-2.5 rounded-lg transition hover:bg-white/[0.04]"
              >
                <AvatarTile name={l.artist.name} size={36} radius={9} />
                <div>
                  <p className="font-body text-sm font-medium text-[#c8c6d8]">{l.artist.name}</p>
                  <p className="mt-0.5 font-body text-[11px] uppercase tracking-[0.05em] text-fg-disabled">
                    {ROLE_LABEL[l.role] ?? l.role}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {data.personal_note && (
        <Card label="Notes">
          <p className="whitespace-pre-wrap font-body text-sm italic leading-[1.6] text-fg-subtle">
            {data.personal_note}
          </p>
        </Card>
      )}

      {!hasTicket && support.length === 0 && !data.personal_note && (
        <Placeholder text="No extra details yet. Tap edit to add ticket info, support acts, or notes." />
      )}
    </div>
  )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.03] p-4">
      <p className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3a3a50]">
        {label}
      </p>
      {children}
    </div>
  )
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 font-body text-[13px] text-fg-faint">{children}</div>
  )
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#45445a" strokeWidth="2.2" />
      <circle cx="12" cy="10" r="3" stroke="#45445a" strokeWidth="2.2" />
    </svg>
  )
}

function CalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#45445a" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="#45445a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Placeholder({ text }: { text: string }) {
  return <p className="py-8 text-center font-body text-sm text-fg-subtle">{text}</p>
}

function FestivalSchedule({ data }: { data: ConcertDetailData }) {
  const days = [...data.festival_days].sort((a, b) => a.day_order - b.day_order)
  if (days.length === 0) {
    return <p className="py-4 font-body text-sm text-fg-subtle">No lineup added yet.</p>
  }
  return (
    <div className="space-y-6">
      {days.map((day, i) => (
        <section key={day.id}>
          <h2 className="mb-2 font-display text-base font-bold text-fg">
            Day {i + 1} · {formatConcertDate(day.date)}
          </h2>
          <div className="space-y-3">
            {[...day.stages]
              .sort((a, b) => a.stage_order - b.stage_order)
              .map((stage) => (
                <div key={stage.id} className="rounded-xl border border-border bg-white/[0.02] p-3">
                  <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-orange">
                    {stage.stage_name}
                  </p>
                  <ul className="space-y-1.5">
                    {[...stage.performances]
                      .sort((a, b) => a.perf_order - b.perf_order)
                      .map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2">
                          <Link
                            to={`/artist/${p.artist.id}`}
                            className={cn(
                              'font-body text-sm transition hover:text-orange',
                              p.attended ? 'text-fg' : 'text-fg-faint line-through',
                            )}
                          >
                            {p.artist.name}
                          </Link>
                          <span className="shrink-0 font-body text-xs text-fg-subtle">
                            {p.start_time ? p.start_time.slice(0, 5) : ''}
                            {p.end_time ? `–${p.end_time.slice(0, 5)}` : ''}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
