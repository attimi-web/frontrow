import { supabase } from '@/lib/supabase'
import type { UserSummary } from '@/features/social/api/social'

export interface ShowGenres {
  date: string
  genres: string[]
}

/**
 * Genres of each attended show's headliner. ConcertListItem doesn't carry
 * genres, so this is the extra query the stats "Genre Breakdown" needs.
 */
export async function getAttendedGenres(userId: string): Promise<ShowGenres[]> {
  const { data, error } = await supabase
    .from('concerts')
    .select('date, headliner:artists!concerts_headliner_id_fkey(genres)')
    .eq('user_id', userId)
    .eq('status', 'attended')
  if (error) throw error
  type Row = { date: string; headliner: { genres: string[] | null } | null }
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    date: r.date,
    genres: r.headliner?.genres ?? [],
  }))
}

export interface BuddyRank {
  user: UserSummary
  count: number
}

const USER_COLS = 'id, username, display_name, avatar_url'

/**
 * Confirmed concert buddies ranked by how many shows you share. Covers both
 * directions (you tagged them, or they tagged you); the "other" person in each
 * row is whoever isn't you.
 */
export async function getBuddyLeaderboard(
  userId: string,
  limit = 5,
): Promise<BuddyRank[]> {
  const { data, error } = await supabase
    .from('concert_buddies')
    .select(
      `owner_id, tagged_user_id, status,
       tagged:profiles!concert_buddies_tagged_user_id_fkey(${USER_COLS}),
       owner:profiles!concert_buddies_owner_id_fkey(${USER_COLS})`,
    )
    .eq('status', 'confirmed')
    .or(`owner_id.eq.${userId},tagged_user_id.eq.${userId}`)
  if (error) throw error

  type Row = {
    owner_id: string
    tagged_user_id: string
    tagged: UserSummary
    owner: UserSummary
  }
  const tally = new Map<string, BuddyRank>()
  for (const row of (data ?? []) as unknown as Row[]) {
    const other = row.owner_id === userId ? row.tagged : row.owner
    if (!other?.id || other.id === userId) continue
    const entry = tally.get(other.id)
    if (entry) entry.count += 1
    else tally.set(other.id, { user: other, count: 1 })
  }
  return [...tally.values()]
    .sort((a, b) => b.count - a.count || a.user.username.localeCompare(b.user.username))
    .slice(0, limit)
}
