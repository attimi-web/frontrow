import { supabase } from '@/lib/supabase'
import type { Artist } from '@/types/domain'

export interface ArtistShow {
  id: string
  date: string
  type: 'concert' | 'festival'
  status: 'attended' | 'planned' | 'wishlist'
  festival_name: string | null
  tour_name: string | null
  venue: { name: string; city: string; country_name: string } | null
}

const SHOW_FIELDS =
  'id, date, type, status, festival_name, tour_name, venue:venues!concerts_venue_id_fkey(name, city, country_name)'

export async function getArtist(id: string): Promise<Artist> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

function ids(rows: { concert_id: string }[] | null): string[] {
  return (rows ?? []).map((r) => r.concert_id)
}

/**
 * Every show of the current user that involves this artist — as headliner
 * (concerts.headliner_id), support act (concert_artists) or festival act
 * (performances). We collect candidate concert ids from the three sources,
 * then read the user's own concerts matching them.
 */
export async function getArtistShows(
  userId: string,
  artistId: string,
): Promise<ArtistShow[]> {
  const [headliners, supports, festival] = await Promise.all([
    supabase.from('concerts').select('id').eq('user_id', userId).eq('headliner_id', artistId),
    supabase.from('concert_artists').select('concert_id').eq('artist_id', artistId),
    supabase.from('performances').select('concert_id').eq('artist_id', artistId),
  ])
  if (headliners.error) throw headliners.error
  if (supports.error) throw supports.error
  if (festival.error) throw festival.error

  const concertIds = [
    ...new Set([
      ...(headliners.data ?? []).map((r) => r.id),
      ...ids(supports.data),
      ...ids(festival.data),
    ]),
  ]
  if (concertIds.length === 0) return []

  const { data, error } = await supabase
    .from('concerts')
    .select(SHOW_FIELDS)
    .eq('user_id', userId)
    .in('id', concertIds)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ArtistShow[]
}

/** Of the given concerts, those that have at least one logged setlist song. */
export async function getConcertsWithSetlist(concertIds: string[]): Promise<Set<string>> {
  if (concertIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('setlist_songs')
    .select('concert_id')
    .in('concert_id', concertIds)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.concert_id))
}

export interface TourGroup {
  tour: string | null
  year: string | null
  shows: ArtistShow[]
}

/**
 * Group an artist's shows by tour (newest group first), with tour-less shows
 * collected into a trailing `null` group. Shows inside a group stay in incoming
 * (date-desc) order.
 */
export function groupShowsByTour(shows: ArtistShow[]): TourGroup[] {
  const groups = new Map<string, ArtistShow[]>()
  for (const s of shows) {
    const key = s.tour_name ?? '\u0000' // sort tour-less last
    const bucket = groups.get(key)
    if (bucket) bucket.push(s)
    else groups.set(key, [s])
  }
  return [...groups.entries()]
    .map(([key, groupShows]) => ({
      tour: key === '\u0000' ? null : key,
      year: groupShows[0]?.date.slice(0, 4) ?? null,
      shows: groupShows,
    }))
    .sort((a, b) => (b.shows[0]?.date ?? '').localeCompare(a.shows[0]?.date ?? ''))
}
