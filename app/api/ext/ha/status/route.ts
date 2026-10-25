import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { compareByFreshness, getFreshness, isActive } from '@/lib/freshness'
import { pointsByUser, startOfWeek } from '@/lib/points'
import { fetchWasteEvents, nextWaste, relativeDay } from '@/lib/waste'
import { nextUp } from '@/lib/rotation'
import type { Absence, Completion, HomeMember, Task } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Home Assistant henter husets status herfra hvert 10. minut. Auth via x-api-key-header
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.IFTTT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Copenhagen' })

    const [homeRes, tasksRes, shopRes, compRes, absRes, membersRes] = await Promise.all([
      supabase.from('homes').select('waste_ics_url').eq('id', homeId).maybeSingle(),
      supabase.from('tasks').select().eq('home_id', homeId),
      supabase.from('shopping_items').select('name, quantity').eq('home_id', homeId).eq('is_purchased', false).order('created_at'),
      supabase.from('preset_completions').select().eq('home_id', homeId),
      supabase.from('absences').select().eq('home_id', homeId).gte('to_date', today),
      supabase.from('home_members').select('user_id').eq('home_id', homeId),
    ])

    const memberIds = (membersRes.data ?? []).map((m) => m.user_id as string)
    const { data: profiles } = memberIds.length
      ? await supabase.from('profiles').select('id, display_name, avatar_emoji').in('id', memberIds)
      : { data: [] }
    const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.display_name || 'Ukendt'
    const emojiOf = (id: string) => profiles?.find((p) => p.id === id)?.avatar_emoji || '😀'

    const now = new Date()
    const tasks = ((tasksRes.data ?? []) as Task[]).filter(isActive).sort((a, b) => compareByFreshness(a, b, now))
    const due = tasks
      .map((t) => ({ t, f: getFreshness(t, now) }))
      .filter(({ f }) => f.state === 'now' || f.state === 'soon')
    const completionsAll = (compRes.data ?? []) as Completion[]
    const absencesAll = (absRes.data ?? []) as Absence[]
    const members = memberIds.map((user_id) => ({ user_id }) as HomeMember)
    // Hvem står på opgaven: fast tildelt, ellers hvis tur det er i rotationen
    const whoOf = (t: Task) => {
      const id = t.assigned_to ?? nextUp(t, completionsAll, members, absencesAll, now)
      return id ? nameOf(id) : null
    }
    const taskList = due.slice(0, 10).map(({ t, f }) => ({
      title: t.title,
      state: f.state,
      label: f.label,
      category: t.category,
      who: whoOf(t),
      last_by: t.last_completed_by ? nameOf(t.last_completed_by) : null,
    }))

    const shopping = (shopRes.data ?? []).map((i) => ({ name: i.name as string, quantity: (i.quantity as string | null) ?? null }))

    const completions = (compRes.data ?? []) as Completion[]
    const week = pointsByUser(completions, startOfWeek())
    const all = pointsByUser(completions, null)
    const score = memberIds
      .map((id) => ({ name: nameOf(id), emoji: emojiOf(id), week: week[id] ?? 0, total: all[id] ?? 0 }))
      .sort((a, b) => b.week - a.week || b.total - a.total)

    let waste: { date: string; when: string; summaries: string[] }[] = []
    const wasteUrl = homeRes.data?.waste_ics_url
    if (wasteUrl) {
      try {
        const events = await fetchWasteEvents(wasteUrl)
        waste = nextWaste(events, today, 3).map((w) => ({ ...w, when: relativeDay(w.date, today) }))
      } catch {
        waste = []
      }
    }

    const absences = ((absRes.data ?? []) as Absence[]).map((a) => ({
      name: nameOf(a.user_id),
      from: a.from_date,
      to: a.to_date,
      note: a.note,
    }))

    return NextResponse.json({
      updated: now.toISOString(),
      shopping: { count: shopping.length, items: shopping.slice(0, 30) },
      tasks: { now: due.filter(({ f }) => f.state === 'now').length, soon: due.filter(({ f }) => f.state === 'soon').length, list: taskList },
      waste,
      score,
      absences,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
