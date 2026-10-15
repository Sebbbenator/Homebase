'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { requireHome } from '@/lib/data/session'
import { admin, notifyHome } from '@/lib/notify'
import { pointsByUser, startOfWeek } from '@/lib/points'
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
    .update({ last_completed_at: now, last_completed_by: user.id, preset_status: 'idle', needed_notified_at: null })
    .eq('id', taskId)

  await log(supabase, homeId, user.id, 'completed', task)

  // Notifikationer sendes efter svaret er leveret, så UI'et ikke venter på dem
  const points = task.points ?? 10
  const userId = user.id
  const email = user.email
  after(() => notifyAfterCompletion({ homeId, userId, email, helper, task: { id: task.id, title: task.title }, points, completionId: completion.id }))

  revalidateAll()
  return completion as Completion
}

async function notifyAfterCompletion(args: {
  homeId: string
  userId: string
  email?: string | null
  helper: string | null
  task: { id: string; title: string }
  points: number
  completionId: string
}) {
  const { homeId, userId, email, helper, task, points, completionId } = args
  try {
    const db = admin()
    const { data: profiles } = await db.from('profiles').select('id, display_name, avatar_emoji')
    const names: Record<string, { name: string; emoji: string }> = {}
    for (const p of profiles ?? []) names[p.id] = { name: p.display_name || 'Nogen', emoji: p.avatar_emoji || '✅' }
    const me = names[userId] ?? { name: email?.split('@')[0] || 'Nogen', emoji: '✅' }
    const exclude = [userId, ...(helper ? [helper] : [])]

    const jobs: Promise<unknown>[] = [
      notifyHome(
        homeId,
        'task_done',
        {
          title: `${me.emoji} ${me.name} tog "${task.title}"`,
          body: helper ? `+${points} point til ${me.name} og ${names[helper]?.name ?? 'hjælperen'}` : `+${points} point`,
          url: '/hjem',
          tag: `done-${task.id}`,
        },
        { exclude }
      ),
    ]

    if (helper) {
      jobs.push(
        notifyHome(
          homeId,
          'helper_mention',
          { title: `${me.name} gav dig ${points} point`, body: `For at hjælpe med "${task.title}"`, url: '/hjem', tag: `helper-${completionId}` },
          { only: [helper] }
        )
      )
    }

    // Ny leder på ugens scoretavle?
    const weekStart = startOfWeek()
    const { data: weekRows } = await db
      .from('preset_completions')
      .select()
      .eq('home_id', homeId)
      .gte('completed_at', weekStart.toISOString())
    const week = (weekRows ?? []) as Completion[]
    const leaderOf = (rows: Completion[]) => {
      const pts = pointsByUser(rows, null)
      const sorted = Object.entries(pts).sort((a, b) => b[1] - a[1])
      return sorted.length && sorted[0][1] > 0 ? { id: sorted[0][0], pts: sorted[0][1], all: pts } : null
    }
    const before = leaderOf(week.filter((c) => c.id !== completionId))
    const afterLeader = leaderOf(week)
    if (before && afterLeader && before.id !== afterLeader.id && exclude.includes(afterLeader.id) && !exclude.includes(before.id)) {
      const newLeader = names[afterLeader.id]?.name ?? 'Nogen'
      jobs.push(
        notifyHome(
          homeId,
          'rank_change',
          {
            title: `${newLeader} har overhalet dig 👀`,
            body: `Ugens scoretavle: ${newLeader} ${afterLeader.pts} · dig ${afterLeader.all[before.id] ?? 0}`,
            url: '/hjem',
            tag: 'rank',
          },
          { only: [before.id] }
        )
      )
    }

    await Promise.allSettled(jobs)
  } catch (err) {
    console.error('notifyAfterCompletion fejlede', err)
  }
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
