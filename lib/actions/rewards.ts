'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { requireHome } from '@/lib/data/session'
import { notifyHome } from '@/lib/notify'
import { pointsByUser } from '@/lib/points'
import type { Completion, Reward, RewardClaim } from '@/lib/types'

function revalidate() {
  revalidatePath('/mig/praemier')
  revalidatePath('/hjem')
}

export async function createReward(input: { title: string; emoji?: string; cost: number }): Promise<Reward> {
  const { supabase, user, homeId } = await requireHome()
  const title = input.title.trim()
  if (!title) throw new Error('Præmien skal have et navn')
  const cost = Math.max(1, Math.round(input.cost))
  const { data, error } = await supabase
    .from('rewards')
    .insert({ home_id: homeId, title, emoji: (input.emoji || '🎁').slice(0, 8), cost, created_by: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidate()
  return data as Reward
}

export async function deleteReward(rewardId: string) {
  const { supabase, homeId } = await requireHome()
  const { error } = await supabase.from('rewards').update({ active: false }).eq('id', rewardId).eq('home_id', homeId)
  if (error) throw new Error(error.message)
  revalidate()
}

/** Indløs en præmie – tjekker saldo på serveren (optjent i alt minus tidligere indløst) */
export async function claimReward(rewardId: string): Promise<RewardClaim> {
  const { supabase, user, homeId } = await requireHome()
  const { data: reward } = await supabase.from('rewards').select().eq('id', rewardId).eq('home_id', homeId).eq('active', true).maybeSingle()
  if (!reward) throw new Error('Præmien findes ikke længere')

  const [{ data: completions }, { data: claims }] = await Promise.all([
    supabase.from('preset_completions').select('completed_by, helper_id, helper_ids, points, completed_at').eq('home_id', homeId),
    supabase.from('reward_claims').select('cost').eq('home_id', homeId).eq('user_id', user.id),
  ])
  const earned = pointsByUser((completions ?? []) as Completion[], null)[user.id] ?? 0
  const spent = (claims ?? []).reduce((s, c) => s + c.cost, 0)
  if (earned - spent < reward.cost) throw new Error(`Du har ${earned - spent} point – præmien koster ${reward.cost}`)

  const { data: claim, error } = await supabase
    .from('reward_claims')
    .insert({ home_id: homeId, reward_id: reward.id, user_id: user.id, title: reward.title, cost: reward.cost })
    .select()
    .single()
  if (error) throw new Error(error.message)

  await supabase.from('activity_logs').insert({ home_id: homeId, user_id: user.id, action: 'claimed', task_id: null, task_title: reward.title })

  const { data: profile } = await supabase.from('profiles').select('display_name, avatar_emoji').eq('id', user.id).maybeSingle()
  const name = profile?.display_name || user.email?.split('@')[0] || 'Nogen'
  const userId = user.id
  after(() =>
    notifyHome(
      homeId,
      'task_done',
      { title: `${reward.emoji} ${name} indløste "${reward.title}"`, body: `−${reward.cost} point`, url: '/mig/praemier', tag: `claim-${claim.id}` },
      { exclude: [userId] }
    )
  )

  revalidate()
  return claim as RewardClaim
}
