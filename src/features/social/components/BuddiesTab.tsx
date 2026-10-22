import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AvatarTile } from '@/components/ui/AvatarTile'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { tagBuddy, removeBuddy, type ConcertBuddy } from '../api/social'
import { useConcertBuddies, useDerivedFriends } from '../hooks'

export function BuddiesTab({
  concertId,
  ownerId,
}: {
  concertId: string
  ownerId: string
}) {
  const selfId = useAuthStore((s) => s.user?.id)
  const isOwner = selfId === ownerId
  const queryClient = useQueryClient()
  const { data: buddies, isLoading } = useConcertBuddies(concertId)
  const { friends } = useDerivedFriends()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['concert-buddies', concertId] })

  const tag = useMutation({
    mutationFn: (userId: string) => tagBuddy(concertId, userId),
    onSuccess: () => {
      invalidate()
      toast.success('Buddy tagged')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not tag buddy'),
  })
  const untag = useMutation({
    mutationFn: (id: string) => removeBuddy(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not remove buddy'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-orange">
        <Spinner size={22} />
      </div>
    )
  }

  const tagged = buddies ?? []
  const taggedIds = new Set(tagged.map((b) => b.tagged_user_id))
  const taggable = friends.filter((f) => !taggedIds.has(f.user.id))

  return (
    <div className="space-y-5">
      {tagged.length > 0 ? (
        <section className="space-y-2">
          {tagged.map((b: ConcertBuddy) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white/[0.03] p-3"
            >
              <Link
                to={`/u/${b.tagged.username}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <AvatarTile name={b.tagged.display_name || b.tagged.username} size={40} radius={11} />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-fg">
                    {b.tagged.display_name || b.tagged.username}
                  </p>
                  <p className="truncate font-body text-xs text-fg-faint">@{b.tagged.username}</p>
                </div>
              </Link>
              <StatusBadge status={b.status} />
              {isOwner && (
                <button
                  type="button"
                  aria-label="Remove buddy"
                  onClick={() => untag.mutate(b.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle transition hover:bg-white/10 hover:text-fg"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </section>
      ) : (
        <p className="py-4 text-center font-body text-sm text-fg-subtle">
          No buddies tagged yet.
        </p>
      )}

      {isOwner && (
        <section>
          <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled">
            Tag a friend
          </p>
          {friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong p-5 text-center">
              <p className="font-body text-sm text-fg-subtle">
                Add friends to tag them in your shows.
              </p>
              <Link
                to="/friends"
                className="mt-3 inline-flex h-9 items-center rounded-xl bg-orange px-4 font-display text-sm font-bold text-white"
              >
                Find friends
              </Link>
            </div>
          ) : taggable.length === 0 ? (
            <p className="font-body text-sm text-fg-subtle">All your friends are tagged.</p>
          ) : (
            <div className="space-y-2">
              {taggable.map(({ user }) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white/[0.02] p-2.5 pl-3"
                >
                  <AvatarTile name={user.display_name || user.username} size={36} radius={10} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm text-fg">
                      {user.display_name || user.username}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => tag.mutate(user.id)}
                    className="h-8 rounded-[9px] bg-orange px-3 font-body text-xs font-semibold text-white"
                  >
                    Tag
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ConcertBuddy['status'] }) {
  if (status === 'confirmed') return <Badge tone="green">Confirmed</Badge>
  if (status === 'declined') return <Badge tone="neutral">Declined</Badge>
  return <Badge tone="neutral">Pending</Badge>
}
