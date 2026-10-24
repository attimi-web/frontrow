import { supabase } from '@/lib/supabase'
import type { ComboboxItem } from '@/components/ui/Combobox'
import type { Artist, Venue } from '@/types/domain'

// ---------- Artists ----------
export async function searchArtists(query: string): Promise<ComboboxItem[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, origin_country')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(8)
  if (error) throw error
  return (data ?? []).map((a) => ({
    id: a.id,
    label: a.name,
    sublabel: a.origin_country ?? undefined,
  }))
}

/** Returns the canonical artist for `name`, creating it only if none exists
 *  (case-insensitive, atomic — see find_or_create_artist RPC). */
export async function findOrCreateArtist(name: string): Promise<Artist> {
  const { data, error } = await supabase.rpc('find_or_create_artist', { p_name: name })
  if (error) throw error
  return data as Artist
}

// ---------- Venues ----------
export async function searchVenues(query: string): Promise<ComboboxItem[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, city, country_name')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(8)
  if (error) throw error
  return (data ?? []).map((v) => ({
    id: v.id,
    label: v.name,
    sublabel: [v.city, v.country_name].filter(Boolean).join(', '),
  }))
}

/** Returns the canonical venue for (name, city, country), creating it only if
 *  none exists (case-insensitive, atomic — see find_or_create_venue RPC). */
export async function findOrCreateVenue(input: {
  name: string
  city: string
  country: string
  country_name: string
}): Promise<Venue> {
  const { data, error } = await supabase.rpc('find_or_create_venue', {
    p_name: input.name,
    p_city: input.city,
    p_country: input.country,
    p_country_name: input.country_name,
  })
  if (error) throw error
  const venue = data as Venue
  if (venue.lat == null || venue.lng == null) requestVenueGeocode(venue.id)
  return venue
}

/** Fire-and-forget: the geocode-venue Edge Function looks up lat/lng
 *  (Nominatim) and stores them on the venue. Never blocks or fails a save. */
export function requestVenueGeocode(venueId: string): void {
  supabase.functions
    .invoke('geocode-venue', { body: { venueId } })
    .then(({ error }) => {
      if (error) console.warn('Venue geocoding failed', error)
    })
    .catch((e) => console.warn('Venue geocoding failed', e))
}
