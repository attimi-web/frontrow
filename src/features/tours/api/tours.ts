import { supabase } from '@/lib/supabase'

export interface Tour {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  total_shows: number | null
  artist: { id: string; name: string; image_url: string | null }
}

export interface TourShow {
  id: string
  date: string
  status: 'attended' | 'planned' | 'wishlist'
  venue: { id: string; name: string; city: string; country_name: string } | null
}

export async function getTour(id: string): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .select('id, name, start_date, end_date, total_shows, artist:artists(id, name, image_url)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Tour
}

/** The current user's shows on this tour (attended + planned), newest first. */
export async function getTourShows(userId: string, tourId: string): Promise<TourShow[]> {
  const { data, error } = await supabase
    .from('concerts')
    .select('id, date, status, venue:venues!concerts_venue_id_fkey(id, name, city, country_name)')
    .eq('user_id', userId)
    .eq('tour_id', tourId)
    .neq('status', 'wishlist')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as TourShow[]
}

/** Set the tour's length (shared catalog; allowed if you have a show on it — 0012). */
export async function setTourTotalShows(tourId: string, total: number): Promise<void> {
  const { error } = await supabase.rpc('set_tour_total_shows', {
    p_tour_id: tourId,
    p_total: total,
  })
  if (error) throw error
}
