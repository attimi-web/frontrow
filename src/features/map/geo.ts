import type { ConcertListItem } from '@/features/concerts/api/concerts'

/**
 * World Map data layer — pure aggregations over attended shows.
 * Shows whose venue has no lat/lng yet (geocoding pending/failed) still count
 * towards countries/cities, they just don't get a dot or a km leg.
 */

export interface CityPoint {
  key: string
  city: string
  country: string
  lat: number
  lng: number
  count: number
}

/** One point per city (venues in the same city are averaged), most shows first. */
export function cityPoints(concerts: ConcertListItem[]): CityPoint[] {
  const map = new Map<string, CityPoint & { latSum: number; lngSum: number; geo: number }>()
  for (const c of concerts) {
    const v = c.venue
    if (!v) continue
    const key = `${v.city.toLowerCase()}|${v.country}`
    const entry =
      map.get(key) ??
      { key, city: v.city, country: v.country, lat: 0, lng: 0, count: 0, latSum: 0, lngSum: 0, geo: 0 }
    entry.count += 1
    if (v.lat != null && v.lng != null) {
      entry.latSum += v.lat
      entry.lngSum += v.lng
      entry.geo += 1
    }
    map.set(key, entry)
  }
  return [...map.values()]
    .filter((e) => e.geo > 0)
    .map(({ latSum, lngSum, geo, ...e }) => ({ ...e, lat: latSum / geo, lng: lngSum / geo }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
}

export interface CountryShowCount {
  code: string
  name: string
  count: number
}

/** Shows per country (ISO code + display name), most first. */
export function countryCounts(concerts: ConcertListItem[]): CountryShowCount[] {
  const map = new Map<string, CountryShowCount>()
  for (const c of concerts) {
    const v = c.venue
    if (!v) continue
    const entry = map.get(v.country) ?? { code: v.country, name: v.country_name, count: 0 }
    entry.count += 1
    map.set(v.country, entry)
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** Distinct cities, including ones not geocoded yet. */
export function cityCount(concerts: ConcertListItem[]): number {
  const cities = new Set<string>()
  for (const c of concerts) {
    if (c.venue) cities.add(`${c.venue.city.toLowerCase()}|${c.venue.country}`)
  }
  return cities.size
}

/** Great-circle distance in km. */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Km between consecutive shows in date order (geocoded venues only). */
export function kmTravelled(concerts: ConcertListItem[]): number {
  const stops = concerts
    .filter((c) => c.venue?.lat != null && c.venue?.lng != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({ lat: c.venue!.lat as number, lng: c.venue!.lng as number }))
  let km = 0
  for (let i = 1; i < stops.length; i++) km += haversineKm(stops[i - 1], stops[i])
  return km
}

/** 52341 → "52k", 1830 → "1.8k", 412 → "412". */
export function formatKm(km: number): string {
  if (km >= 10_000) return `${Math.round(km / 1000)}k`
  if (km >= 1_000) return `${(km / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(km))
}

/** ISO alpha-2 → flag emoji ("GB" → 🇬🇧). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🏳️'
  return String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0)))
}
