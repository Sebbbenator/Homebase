import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getMondayMidnightCph(): string {
  const now = new Date()
  const todayCph = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Copenhagen' })
  const [y, m, d] = todayCph.split('-').map(Number)
  const todayDate = new Date(`${todayCph}T00:00:00`)
  const dow = todayDate.getDay()
  const daysSinceMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(Date.UTC(y, m - 1, d - daysSinceMonday))
  const mondayCph = monday.toLocaleDateString('en-CA', { timeZone: 'Europe/Copenhagen' })
  return new Date(`${mondayCph}T00:00:00+01:00`).toISOString()
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'No home' }, { status: 404 })

  const since = getMondayMidnightCph()

  const { data: completions } = await supabase
    .from('preset_completions')
    .select('completed_by')
    .eq('home_id', membership.home_id)
    .gte('completed_at', since)

  if (!completions || completions.length === 0) {
    return NextResponse.json({ ranked: [], since })
  }

  const tally: Record<string, number> = {}
  for (const c of completions) {
    tally[c.completed_by] = (tally[c.completed_by] ?? 0) + 1
  }

  const userIds = Object.keys(tally)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji')
    .in('id', userIds)

  const profileMap: Record<string, { name: string; emoji: string }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = {
      name: p.display_name ?? p.id.slice(0, 6),
      emoji: p.avatar_emoji ?? '👤',
    }
  }

  const ranked = Object.entries(tally)
    .sort(([, a], [, b]) => b - a)
    .map(([userId, count], i) => ({
      userId,
      name: profileMap[userId]?.name ?? userId.slice(0, 6),
      emoji: profileMap[userId]?.emoji ?? '👤',
      count,
      rank: i,
    }))

  return NextResponse.json({ ranked, since })
}
