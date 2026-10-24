import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/types/database'
import type { ArtistRole } from '@/types/domain'

export interface LineupEntry {
  artist_id: string
  role: ArtistRole
  billing_order: number
}

export interface ConcertListItem {
  id: string
  date: string
  type: 'concert' | 'festival'
  status: 'attended' | 'planned' | 'wishlist'
  festival_name: string | null
  ticket_price_paid: number | null
  ticket_currency: string | null
  headliner: { name: string; image_url: string | null } | null
  venue: {
    name: string
    city: string
    country: string
    country_name: string
    lat: number | null
    lng: number | null
  } | null
}

export interface FestivalPerformanceData {
  id: string
  role: ArtistRole
  attended: boolean
  start_time: string | null
  end_time: string | null
  perf_order: number
  artist: { id: string; name: string; image_url: string | null }
}

export interface FestivalStageData {
  id: string
  stage_name: string
  stage_order: number
  performances: FestivalPerformanceData[]
}

export interface FestivalDayData {
  id: string
  date: string
  day_order: number
  stages: FestivalStageData[]
}

export interface ConcertDetail extends ConcertListItem {
  user_id: string
  headliner_id: string | null
  tour_name: string | null
  ticket_type: string | null
  ticket_price_paid: number | null
  ticket_currency: string | null
  ticket_scan_url: string | null
  photos: string[]
  setlist_fm_id: string | null
  personal_note: string | null
  accred_type: string | null
  accred_client: string | null
  accred_photo_pit: boolean | null
  accred_first_3_songs: boolean | null
  venue_full: {
    id: string
    name: string
    city: string
    country: string
    country_name: string
  } | null
  lineup: {
    role: ArtistRole
    billing_order: number
    artist: { id: string; name: string; image_url: string | null }
  }[]
  festival_days: FestivalDayData[]
}

const LIST_SELECT =
  'id, date, type, status, festival_name, ticket_price_paid, ticket_currency, headliner:artists!concerts_headliner_id_fkey(name, image_url), venue:venues!concerts_venue_id_fkey(name, city, country, country_name, lat, lng)'

export async function listConcerts(userId: string): Promise<ConcertListItem[]> {
  const { data, error } = await supabase
    .from('concerts')
    .select(LIST_SELECT)
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ConcertListItem[]
}

/** Another user's attended shows — readable when their profile is public
 *  (concerts_read RLS). Used for public profiles and mutual-show checks. */
export async function listPublicAttendedConcerts(
  userId: string,
): Promise<ConcertListItem[]> {
  const { data, error } = await supabase
    .from('concerts')
    .select(LIST_SELECT)
    .eq('user_id', userId)
    .eq('status', 'attended')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ConcertListItem[]
}

export async function getConcert(id: string): Promise<ConcertDetail> {
  const { data, error } = await supabase
    .from('concerts')
    .select(
      'id, user_id, headliner_id, date, type, status, festival_name, tour_name, ticket_type, ticket_price_paid, ticket_currency, ticket_scan_url, photos, setlist_fm_id, personal_note, accred_type, accred_client, accred_photo_pit, accred_first_3_songs, headliner:artists!concerts_headliner_id_fkey(name, image_url), venue:venues!concerts_venue_id_fkey(name, city, country_name), venue_full:venues!concerts_venue_id_fkey(id, name, city, country, country_name), lineup:concert_artists(role, billing_order, artist:artists(id, name, image_url)), festival_days(id, date, day_order, stages:festival_stages(id, stage_name, stage_order, performances(id, role, attended, start_time, end_time, perf_order, artist:artists(id, name, image_url))))',
    )
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as ConcertDetail
}

export interface FestivalPayload {
  festival_name: string
  venue_id: string | null
  date: string
  status: 'attended' | 'planned' | 'wishlist'
  days: {
    date: string
    stages: {
      stage_name: string
      performances: {
        artist_id: string
        role: ArtistRole
        attended: boolean
        start_time: string | null
        end_time: string | null
      }[]
    }[]
  }[]
}

/** Atomically create (concertId null) or replace a festival's hierarchy. */
export async function saveFestival(
  concertId: string | null,
  payload: FestivalPayload,
): Promise<string> {
  const { data, error } = await supabase.rpc('save_festival', {
    p_concert_id: concertId,
    p_payload: payload as never,
  })
  if (error) throw error
  return data as string
}

export async function createConcert(
  payload: TablesInsert<'concerts'>,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('concerts')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function updateConcert(
  id: string,
  payload: TablesUpdate<'concerts'>,
): Promise<void> {
  const { error } = await supabase.from('concerts').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteConcert(id: string): Promise<void> {
  const { error } = await supabase.from('concerts').delete().eq('id', id)
  if (error) throw error
}

/** Replace a concert's lineup with the given entries. */
export async function setConcertLineup(
  concertId: string,
  lineup: LineupEntry[],
): Promise<void> {
  const del = await supabase.from('concert_artists').delete().eq('concert_id', concertId)
  if (del.error) throw del.error
  if (lineup.length === 0) return
  const rows = lineup.map((l) => ({ ...l, concert_id: concertId }))
  const { error } = await supabase.from('concert_artists').insert(rows)
  if (error) throw error
}
