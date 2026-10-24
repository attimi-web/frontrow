import { supabase } from '@/lib/supabase'
import type { Achievement } from '../logic'

export interface StoredUnlock {
  achievement_id: string
  unlocked_at: string | null
}

export async function listAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase.from('achievements').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function listMyUnlocks(userId: string): Promise<StoredUnlock[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)
    .not('unlocked_at', 'is', null)
  if (error) throw error
  return data ?? []
}

/** Make user_achievements match the computed unlocks: upsert new/changed
 *  ones, delete those no longer earned (e.g. after deleting shows). */
export async function syncMyUnlocks(
  userId: string,
  unlocked: { achievement_id: string; unlocked_at: string }[],
  stale: string[],
): Promise<void> {
  if (unlocked.length > 0) {
    const { error } = await supabase.from('user_achievements').upsert(
      unlocked.map((u) => ({ user_id: userId, ...u, progress: 1 })),
      { onConflict: 'user_id,achievement_id' },
    )
    if (error) throw error
  }
  if (stale.length > 0) {
    const { error } = await supabase
      .from('user_achievements')
      .delete()
      .eq('user_id', userId)
      .in('achievement_id', stale)
    if (error) throw error
  }
}

/** % of users who unlocked each badge, keyed by achievement id. */
export async function getUnlockRates(): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc('achievement_unlock_rates')
  if (error) throw error
  return new Map((data ?? []).map((r) => [r.achievement_id, Number(r.pct)]))
}
