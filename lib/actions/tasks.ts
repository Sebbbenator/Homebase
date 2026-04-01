'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RepeatType, PresetCompletion } from '@/lib/types'
import { addDays, addWeeks, format } from '@/lib/utils'

interface CreateTaskInput {
  title: string
  description?: string
  assigned_to?: string | null
  due_date?: string | null
  repeat_type?: RepeatType
  is_preset?: boolean
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) throw new Error('No home found')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      home_id: membership.home_id,
      title: input.title,
      description: input.description || null,
      assigned_to: input.assigned_to || null,
      due_date: input.due_date || null,
      repeat_type: input.is_preset ? 'none' : (input.repeat_type || 'none'),
      is_preset: input.is_preset || false,
      preset_status: 'idle',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('activity_logs').insert({
    home_id: membership.home_id,
    user_id: user.id,
    action: 'created task',
    task_id: task.id,
    task_title: task.title,
  })

  revalidatePath('/dashboard')
  return task
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select()
    .eq('id', taskId)
    .single()

  if (fetchError || !task) throw new Error('Task not found')

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) throw error

  // Add points (10 per completed task)
  const { data: existing } = await supabase
    .from('user_points')
    .select()
    .eq('home_id', task.home_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('user_points')
      .update({ points: existing.points + 10, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_points')
      .insert({ home_id: task.home_id, user_id: user.id, points: 10 })
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    home_id: task.home_id,
    user_id: user.id,
    action: 'completed task',
    task_id: task.id,
    task_title: task.title,
  })

  // Auto-create next occurrence for repeating tasks
  if (task.repeat_type !== 'none') {
    const daysToAdd =
      task.repeat_type === 'daily' ? 1
        : task.repeat_type === 'weekly' ? 7
        : 14 // biweekly
    const baseDate = task.due_date ? new Date(task.due_date) : new Date()
    const nextDate = format(addDays(baseDate, daysToAdd))

    await supabase.from('tasks').insert({
      home_id: task.home_id,
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      created_by: task.created_by,
      due_date: nextDate,
      repeat_type: task.repeat_type,
    })
  }

  revalidatePath('/dashboard')
}

export async function uncompleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: false, completed_at: null })
    .eq('id', taskId)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function updateTask(taskId: string, input: Partial<CreateTaskInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.assigned_to !== undefined && { assigned_to: input.assigned_to || null }),
      ...(input.due_date !== undefined && { due_date: input.due_date || null }),
      ...(input.repeat_type !== undefined && { repeat_type: input.repeat_type }),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (membership && task) {
    await supabase.from('activity_logs').insert({
      home_id: membership.home_id,
      user_id: user.id,
      action: 'updated task',
      task_id: task.id,
      task_title: task.title,
    })
  }

  revalidatePath('/dashboard')
  return task
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
  revalidatePath('/dashboard')
}

export async function getTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tasks')
    .select()
    .order('created_at', { ascending: false })

  return data ?? []
}

// --- Preset task actions ---

export async function flagPresetNeedsDoing(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .update({ preset_status: 'needs_doing' })
    .eq('id', taskId)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function flagPresetIdle(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .update({ preset_status: 'idle' })
    .eq('id', taskId)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function completePresetTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select()
    .eq('id', taskId)
    .single()

  if (fetchError || !task) throw new Error('Task not found')

  // Record the completion
  const { error: insertError } = await supabase
    .from('preset_completions')
    .insert({
      task_id: taskId,
      home_id: task.home_id,
      completed_by: user.id,
    })

  if (insertError) throw insertError

  // Reset preset back to idle
  await supabase
    .from('tasks')
    .update({ preset_status: 'idle' })
    .eq('id', taskId)

  // Add points
  const { data: existing } = await supabase
    .from('user_points')
    .select()
    .eq('home_id', task.home_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('user_points')
      .update({ points: existing.points + 10, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_points')
      .insert({ home_id: task.home_id, user_id: user.id, points: 10 })
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    home_id: task.home_id,
    user_id: user.id,
    action: 'completed preset task',
    task_id: task.id,
    task_title: task.title,
  })

  revalidatePath('/dashboard')
}

export async function getPresetCompletions(homeId: string): Promise<PresetCompletion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preset_completions')
    .select()
    .eq('home_id', homeId)
    .order('completed_at', { ascending: false })

  return data ?? []
}
