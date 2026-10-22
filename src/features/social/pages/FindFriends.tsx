import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BackHeader } from '@/components/layout/BackHeader'
import { AvatarTile } from '@/components/ui/AvatarTile'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { toast } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  respondToBuddyTag,
  type UserSummary,
  type ConcertBuddy,
} from '../api/social'
import { useDerivedFriends, usePendingBuddyTags } from '../hooks'

export function FindFriends() {
  const selfId = useAuthStore((s) => s.user?.id as string)
  const queryClient = useQueryClient()
  const { friends, incoming, outgoing, isLoading } = useDerivedFriends()
  const { data: buddyTags } = usePendingBuddyTags()

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  const { data: results, isFetching } = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => searchUsers(debounced, selfId),
    enabled: debounced.replace(/^@/, '').length >= 2,
  })

  const invalidateFriends = () =>
    queryClient.invalidateQueries({ queryKey: ['friendships'] })

  const addFriend = useMutation({
    mutationFn: (id: string) => sendFriendRequest(id),
    onSuccess: () => {
      invalidateFriends()
      toast.success('Request sent')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not send request'),
  })

  const respondFriend = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondToFriendRequest(id, accept),
    onSuccess: () => invalidateFriends(),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Action failed'),
  })

  const respondBuddy = useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) =>
      respondToBuddyTag(id, confirm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy-tags'] })
      queryClient.invalidateQueries({ queryKey: ['concerts'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Action failed'),
  })

  // friendship status for each search result
  const statusOf = useMemo(() => {
    const map = new Map<string, 'friends' | 'pending' | 'none'>()
    for (const f of friends) map.set(f.user.id, 'friends')
    for (const f of [...incoming, ...outgoing]) map.set(f.user.id, 'pending')
    return map
  }, [friends, incoming, outgoing])

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px]">
      <BackHeader title="Find Friends" />
      <div className="px-6 pb-10 pt-2">
        <Input
          leading={<span className="font-body text-sm">@</span>}
          placeholder="Search by username…"
          value={query}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
          trailing={isFetching ? <Spinner size={16} /> : undefined}
        />

        {debounced.replace(/^@/, '').length >= 2 && (
          <Section title="Results">
            {(results ?? []).length === 0 ? (
              <Empty text={isFetching ? 'Searching…' : 'No users found'} />
            ) : (
              (results ?? []).map((u) => (
                <PersonRow key={u.id} user={u}>
                  {statusOf.get(u.id) === 'friends' ? (
                    <Pill label="Friends" />
                  ) : statusOf.get(u.id) === 'pending' ? (
                    <Pill label="Pending" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => addFriend.mutate(u.id)}
                      className="h-8 rounded-[9px] bg-orange px-3 font-body text-xs font-semibold text-white"
                    >
                      Add
                    </button>
                  )}
                </PersonRow>
              ))
            )}
          </Section>
        )}

        {buddyTags && buddyTags.length > 0 && (
          <Section title="Show invites" count={buddyTags.length}>
            {buddyTags.map((t: ConcertBuddy) => (
              <PersonRow
                key={t.id}
                user={t.owner}
                sub={`@${t.owner.username} · tagged you in a show`}
                accent
              >
                <AcceptDecline
                  onAccept={() => respondBuddy.mutate({ id: t.id, confirm: true })}
                  onDecline={() => respondBuddy.mutate({ id: t.id, confirm: false })}
                />
              </PersonRow>
            ))}
          </Section>
        )}

        {incoming.length > 0 && (
          <Section title="Requests" count={incoming.length}>
            {incoming.map(({ friendship, user }) => (
              <PersonRow key={friendship.id} user={user} accent>
                <AcceptDecline
                  onAccept={() => respondFriend.mutate({ id: friendship.id, accept: true })}
                  onDecline={() => respondFriend.mutate({ id: friendship.id, accept: false })}
                />
              </PersonRow>
            ))}
          </Section>
        )}

        <Section title={`Friends · ${friends.length}`}>
          {isLoading ? (
            <div className="flex justify-center py-6 text-orange">
              <Spinner size={20} />
            </div>
          ) : friends.length === 0 ? (
            <Empty text="No friends yet. Search above to connect." />
          ) : (
            friends.map(({ user }) => <PersonRow key={user.id} user={user} />)
          )}
        </Section>
      </div>
    </div>
  )
}

function PersonRow({
  user,
  sub,
  accent,
  children,
}: {
  user: UserSummary
  sub?: string
  accent?: boolean
  children?: React.ReactNode
}) {
  const name = user.display_name || user.username
  return (
    <div
      className={
        'mb-2 flex items-center gap-3 rounded-2xl border p-3.5 ' +
        (accent ? 'border-orange/[0.14] bg-orange/[0.05]' : 'border-border bg-white/[0.03]')
      }
    >
      <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <AvatarTile name={name} size={44} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold tracking-[-0.2px] text-fg">
            {name}
          </p>
          <p className="mt-0.5 truncate font-body text-xs text-fg-faint">
            {sub ?? `@${user.username}`}
          </p>
        </div>
      </Link>
      {children && <div className="flex-none">{children}</div>}
    </div>
  )
}

function AcceptDecline({
  onAccept,
  onDecline,
}: {
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={onAccept}
        aria-label="Accept"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-orange text-white shadow-[0_2px_10px_rgba(232,117,42,0.3)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onDecline}
        aria-label="Decline"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/[0.06] text-fg-subtle"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-[9px] bg-white/[0.06] px-3 py-1.5 font-body text-xs font-medium text-fg-subtle">
      {label}
    </span>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled">
          {title}
        </p>
        {count != null && (
          <span className="flex h-5 items-center rounded-md bg-orange px-2 font-body text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong p-6 text-center">
      <p className="font-body text-sm text-fg-subtle">{text}</p>
    </div>
  )
}
