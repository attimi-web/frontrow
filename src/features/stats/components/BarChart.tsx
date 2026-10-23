import { cn } from '@/lib/utils/cn'

export interface BarDatum {
  label: string
  value: number
}

/**
 * Vertical bar chart (screen 11 "Shows per year"). CSS bars rather than SVG,
 * to match the prototype exactly: height ∝ value, orange opacity ramps with the
 * value, and the tallest bar is solid orange with a glow.
 */
export function BarChart({
  data,
  height = 70,
  className,
}: {
  data: BarDatum[]
  height?: number
  className?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className={className}>
      <div
        className="flex items-end gap-[5px]"
        style={{ height }}
        role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}
      >
        {data.map((d) => {
          const ratio = d.value / max
          const isMax = d.value === max && d.value > 0
          const barHeight = Math.max(d.value > 0 ? 5 : 2, Math.round(ratio * height))
          return (
            <div
              key={d.label}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: barHeight,
                background: isMax
                  ? 'var(--color-orange)'
                  : `rgba(232,117,42,${(0.12 + ratio * 0.66).toFixed(3)})`,
                boxShadow: isMax ? '0 -4px 12px rgba(232,117,42,0.35)' : undefined,
              }}
            />
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-[5px]">
        {data.map((d) => {
          const isMax = d.value === max && d.value > 0
          return (
            <div key={d.label} className="flex-1 text-center">
              <span
                className={cn(
                  'font-body text-[9px]',
                  isMax ? 'font-semibold text-orange' : 'text-fg-disabled',
                )}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
