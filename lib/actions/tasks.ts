'use server'

import { revalidatePath } from 'next/cache'
import { requireHome } from '@/lib/data/session'
import { pushToHome } from '@/lib/push-server'
import type { Completion, Task } from '@/lib/types'

export interface TaskInput {
  title: string
  description?: string | null
  category?: string
  points?: number
  interval_days?: number | null
}

function revalidateAll() {
  revalidatePath('/hjem')
  revalidatePath('/opgaver')
  revalidatePath('/mig')
  revalidatePath('/mig/historik')
}

async function log(
  supabase: Awaited<ReturnType<typeof requireHome>>['supabase'],
  homeId: string,
  userId: string,
  action: string,
  task: { id: string | null; title: string | null }
) {
  await supabase.from('activity_logs').insert({
    home_id: homeId,
    user_id: userId,
    action,
    task_id: task.id,
    task_title: task.title,
  })
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { supabase, user, homeId } = await requireHome()
  const title = input.title.trim()
  if (!title) throw new Error('Opgaven skal have en titel')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      home_id: homeId,
      title,
      description: input.description?.trim() || null,
      created_by: user.id,
      is_preset: true,
      preset_status: 'idle',
      points: Math.max(1, Math.round(input.points ?? 10)),
      category: input.category || 'other',
      interval_days: input.interval_days ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  await log(supabase, homeId, user.id, 'created', task)
  revalidateAll()
  return task as Task
}

export async function updateTask(taskId: string, input: Partial<TaskInput>): Promise<Task> {
  const { supabase, user, homeId } = await requireHome()

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.points !== undefined && { points: Math.max(1, Math.round(input.points)) }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.interval_days !== undefined && { interval_days: input.interval_days }),
    })
    .eq('id', taskId)
    .eq('home_id', homeId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  await log(supabase, homeId, user.id, 'updated', task)
  revalidateAll()
  return task as Task
}

export async function deleteTask(taskId: string) {
  const { supabase, user, homeId } = await requireHome()
  const { data: task } = await supabase.from('tasks').select('id, title').eq('id', taskId).eq('home_id', homeId).maybeSingle()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('home_id', homeId)
  if (error) throw new Error(error.message)
  if (task) await log(supabase, homeId, user.id, 'deleted', { id: null, title: task.title })
  revalidateAll()
}

/** "Jeg har gjort det" – uden flag. Giver point til dig (og evt. hjælper). */
export async function completeTask(taskId: string, helperId?: string | null): Promise<Completion> {
  const { supabase, user, homeId } = await requireHome()

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select()
    .eq('id', taskId)
    .eq('home_id', homeId)
    .single()
  if (fetchError || !task) throw new Error('Opgaven blev ikke fundet')

  const helper = helperId && helperId !== user.id ? helperId : null
  const now = new Date().toISOString()

  const { data: completion, error } = await supabase
    .from('preset_completions')
    .insert({
      task_id: taskId,
      home_id: homeId,
      completed_by: user.id,
      helper_id: helper,
      points: task.points ?? 10,
      completed_at: now,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  await supabase
    .from('tasks')
    .update({ last_completed_at: now, last_completed_by: user.id, preset_status: 'idle' })
    .eq('id', taskId)

  await log(supabase, homeId, user.id, 'completed', task)

  // Push til de andre i huset (fejler stille)
  const { data: profile } = await supabase.from('profiles').select('display_name, avatar_emoji').eq('id', user.id).maybeSingle()
  const name = profile?.display_name || user.email?.split('@')[0] || 'Nogen'
  void pushToHome(
    homeId,
    { title: `${profile?.avatar_emoji ?? '✅'} ${name} tog "${task.title}"`, body: `+${task.points ?? 10} point`, url: '/hjem' },
    user.id
  )

  revalidateAll()
  return completion as Completion
}

/** Fortryd en fuldførelse (fx tastet forkert). Genberegner "sidst gjort". */
export async function undoCompletion(completionId: string) {
  const { supabase, user, homeId } = await requireHome()

  const { data: completion } = await supabase
    .from('preset_completions')
    .select()
    .eq('id', completionId)
    .eq('home_id', homeId)
    .maybeSingle()
  if (!completion) return

  const { error } = await supabase.from('preset_completions').delete().eq('id', completionId)
  if (error) throw new Error(error.message)

  const { data: prev } = await supabase
    .from('preset_completions')
    .select('completed_at, completed_by')
    .eq('task_id', completion.task_id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase
    .from('tasks')
    .update({ last_completed_at: prev?.completed_at ?? null, last_completed_by: prev?.completed_by ?? null })
    .eq('id', completion.task_id)

  const { data: task } = await supabase.from('tasks').select('id, title').eq('id', completion.task_id).maybeSingle()
  await log(supabase, homeId, user.id, 'undo', { id: task?.id ?? null, title: task?.title ?? null })

  revalidateAll()
}
