import type { ConcertListItem } from '@/features/concerts/api/concerts'

/**
 * Stats data layer — pure, typed aggregations over a user's shows.
 * Everything is computed from the `ConcertListItem[]` returned by `useConcerts`,
 * so no extra queries are needed. Only *attended* shows count towards stats
 * (planned/wishlist are future, not history).
 */

export function attendedOnly(concerts: ConcertListItem[]): ConcertListItem[] {
  return concerts.filter((c) => c.status === 'attended')
}

export interface SummaryStats {
  shows: number
  countries: number
  spent: MoneyTotal
}

/** Headline numbers for the summary cards (attended only). */
export function summaryStats(concerts: ConcertListItem[]): SummaryStats {
  const attended = attendedOnly(concerts)
  const countries = new Set<string>()
  for (const c of attended) {
    if (c.venue?.country_name) countries.add(c.venue.country_name)
  }
  return {
    shows: attended.length,
    countries: countries.size,
    spent: totalSpent(attended),
  }
}

export interface YearCount {
  year: string
  count: number
}

/** Attended shows per calendar year, oldest → newest. */
export function showsPerYear(concerts: ConcertListItem[]): YearCount[] {
  const map = new Map<string, number>()
  for (const c of attendedOnly(concerts)) {
    const year = c.date.slice(0, 4)
    map.set(year, (map.get(year) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

export interface ArtistCount {
  name: string
  count: number
}

/** Most-seen headliners, highest first. Festivals have no headliner → skipped. */
export function topArtists(concerts: ConcertListItem[], limit = 5): ArtistCount[] {
  const map = new Map<string, { name: string; count: number }>()
  for (const c of attendedOnly(concerts)) {
    const name = c.headliner?.name
    if (!name) continue
    const key = name.toLowerCase()
    const entry = map.get(key)
    if (entry) entry.count += 1
    else map.set(key, { name, count: 1 })
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}

export interface CountryCount {
  country: string
  count: number
}

/** Attended shows grouped by country, highest first. */
export function countriesVisited(
  concerts: ConcertListItem[],
  limit = 5,
): CountryCount[] {
  const map = new Map<string, number>()
  for (const c of attendedOnly(concerts)) {
    const country = c.venue?.country_name
    if (!country) continue
    map.set(country, (map.get(country) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
    .slice(0, limit)
}

export interface MoneyTotal {
  amount: number
  currency: string
}

/**
 * Total ticket spend. Shows can carry different currencies, so we total each
 * currency separately and report the dominant one (highest total) — mixing
 * currencies into a single number would be meaningless.
 */
export function totalSpent(concerts: ConcertListItem[]): MoneyTotal {
  const byCurrency = new Map<string, number>()
  for (const c of attendedOnly(concerts)) {
    if (c.ticket_price_paid == null) continue
    const currency = c.ticket_currency || 'EUR'
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + c.ticket_price_paid)
  }
  let top: MoneyTotal = { amount: 0, currency: 'EUR' }
  for (const [currency, amount] of byCurrency) {
    if (amount > top.amount) top = { amount, currency }
  }
  return top
}

/** Spend per year in the dominant currency — points for the money area chart. */
export function spendingPerYear(concerts: ConcertListItem[]): YearAmount[] {
  const { currency } = totalSpent(concerts)
  const map = new Map<string, number>()
  for (const c of attendedOnly(concerts)) {
    if (c.ticket_price_paid == null) continue
    if ((c.ticket_currency || 'EUR') !== currency) continue
    const year = c.date.slice(0, 4)
    map.set(year, (map.get(year) ?? 0) + c.ticket_price_paid)
  }
  return [...map.entries()]
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

export interface YearAmount {
  year: string
  amount: number
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
  CHF: 'CHF ',
  JPY: '¥',
}

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `
}

/** `€8.4k` / `£420` — compact money for the stat cards. */
export function formatCompactMoney(money: MoneyTotal): string {
  const symbol = currencySymbol(money.currency)
  const n = money.amount
  if (n >= 1000) {
    const k = n / 1000
    return `${symbol}${k >= 10 ? Math.round(k) : k.toFixed(1)}k`
  }
  return `${symbol}${Math.round(n)}`
}

/** `€8,420` — full money with thousands separators. */
export function formatMoney(money: MoneyTotal): string {
  return `${currencySymbol(money.currency)}${Math.round(money.amount).toLocaleString()}`
}
