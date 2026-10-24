import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils/cn'
import { BadgeIcon } from '../components/BadgeIcon'
import { useAchievements } from '../hooks/useAchievements'
import { criterionLabel, type AchievementState } from '../logic'

const SECTION_LABEL =
  'mb-3.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-disabled'

export function Achievements() {
  const navigate = useNavigate()
  const { states, isLoading, unlockedCount, total, latest, rates, newIds } = useAchievements()

  // Unlocked first, then the in-progress "next" badges, then the rest (catalog order inside).
  const grid = useMemo(() => {
    if (!states) return []
    const rank = (s: AchievementState) => (s.unlocked ? 0 : s.inProgress ? 1 : 2)
    return [...states].sort(
      (a, b) => rank(a) - rank(b) || a.achievement.sort_order - b.achievement.sort_order,
    )
  }, [states])

  const celebrate = !!latest && !!newIds?.has(latest.achievement.id)
  useEffect(() => {
    // Browsers block vibrate() before the first user gesture (e.g. after a reload).
    if (celebrate && navigator.userActivation?.hasBeenActive) navigator.vibrate?.([40, 60, 40])
  }, [celebrate])

  const pct = total ? Math.round((unlockedCount / total) * 100) : 0

  return (
    <div className="min-h-dvh bg-app pb-6">
      <div className="flex items-center justify-between px-6 pt-4">
        <div className="-ml-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition hover:bg-white/[0.05]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.5px] text-fg">Achievements</h2>
        </div>
        {total > 0 && (
          <p className="font-body text-[13px] text-orange">
            {unlockedCount} / {total}
          </p>
        )}
      </div>

      <div className="mx-6 mt-2.5">
        <div className="h-[5px] overflow-hidden rounded-[3px] bg-white/[0.06]">
          <div
            className="h-full rounded-[3px] bg-orange shadow-[0_0_8px_rgba(232,117,42,0.4)] transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-orange">
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {latest ? (
            <div className="px-6 pt-4">
              <p className={SECTION_LABEL}>Just Unlocked</p>
              <JustUnlocked state={latest} pct={rates?.get(latest.achievement.id)} celebrate={celebrate} />
            </div>
          ) : (
            <div className="mx-6 mt-4 rounded-2xl border border-dashed border-border-strong p-6 text-center">
              <p className="font-body text-sm text-fg-subtle">Log your first show to unlock your first badge.</p>
            </div>
          )}

          <div className="px-6 pt-4">
            <p className={SECTION_LABEL}>All Badges</p>
            <div className="grid grid-cols-3 gap-2.5">
              {grid.map((s) => (
                <BadgeTile key={s.achievement.id} state={s} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function JustUnlocked({
  state,
  pct,
  celebrate,
}: {
  state: AchievementState
  pct: number | undefined
  celebrate: boolean
}) {
  const { achievement: a } = state
  const rarity = a.rarity.charAt(0).toUpperCase() + a.rarity.slice(1)
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[20px] border border-orange/20 bg-gradient-to-br from-orange/[0.08] to-orange/[0.04] p-5',
        celebrate && 'achievement-burst',
      )}
    >
      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-[18px] border-[1.5px] border-orange/30 bg-orange/10">
        <BadgeIcon type={state.criteria.type} color="#e8752a" size={32} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-extrabold tracking-[-0.3px] text-fg">{a.name}</p>
        <p className="my-1 font-body text-xs leading-[1.4] text-fg-subtle">{a.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-[18px] items-center rounded-[5px] border border-orange/25 bg-orange/15 px-2 font-body text-[9px] font-semibold uppercase tracking-[0.05em] text-orange">
            {rarity}
            {pct != null && ` · ${pct}% of users`}
          </span>
          {state.achievedOn && (
            <span className="font-body text-[10px] text-fg-disabled">
              {format(parseISO(state.achievedOn), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function BadgeTile({ state }: { state: AchievementState }) {
  const { achievement: a, unlocked, inProgress } = state
  return (
    <div
      title={a.description}
      className={cn(
        'relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border px-2.5 py-3.5 text-center',
        unlocked
          ? 'border-orange/20 bg-white/[0.04]'
          : 'border-white/[0.06] bg-white/[0.02]',
        !unlocked && !inProgress && 'opacity-50',
      )}
    >
      {inProgress && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.04]">
          <div className="h-full bg-orange/40" style={{ width: `${Math.round(state.progress * 100)}%` }} />
        </div>
      )}
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-[14px]',
          unlocked ? 'bg-orange/10' : 'bg-white/[0.04]',
        )}
      >
        <BadgeIcon
          type={state.criteria.type}
          color={unlocked ? '#e8752a' : inProgress ? 'rgba(232,117,42,0.4)' : '#6a6882'}
        />
      </div>
      <p
        className={cn(
          'font-body text-[11px] font-semibold leading-[1.2]',
          unlocked ? 'text-fg-muted' : inProgress ? 'text-fg-subtle' : 'text-fg-faint',
        )}
      >
        {a.name}
      </p>
      <p className={cn('font-body text-[9px]', unlocked ? 'text-fg-faint' : 'text-fg-disabled')}>
        {criterionLabel(state)}
      </p>
    </div>
  )
}
