'use server'

import { revalidatePath } from 'next/cache'
import { requireHome } from '@/lib/data/session'
import type { Note } from '@/lib/types'

export interface NoteInput {
  title: string
  body?: string | null
  pinned?: boolean
}

export async function createNote(input: NoteInput): Promise<Note> {
  const { supabase, user, homeId } = await requireHome()
  const title = input.title.trim()
  if (!title) throw new Error('Opslaget skal have en overskrift')
  const { data, error } = await supabase
    .from('notes')
    .insert({ home_id: homeId, title, body: input.body?.trim() || null, pinned: !!input.pinned, created_by: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/mig/tavle')
  return data as Note
}

export async function updateNote(noteId: string, input: Partial<NoteInput>): Promise<Note> {
  const { supabase, homeId } = await requireHome()
  const { data, error } = await supabase
    .from('notes')
    .update({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.body !== undefined && { body: input.body?.trim() || null }),
      ...(input.pinned !== undefined && { pinned: input.pinned }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .eq('home_id', homeId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/mig/tavle')
  return data as Note
}

export async function deleteNote(noteId: string) {
  const { supabase, homeId } = await requireHome()
  const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('home_id', homeId)
  if (error) throw new Error(error.message)
  revalidatePath('/mig/tavle')
}
