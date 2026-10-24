import type { ConcertListItem } from '@/features/concerts/api/concerts'
import type { Tables } from '@/types/database'

/**
 * Achievements engine — pure. Replays the user's attended shows in date order,
 * tracking every metric the catalog (0013) can ask for, and records the date
 * each badge's threshold was first reached. That date becomes `unlocked_at`.
 */

export type Achievement = Tables<'achievements'>

export type MetricType =
  | 'shows'
  | 'countries'
  | 'cities'
  | 'venues'
  | 'artists'
  | 'festivals'
  | 'same_artist'
  | 'shows_in_year'
  | 'festivals_in_year'
  | 'streak_days'
  | 'tour_shows'
  | 'press'

export interface Criteria {
  type: MetricType
  threshold: number
}

export interface AchievementState {
  achievement: Achievement
  criteria: Criteria
  value: number
  progress: number // 0–1
  unlocked: boolean
  /** yyyy-MM-dd of the show that reached the threshold. */
  achievedOn: string | null
  /** The next locked badge of its family (shown with a progress bar). */
  inProgress: boolean
}

export function criteriaOf(a: Achievement): Criteria | null {
  const c = a.criteria as { type?: string; threshold?: number } | null
  if (!c?.type || typeof c.threshold !== 'number') return null
  return { type: c.type as MetricType, threshold: c.threshold }
}

const DAY_MS = 86_400_000

function maxOf(map: Map<string, number>): number {
  let max = 0
  for (const v of map.values()) if (v > max) max = v
  return max
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

export function computeAchievements(
  catalog: Achievement[],
  concerts: ConcertListItem[],
): AchievementState[] {
  const shows = concerts
    .filter((c) => c.status === 'attended')
    .sort((a, b) => a.date.localeCompare(b.date))

  const countries = new Set<string>()
  const cities = new Set<string>()
  const venues = new Set<string>()
  const artists = new Map<string, number>()
  const perYear = new Map<string, number>()
  const festPerYear = new Map<string, number>()
  const tours = new Map<string, number>()
  let festivals = 0
  let press = 0
  let prevDay: number | null = null
  let streak = 0
  let bestStreak = 0

  const values: Record<MetricType, number> = {
    shows: 0,
    countries: 0,
    cities: 0,
    venues: 0,
    artists: 0,
    festivals: 0,
    same_artist: 0,
    shows_in_year: 0,
    festivals_in_year: 0,
    streak_days: 0,
    tour_shows: 0,
    press: 0,
  }

  const items = catalog
    .map((a) => ({ a, c: criteriaOf(a) }))
    .filter((x): x is { a: Achievement; c: Criteria } => x.c !== null)
  const reachedOn = new Map<string, string>()

  shows.forEach((s, i) => {
    const year = s.date.slice(0, 4)
    const v = s.venue
    if (v) {
      countries.add(v.country)
      cities.add(`${v.city.toLowerCase()}|${v.country}`)
      venues.add(`${v.name.toLowerCase()}|${v.city.toLowerCase()}|${v.country}`)
    }
    if (s.headliner_id) bump(artists, s.headliner_id)
    if (s.type === 'festival') {
      festivals++
      bump(festPerYear, year)
    }
    if (s.tour_id) bump(tours, s.tour_id)
    if (s.accred_type) press++
    bump(perYear, year)

    const day = Date.parse(`${s.date}T00:00:00Z`) / DAY_MS
    if (day !== prevDay) {
      streak = prevDay !== null && day - prevDay === 1 ? streak + 1 : 1
      prevDay = day
      bestStreak = Math.max(bestStreak, streak)
    }

    values.shows = i + 1
    values.countries = countries.size
    values.cities = cities.size
    values.venues = venues.size
    values.artists = artists.size
    values.festivals = festivals
    values.same_artist = maxOf(artists)
    values.shows_in_year = maxOf(perYear)
    values.festivals_in_year = maxOf(festPerYear)
    values.streak_days = bestStreak
    values.tour_shows = maxOf(tours)
    values.press = press

    for (const { a, c } of items) {
      if (!reachedOn.has(a.id) && values[c.type] >= c.threshold) reachedOn.set(a.id, s.date)
    }
  })

  const states: AchievementState[] = items.map(({ a, c }) => {
    const value = values[c.type] ?? 0
    const unlocked = reachedOn.has(a.id)
    return {
      achievement: a,
      criteria: c,
      value,
      progress: unlocked ? 1 : Math.min(1, value / c.threshold),
      unlocked,
      achievedOn: reachedOn.get(a.id) ?? null,
      inProgress: false,
    }
  })

  // The lowest locked threshold of each family is "in progress" (if started).
  const nextOfFamily = new Map<MetricType, AchievementState>()
  for (const st of states) {
    if (st.unlocked) continue
    const cur = nextOfFamily.get(st.criteria.type)
    if (!cur || st.criteria.threshold < cur.criteria.threshold) nextOfFamily.set(st.criteria.type, st)
  }
  for (const st of nextOfFamily.values()) st.inProgress = st.value > 0

  return states
}

/** Most recently unlocked badge (ties → rarer/higher threshold first). */
export function latestUnlocked(states: AchievementState[]): AchievementState | null {
  let best: AchievementState | null = null
  for (const st of states) {
    if (!st.unlocked || !st.achievedOn) continue
    if (
      !best ||
      st.achievedOn > (best.achievedOn as string) ||
      (st.achievedOn === best.achievedOn && st.achievement.sort_order > best.achievement.sort_order)
    ) {
      best = st
    }
  }
  return best
}

/** Short criterion label for a tile: "5 countries", "2 / 3 festivals". */
export function criterionLabel(st: AchievementState): string {
  const { type, threshold } = st.criteria
  const unit: Record<MetricType, [string, string]> = {
    shows: ['show', 'shows'],
    countries: ['country', 'countries'],
    cities: ['city', 'cities'],
    venues: ['venue', 'venues'],
    artists: ['artist', 'artists'],
    festivals: ['festival', 'festivals'],
    same_artist: ['× same artist', '× same artist'],
    shows_in_year: ['show in a year', 'shows in a year'],
    festivals_in_year: ['festival in a year', 'festivals in a year'],
    streak_days: ['day in a row', 'days in a row'],
    tour_shows: ['date of one tour', 'dates of one tour'],
    press: ['accred. show', 'accred. shows'],
  }
  const [one, many] = unit[type]
  const noun = threshold === 1 ? one : many
  const sep = type === 'same_artist' ? '' : ' '
  if (st.inProgress) return `${Math.min(st.value, threshold)} / ${threshold}${sep}${noun}`
  if (type === 'same_artist') return `${threshold}${noun}`
  return `${threshold} ${noun}`
}
