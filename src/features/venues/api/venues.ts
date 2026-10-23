import { supabase } from '@/lib/supabase'
import type { Venue } from '@/types/domain'

export interface VenueShow {
  id: string
  date: string
  type: 'concert' | 'festival'
  status: 'attended' | 'planned' | 'wishlist'
  festival_name: string | null
  tour_name: string | null
  ticket_price_paid: number | null
  ticket_currency: string | null
  headliner: { name: string } | null
}

const SHOW_FIELDS =
  'id, date, type, status, festival_name, tour_name, ticket_price_paid, ticket_currency, headliner:artists!concerts_headliner_id_fkey(name)'

export async function getVenue(id: string): Promise<Venue> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/** The current user's shows at this venue, newest first. */
export async function getVenueShows(
  userId: string,
  venueId: string,
): Promise<VenueShow[]> {
  const { data, error } = await supabase
    .from('concerts')
    .select(SHOW_FIELDS)
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as VenueShow[]
}

/** Display title for a venue show: headliner, or the festival name. */
export function venueShowTitle(s: VenueShow): string {
  if (s.type === 'festival' && s.festival_name) return s.festival_name
  return s.headliner?.name ?? 'Show'
}
