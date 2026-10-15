'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_PREFS, type NotificationPrefs } from '@/lib/types'

export async function getMyPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke logget ind')
  const { data } = await supabase.from('notification_prefs').select().eq('user_id', user.id).maybeSingle()
  return { user_id: user.id, ...DEFAULT_PREFS, ...(data ?? {}) }
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export async function updateMyPrefs(patch: Partial<Omit<NotificationPrefs, 'user_id'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke logget ind')

  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'quiet_start' || k === 'quiet_end') {
      if (typeof v === 'string' && TIME.test(v)) clean[k] = v
    } else if (k in DEFAULT_PREFS && typeof v === 'boolean') {
      clean[k] = v
    }
  }

  const { error } = await supabase
    .from('notification_prefs')
    .upsert({ user_id: user.id, ...clean, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/mig/notifikationer')
}
