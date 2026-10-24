// Server-side venue geocoding. Venues are geocoded once, right after
// creation, and lat/lng are stored on the row.
// Clients cannot UPDATE venues (RLS), so this function writes with the
// service role.
//
// Body:
//   { venueId: string }   geocode one venue (no-op if it already has lat/lng)
//   { backfill: true }    geocode up to BACKFILL_LIMIT venues still missing lat/lng
//                         (admin-only: caller must be in app_admins)
//
// Providers (no API keys):
//   1. Photon (komoot, OSM data) for the venue itself — precise pin.
//   2. Open-Meteo geocoding for the city centroid — fallback.
// nominatim.openstreetmap.org is not used: it answers 403 to Supabase's edge
// IPs. Photon may also be unreachable from the edge (connection refused); a
// provider failure just falls through to the next one. We identify ourselves
// and keep to ~1 request/second (fair use).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PHOTON = 'https://photon.komoot.io/api/'
const OPEN_METEO = 'https://geocoding-api.open-meteo.com/v1/search'
const USER_AGENT = 'FrontRow/0.1 (+https://github.com/attimilabs-org/frontrow)'
const BACKFILL_LIMIT = 25

interface VenueRow {
  id: string
  name: string
  city: string
  country: string
  country_name: string
  lat: number | null
  lng: number | null
}

type Precision = 'venue' | 'city'

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: { countrycode?: string }
}

/** First Photon hit inside `country` (Photon has no country filter param). */
async function photon(
  params: Record<string, string>,
  country: string,
): Promise<{ lat: number; lng: number } | null> {
  const qs = new URLSearchParams({ limit: '5', lang: 'en', ...params })
  const res = await fetch(`${PHOTON}?${qs}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Photon returned ${res.status}`)
  const body = await res.json()
  const hit = (body?.features as PhotonFeature[] | undefined)?.find(
    (f) => f.properties?.countrycode?.toUpperCase() === country.toUpperCase(),
  )
  const coords = hit?.geometry?.coordinates
  if (!coords) return null
  const [lng, lat] = coords
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

/** City centroid from Open-Meteo, restricted to `country`. */
async function openMeteoCity(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  const qs = new URLSearchParams({ name: city, countryCode: country, count: '1', language: 'en', format: 'json' })
  const res = await fetch(`${OPEN_METEO}?${qs}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`)
  const hit = (await res.json())?.results?.[0]
  const lat = Number(hit?.latitude)
  const lng = Number(hit?.longitude)
  return hit && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

/** Try the venue itself first (Photon, one retry: its connections from the
 *  edge are intermittently refused), then fall back to the city centroid. */
async function geocode(v: VenueRow): Promise<{ lat: number; lng: number; precision: Precision } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const exact = await photon({ q: `${v.name} ${v.city}` }, v.country)
      if (exact) return { ...exact, precision: 'venue' }
      break
    } catch (e) {
      console.warn(`photon attempt ${attempt + 1} failed`, e instanceof Error ? e.message : e)
      if (attempt === 0) await sleep(1100)
    }
  }
  const city = await openMeteoCity(v.city, v.country)
  if (city) return { ...city, precision: 'city' }
  return null
}

/** True when the caller's JWT belongs to a user listed in app_admins (0011). */
async function isAppAdmin(admin: SupabaseClient, req: Request): Promise<boolean> {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return false
  const { data: { user } } = await admin.auth.getUser(jwt)
  if (!user) return false
  const { data } = await admin.from('app_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  return !!data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { venueId, backfill } = await req.json().catch(() => ({}))
    const cols = 'id, name, city, country, country_name, lat, lng'

    let venues: VenueRow[]
    if (backfill) {
      if (!(await isAppAdmin(admin, req))) return json({ error: 'backfill is admin-only' }, 403)
      const { data, error } = await admin
        .from('venues')
        .select(cols)
        .or('lat.is.null,lng.is.null')
        .order('created_at')
        .limit(BACKFILL_LIMIT)
      if (error) throw error
      venues = data ?? []
    } else if (venueId) {
      const { data, error } = await admin.from('venues').select(cols).eq('id', venueId).maybeSingle()
      if (error) throw error
      if (!data) return json({ error: 'venue not found' }, 404)
      if (data.lat != null && data.lng != null) {
        return json({ results: [{ id: data.id, lat: data.lat, lng: data.lng, precision: 'cached' }] })
      }
      venues = [data]
    } else {
      return json({ error: 'venueId or backfill is required' }, 400)
    }

    const results = []
    for (const [i, v] of venues.entries()) {
      if (i > 0) await sleep(1100)
      const hit = await geocode(v)
      if (!hit) {
        results.push({ id: v.id, name: v.name, lat: null, lng: null, precision: null })
        continue
      }
      const { error } = await admin.from('venues').update({ lat: hit.lat, lng: hit.lng }).eq('id', v.id)
      if (error) throw error
      results.push({ id: v.id, name: v.name, ...hit })
    }

    return json({ results })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unknown error' }, 500)
  }
})
