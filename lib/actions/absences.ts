'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { requireHome } from '@/lib/data/session'
import { notifyHome } from '@/lib/notify'
import type { Absence } from '@/lib/types'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function revalidate() {
  revalidatePath('/mig')
  revalidatePath('/hjem')
  revalidatePath('/opgaver')
}

export async function addAbsence(input: { from_date: string; to_date: string; note?: string | null }): Promise<Absence> {
  const { supabase, user, homeId } = await requireHome()
  if (!DATE.test(input.from_date) || !DATE.test(input.to_date)) throw new Error('Vælg datoer')
  if (input.to_date < input.from_date) throw new Error('Slutdato skal være efter startdato')

  const { data, error } = await supabase
    .from('absences')
    .insert({ home_id: homeId, user_id: user.id, from_date: input.from_date, to_date: input.to_date, note: input.note?.trim() || null })
    .select()
    .single()
  if (error) throw new Error(error.message)

  const { data: profile } = await supabase.from('profiles').select('display_name, avatar_emoji').eq('id', user.id).maybeSingle()
  const name = profile?.display_name || user.email?.split('@')[0] || 'Nogen'
  const from = new Date(input.from_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  const to = new Date(input.to_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  const userId = user.id
  after(() =>
    notifyHome(
      homeId,
      'task_done',
      { title: `🏖️ ${name} er væk ${from === to ? from : `${from} – ${to}`}`, body: input.note?.trim() || 'Rotation og påmindelser springer vedkommende over imens', url: '/hjem', tag: `absence-${data.id}` },
      { exclude: [userId] }
    )
  )

  revalidate()
  return data as Absence
}

export async function deleteAbsence(absenceId: string) {
  const { supabase, user } = await requireHome()
  const { error } = await supabase.from('absences').delete().eq('id', absenceId).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidate()
}
