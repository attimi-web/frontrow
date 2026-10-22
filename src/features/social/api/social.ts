import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'
import type { ConcertListItem } from '@/features/concerts/api/concerts'

export interface UserSummary {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

const USER_COLS = 'id, username, display_name, avatar_url'

// ---------- Users / profiles ----------
export async function searchUsers(query: string, selfId: string): Promise<UserSummary[]> {
  const q = query.trim().replace(/^@/, '')
  if (!q) return []
  const { data, error } = await supabase
    .from('profiles')
    .select(USER_COLS)
    .ilike('username', `%${q}%`)
    .neq('id', selfId)
    .limit(12)
  if (error) throw error
  return data ?? []
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle()
  if (error) throw error
  return data
}

// ---------- Friendships ----------
export type FriendStatus = 'pending' | 'accepted' | 'blocked'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendStatus
  requester: UserSummary
  addressee: UserSummary
}

export async function listFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `id, requester_id, addressee_id, status,
       requester:profiles!friendships_requester_id_fkey(${USER_COLS}),
       addressee:profiles!friendships_addressee_id_fkey(${USER_COLS})`,
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Friendship[]
}

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const me = auth.user?.id
  if (!me) throw new Error('Not signed in')
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: me, addressee_id: addresseeId, status: 'pending' })
  if (error) throw error
}

export async function respondToFriendRequest(
  id: string,
  accept: boolean,
): Promise<void> {
  if (accept) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('friendships').delete().eq('id', id)
    if (error) throw error
  }
}

export async function removeFriend(id: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', id)
  if (error) throw error
}

// ---------- Concert buddies ----------
export type BuddyStatus = 'pending' | 'confirmed' | 'declined'

export interface ConcertBuddy {
  id: string
  concert_id: string
  owner_id: string
  tagged_user_id: string
  status: BuddyStatus
  tagged: UserSummary
  owner: UserSummary
}

export async function listConcertBuddies(concertId: string): Promise<ConcertBuddy[]> {
  const { data, error } = await supabase
    .from('concert_buddies')
    .select(
      `id, concert_id, owner_id, tagged_user_id, status,
       tagged:profiles!concert_buddies_tagged_user_id_fkey(${USER_COLS}),
       owner:profiles!concert_buddies_owner_id_fkey(${USER_COLS})`,
    )
    .eq('concert_id', concertId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as unknown as ConcertBuddy[]
}

/** Buddy tags where I'm the tagged user and haven't responded yet. */
export async function listPendingBuddyTags(userId: string): Promise<ConcertBuddy[]> {
  const { data, error } = await supabase
    .from('concert_buddies')
    .select(
      `id, concert_id, owner_id, tagged_user_id, status,
       tagged:profiles!concert_buddies_tagged_user_id_fkey(${USER_COLS}),
       owner:profiles!concert_buddies_owner_id_fkey(${USER_COLS})`,
    )
    .eq('tagged_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ConcertBuddy[]
}

export async function tagBuddy(concertId: string, taggedUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const me = auth.user?.id
  if (!me) throw new Error('Not signed in')
  const { error } = await supabase
    .from('concert_buddies')
    .insert({
      concert_id: concertId,
      owner_id: me,
      tagged_user_id: taggedUserId,
      status: 'pending',
    })
  if (error) throw error
}

export async function respondToBuddyTag(id: string, confirm: boolean): Promise<void> {
  const { error } = await supabase
    .from('concert_buddies')
    .update({ status: confirm ? 'confirmed' : 'declined' })
    .eq('id', id)
  if (error) throw error
}

export async function removeBuddy(id: string): Promise<void> {
  const { error } = await supabase.from('concert_buddies').delete().eq('id', id)
  if (error) throw error
}

// ---------- Mutual shows ----------
function signature(c: ConcertListItem): string {
  const act = (c.festival_name || c.headliner?.name || '').toLowerCase().trim()
  const venue = (c.venue?.name || '').toLowerCase().trim()
  return `${act}|${venue}|${c.date}`
}

/** Returns the set of signatures the viewer attended, for "You too" checks. */
export function signatureSet(concerts: ConcertListItem[]): Set<string> {
  return new Set(concerts.filter((c) => c.status === 'attended').map(signature))
}

export function isMutual(concert: ConcertListItem, mine: Set<string>): boolean {
  return mine.has(signature(concert))
}
