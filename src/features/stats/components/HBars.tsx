import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface HBarDatum {
  key: string
  label: string
  value: number
  leading?: ReactNode
}

/**
 * Horizontal bar list (name · track · count) — the shared pattern behind
 * "Top artists", "Top venues" and the buddy leaderboard. Bar width scales to
 * the max value; the leader is solid orange with a glow, the rest ramp down.
 */
export function HBars({
  data,
  labelWidth = 110,
  valueWidth = 20,
  className,
}: {
  data: HBarDatum[]
  labelWidth?: number
  valueWidth?: number
  className?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={cn('flex flex-col gap-[11px]', className)}>
      {data.map((d) => {
        const ratio = d.value / max
        const isMax = d.value === max && d.value > 0
        return (
          <div key={d.key} className="flex items-center gap-2.5">
            {d.leading}
            <span
              className="flex-none truncate font-body text-xs text-fg-subtle"
              style={{ width: labelWidth }}
            >
              {d.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-white/[0.06]">
              <div
                className="h-full rounded-[3px]"
                style={{
                  width: `${Math.max(4, Math.round(ratio * 100))}%`,
                  background: isMax
                    ? 'var(--color-orange)'
                    : `rgba(232,117,42,${(0.3 + ratio * 0.4).toFixed(2)})`,
                  boxShadow: isMax ? '0 0 8px rgba(232,117,42,0.4)' : undefined,
                }}
              />
            </div>
            <span
              className={cn(
                'flex-none text-right font-display text-xs font-bold',
                isMax ? 'text-orange' : 'text-fg-muted',
              )}
              style={{ width: valueWidth }}
            >
              {d.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
