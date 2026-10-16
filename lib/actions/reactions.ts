'use server'

import { after } from 'next/server'
import { requireHome } from '@/lib/data/session'
import { notifyHome } from '@/lib/notify'
import type { Reaction } from '@/lib/types'

/** Slå 👏 til/fra på en fuldførelse. Returnerer den nye reaktion eller null hvis fjernet. */
export async function toggleReaction(completionId: string, emoji = '👏'): Promise<Reaction | null> {
  const { supabase, user, homeId } = await requireHome()

  const { data: existing } = await supabase
    .from('completion_reactions')
    .select('id')
    .eq('completion_id', completionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('completion_reactions').delete().eq('id', existing.id)
    return null
  }

  const { data: completion } = await supabase
    .from('preset_completions')
    .select('completed_by, task_id')
    .eq('id', completionId)
    .eq('home_id', homeId)
    .maybeSingle()
  if (!completion) throw new Error('Fuldførelsen findes ikke')

  const { data, error } = await supabase
    .from('completion_reactions')
    .insert({ completion_id: completionId, home_id: homeId, user_id: user.id, emoji: emoji.slice(0, 8) })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (completion.completed_by !== user.id) {
    const [{ data: profile }, { data: task }] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
      supabase.from('tasks').select('title').eq('id', completion.task_id).maybeSingle(),
    ])
    const name = profile?.display_name || user.email?.split('@')[0] || 'Nogen'
    const target = completion.completed_by
    after(() =>
      notifyHome(
        homeId,
        'reactions',
        { title: `${emoji} ${name} klappede af dig`, body: task ? `For "${task.title}"` : 'For din indsats', url: '/hjem', tag: `react-${completionId}` },
        { only: [target] }
      )
    )
  }

  return data as Reaction
}
