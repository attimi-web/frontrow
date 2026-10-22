import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  listFriendships,
  listPendingBuddyTags,
  listConcertBuddies,
  type Friendship,
  type UserSummary,
} from './api/social'

export function useFriendships() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['friendships', userId],
    queryFn: () => listFriendships(userId as string),
    enabled: !!userId,
  })
}

export interface DerivedFriends {
  friends: { friendship: Friendship; user: UserSummary }[]
  incoming: { friendship: Friendship; user: UserSummary }[]
  outgoing: { friendship: Friendship; user: UserSummary }[]
}

/** Split friendships relative to the current user. */
export function useDerivedFriends(): DerivedFriends & { isLoading: boolean } {
  const userId = useAuthStore((s) => s.user?.id)
  const { data, isLoading } = useFriendships()

  const derived = useMemo<DerivedFriends>(() => {
    const friends: DerivedFriends['friends'] = []
    const incoming: DerivedFriends['incoming'] = []
    const outgoing: DerivedFriends['outgoing'] = []
    for (const f of data ?? []) {
      const other = f.requester_id === userId ? f.addressee : f.requester
      if (f.status === 'accepted') friends.push({ friendship: f, user: other })
      else if (f.status === 'pending') {
        if (f.addressee_id === userId) incoming.push({ friendship: f, user: other })
        else outgoing.push({ friendship: f, user: other })
      }
    }
    return { friends, incoming, outgoing }
  }, [data, userId])

  return { ...derived, isLoading }
}

/** Relationship of the current user to another user id. */
export type Relationship = 'none' | 'friends' | 'incoming' | 'outgoing'

export function useRelationshipWith(otherId: string | undefined): {
  relationship: Relationship
  friendshipId: string | null
} {
  const { friends, incoming, outgoing } = useDerivedFriends()
  return useMemo(() => {
    if (!otherId) return { relationship: 'none', friendshipId: null }
    const inFriends = friends.find((x) => x.user.id === otherId)
    if (inFriends) return { relationship: 'friends', friendshipId: inFriends.friendship.id }
    const inInc = incoming.find((x) => x.user.id === otherId)
    if (inInc) return { relationship: 'incoming', friendshipId: inInc.friendship.id }
    const inOut = outgoing.find((x) => x.user.id === otherId)
    if (inOut) return { relationship: 'outgoing', friendshipId: inOut.friendship.id }
    return { relationship: 'none', friendshipId: null }
  }, [otherId, friends, incoming, outgoing])
}

export function usePendingBuddyTags() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['buddy-tags', userId],
    queryFn: () => listPendingBuddyTags(userId as string),
    enabled: !!userId,
  })
}

export function useConcertBuddies(concertId: string | undefined) {
  return useQuery({
    queryKey: ['concert-buddies', concertId],
    queryFn: () => listConcertBuddies(concertId as string),
    enabled: !!concertId,
  })
}
