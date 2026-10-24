import type { MetricType } from '../logic'

/** Stroke icon per badge family (shapes from the screen-21 handoff where present). */
export function BadgeIcon({ type, color, size = 22 }: { type: MetricType; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let body: React.ReactNode
  switch (type) {
    case 'shows':
      body = (
        <>
          <circle cx="12" cy="8" r="6" {...p} />
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" {...p} />
        </>
      )
      break
    case 'countries':
      body = (
        <>
          <circle cx="12" cy="12" r="10" {...p} />
          <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" {...p} />
        </>
      )
      break
    case 'festivals':
      body = (
        <>
          <path d="M9 18V5l12-2v13" {...p} />
          <circle cx="6" cy="18" r="3" {...p} />
          <circle cx="18" cy="16" r="3" {...p} />
        </>
      )
      break
    case 'shows_in_year':
    case 'festivals_in_year':
      body = (
        <>
          <circle cx="12" cy="12" r="10" {...p} />
          <path d="M12 8v4l3 3" {...p} />
        </>
      )
      break
    case 'same_artist':
      body = (
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 000-7.78z"
          {...p}
        />
      )
      break
    case 'press':
      body = (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" {...p} />
          <path d="M3 9h18M9 21V9" {...p} />
        </>
      )
      break
    case 'cities':
      body = (
        <>
          <path d="M12 22s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" {...p} />
          <circle cx="12" cy="10" r="2.5" {...p} />
        </>
      )
      break
    case 'venues':
      body = (
        <>
          <path d="M3 21h18M5 21V10l7-5 7 5v11" {...p} />
          <path d="M10 21v-5h4v5" {...p} />
        </>
      )
      break
    case 'artists':
      body = (
        <>
          <rect x="9" y="2" width="6" height="12" rx="3" {...p} />
          <path d="M5 11a7 7 0 0014 0M12 18v4" {...p} />
        </>
      )
      break
    case 'streak_days':
      body = <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...p} />
      break
    case 'tour_shows':
      body = <path d="M4 22V4h12l-2 4 2 4H4" {...p} />
      break
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {body}
    </svg>
  )
}
