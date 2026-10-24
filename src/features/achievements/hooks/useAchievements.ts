import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { useConcerts } from '@/features/concerts/hooks/useConcerts'
import { getUnlockRates, listAchievements, listMyUnlocks, syncMyUnlocks } from '../api/achievements'
import { computeAchievements, latestUnlocked } from '../logic'

/**
 * Badge states computed from the user's shows, kept in sync with
 * user_achievements. `newIds` = badges earned since the last sync (captured
 * once per mount), used for the unlock celebration.
 */
export function useAchievements() {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const { data: concerts } = useConcerts()

  const catalog = useQuery({ queryKey: ['achievements'], queryFn: listAchievements, staleTime: Infinity })
  const stored = useQuery({
    queryKey: ['my-achievements', userId],
    queryFn: () => listMyUnlocks(userId as string),
    enabled: !!userId,
  })
  const rates = useQuery({ queryKey: ['achievement-rates'], queryFn: getUnlockRates })

  const states = useMemo(
    () => (catalog.data && concerts ? computeAchievements(catalog.data, concerts) : null),
    [catalog.data, concerts],
  )

  const [newIds, setNewIds] = useState<Set<string> | null>(null)
  useEffect(() => {
    if (newIds !== null || !states || !stored.data) return
    const storedIds = new Set(stored.data.map((r) => r.achievement_id))
    setNewIds(
      new Set(states.filter((s) => s.unlocked && !storedIds.has(s.achievement.id)).map((s) => s.achievement.id)),
    )
  }, [states, stored.data, newIds])

  // Same diff twice (StrictMode, refetch race) → one request.
  const lastSync = useRef<string | null>(null)
  useEffect(() => {
    if (!states || !stored.data || !userId) return
    const storedMap = new Map(stored.data.map((r) => [r.achievement_id, r.unlocked_at]))
    const toUpsert = states
      .filter((s) => s.unlocked && storedMap.get(s.achievement.id)?.slice(0, 10) !== s.achievedOn)
      .map((s) => ({ achievement_id: s.achievement.id, unlocked_at: s.achievedOn as string }))
    const earned = new Set(states.filter((s) => s.unlocked).map((s) => s.achievement.id))
    const stale = stored.data.map((r) => r.achievement_id).filter((id) => !earned.has(id))
    if (toUpsert.length === 0 && stale.length === 0) return
    const key = JSON.stringify([toUpsert, stale])
    if (lastSync.current === key) return
    lastSync.current = key
    syncMyUnlocks(userId, toUpsert, stale)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['my-achievements', userId] })
        queryClient.invalidateQueries({ queryKey: ['achievement-rates'] })
      })
      .catch((e) => {
        lastSync.current = null
        console.warn('Achievement sync failed', e)
      })
  }, [states, stored.data, userId, queryClient])

  const unlockedCount = states?.filter((s) => s.unlocked).length ?? 0

  return {
    states,
    isLoading: catalog.isLoading || !concerts,
    unlockedCount,
    total: states?.length ?? 0,
    latest: states ? latestUnlocked(states) : null,
    rates: rates.data,
    newIds,
  }
}
