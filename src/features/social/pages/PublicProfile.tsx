import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parseISO, format } from 'date-fns'
import { BackHeader } from '@/components/layout/BackHeader'
import { AvatarTile } from '@/components/ui/AvatarTile'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { listPublicAttendedConcerts, type ConcertListItem } from '@/features/concerts/api/concerts'
import {
  getProfileByUsername,
  sendFriendRequest,
  respondToFriendRequest,
  signatureSet,
  isMutual,
} from '../api/social'
import { useRelationshipWith } from '../hooks'

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const selfId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => getProfileByUsername(username as string),
    enabled: !!username,
  })

  const { data: theirShows } = useQuery({
    queryKey: ['public-concerts', profile?.id],
    queryFn: () => listPublicAttendedConcerts(profile!.id),
    enabled: !!profile?.id,
  })
  const { data: myShows } = useConcerts()

  const mine = useMemo(() => signatureSet(myShows ?? []), [myShows])
  const mutualCount = useMemo(
    () => (theirShows ?? []).filter((c) => isMutual(c, mine)).length,
    [theirShows, mine],
  )

  const { relationship, friendshipId } = useRelationshipWith(profile?.id)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['friendships'] })

  const add = useMutation({
    mutationFn: () => sendFriendRequest(profile!.id),
    onSuccess: () => {
      invalidate()
      toast.success('Request sent')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not send request'),
  })
  const accept = useMutation({
    mutationFn: () => respondToFriendRequest(friendshipId as string, true),
    onSuccess: invalidate,
  })

  if (isLoading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[440px]">
        <BackHeader />
        <div className="flex justify-center py-20 text-orange">
          <Spinner size={28} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[440px]">
        <BackHeader />
        <p className="px-6 pt-10 text-center font-body text-sm text-fg-subtle">
          This profile doesn’t exist or is private.
        </p>
      </div>
    )
  }

  const name = profile.display_name || profile.username
  const shows = theirShows ?? []
  const countries = new Set(
    shows.map((c) => c.venue?.country_name).filter(Boolean),
  ).size
  const fests = shows.filter((c) => c.type === 'festival').length
  const isSelf = profile.id === selfId

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] pb-10">
      <BackHeader />
      <div className="flex flex-col items-center px-6 pt-2">
        <AvatarTile name={name} size={84} radius={22} brand />
        <h1 className="mt-3 font-display text-xl font-extrabold tracking-[-0.4px] text-fg">
          {name}
        </h1>
        <p className="mt-1 font-body text-[13px] text-fg-faint">
          @{profile.username}
          {profile.location ? ` · ${profile.location}` : ''}
        </p>
        {profile.bio && (
          <p className="mt-2 max-w-[280px] text-center font-body text-[13px] leading-[1.5] text-fg-subtle">
            {profile.bio}
          </p>
        )}

        {!isSelf && (
          <div className="mt-4 w-full">
            {relationship === 'friends' ? (
              <FriendButton label="Friends" tone="muted" />
            ) : relationship === 'outgoing' ? (
              <FriendButton label="Requested" tone="muted" />
            ) : relationship === 'incoming' ? (
              <FriendButton label="Accept request" onClick={() => accept.mutate()} />
            ) : (
              <FriendButton label="Add friend" onClick={() => add.mutate()} loading={add.isPending} />
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mx-6 mt-4 flex overflow-hidden rounded-2xl border border-border bg-white/[0.03]">
        <Stat value={shows.length} label="Shows" />
        <Stat value={countries} label="Countries" />
        <Stat value={mutualCount} label="Together" />
        <Stat value={fests} label="Fests" last />
      </div>

      {mutualCount > 0 && (
        <div className="mx-6 mt-2.5 flex items-center gap-2.5 rounded-[14px] border border-orange/[0.14] bg-orange/[0.06] px-3.5 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#e8752a" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" stroke="#e8752a" strokeWidth="1.8" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#e8752a" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p className="font-body text-[13px] font-medium text-orange">
            You both attended <strong>{mutualCount} show{mutualCount === 1 ? '' : 's'}</strong> together
          </p>
        </div>
      )}

      {/* Recent shows */}
      <div className="mt-5 px-6">
        <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled">
          Recent
        </p>
        {shows.length === 0 ? (
          <p className="py-6 text-center font-body text-sm text-fg-subtle">No public shows yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shows.slice(0, 20).map((c) => (
              <ShowRow key={c.id} concert={c} youToo={isMutual(c, mine)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FriendButton({
  label,
  onClick,
  tone,
  loading,
}: {
  label: string
  onClick?: () => void
  tone?: 'muted'
  loading?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || loading}
      className={cn(
        'flex h-[42px] w-full items-center justify-center rounded-[13px] font-body text-sm font-semibold transition',
        tone === 'muted'
          ? 'border border-white/10 bg-white/[0.06] text-fg-muted'
          : 'bg-orange text-white shadow-[0_4px_16px_rgba(232,117,42,0.3)]',
      )}
    >
      {loading ? <Spinner size={16} /> : label}
    </button>
  )
}

function Stat({ value, label, last }: { value: number; label: string; last?: boolean }) {
  return (
    <div className={cn('flex-1 px-2 py-3.5 text-center', !last && 'border-r border-border')}>
      <p className="font-display text-xl font-extrabold tracking-[-0.5px] text-orange">{value}</p>
      <p className="mt-0.5 font-body text-[9px] uppercase tracking-[0.05em] text-fg-disabled">
        {label}
      </p>
    </div>
  )
}

function ShowRow({ concert, youToo }: { concert: ConcertListItem; youToo: boolean }) {
  const title =
    concert.type === 'festival' && concert.festival_name
      ? concert.festival_name
      : (concert.headliner?.name ?? 'Untitled')
  const sub = [concert.venue?.name, concert.venue?.city, format(parseISO(concert.date), 'MMM d')]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-border bg-white/[0.03] px-3.5 py-3">
      <AvatarTile name={title} size={42} radius={11} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold tracking-[-0.2px] text-fg">{title}</p>
        <p className="mt-0.5 truncate font-body text-[11px] text-fg-faint">{sub}</p>
      </div>
      {youToo && <Badge tone="orange">You too</Badge>}
    </div>
  )
}
