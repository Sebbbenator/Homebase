import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

function getWebPush() {
  webpush.setVapidDetails(
    'mailto:homebase@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

/** Returns Monday 00:00:00 Copenhagen time as a UTC ISO string */
function getMondayMidnightCph(): string {
  const now = new Date()

  // Get today's date in Copenhagen as YYYY-MM-DD
  const todayCph = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Copenhagen' })
  const [y, m, d] = todayCph.split('-').map(Number)

  // Find which day of the week it is in Copenhagen (0=Sun, 1=Mon … 6=Sat)
  const todayDate = new Date(`${todayCph}T00:00:00`)
  const dow = todayDate.getDay() // 0 = Sunday

  // Days since Monday (Sunday counts as 6 days after last Monday)
  const daysSinceMonday = dow === 0 ? 6 : dow - 1

  const monday = new Date(Date.UTC(y, m - 1, d - daysSinceMonday))
  // monday is now midnight UTC for that calendar date — convert to Copenhagen midnight
  const mondayCph = monday.toLocaleDateString('en-CA', { timeZone: 'Europe/Copenhagen' })
  return new Date(`${mondayCph}T00:00:00+01:00`).toISOString()
}

function medal(rank: number): string {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return ''
}

function opgave(n: number): string {
  return n === 1 ? '1 opgave' : `${n} opgaver`
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const wp = getWebPush()

  const since = getMondayMidnightCph()

  // Get all homes that have push subscriptions
  const { data: homeSubs } = await supabase
    .from('push_subscriptions')
    .select('home_id')

  const homeIds = [...new Set((homeSubs ?? []).map((s) => s.home_id))]

  let totalSent = 0

  for (const homeId of homeIds) {
    // Count completions this week per user
    const { data: completions } = await supabase
      .from('preset_completions')
      .select('completed_by')
      .eq('home_id', homeId)
      .gte('completed_at', since)

    if (!completions || completions.length === 0) {
      // Still send a nudge if no one did anything
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select()
        .eq('home_id', homeId)

      if (!subs?.length) continue

      const payload = JSON.stringify({
        title: 'Ugentlig opsummering',
        body: 'Ingen opgaver blev udført denne uge 😴 Frisk start på mandag!',
        url: '/dashboard',
        tag: 'weekly-summary',
      })

      await sendToAll(wp, subs, payload)
      continue
    }

    // Tally per user
    const tally: Record<string, number> = {}
    for (const c of completions) {
      tally[c.completed_by] = (tally[c.completed_by] ?? 0) + 1
    }

    // Get display names
    const userIds = Object.keys(tally)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    const nameMap: Record<string, string> = {}
    for (const p of profiles ?? []) {
      nameMap[p.id] = p.display_name ?? p.id.slice(0, 6)
    }

    // Sort by count descending
    const ranked = Object.entries(tally)
      .sort(([, a], [, b]) => b - a)
      .map(([userId, count], i) => ({
        name: nameMap[userId] ?? userId.slice(0, 6),
        count,
        rank: i,
      }))

    // Build summary line e.g. "Sebastian 🥇 5 opgaver, Marie 🥈 3 opgaver"
    const summary = ranked
      .map(({ name, count, rank }) => `${name} ${medal(rank)} ${opgave(count)}`)
      .join(', ')

    const winner = ranked[0]
    const title = `Ugentlig opsummering 🏆`
    const body = `Denne uge: ${summary}`

    // Get all subscriptions for this home
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select()
      .eq('home_id', homeId)

    if (!subs?.length) continue

    const payload = JSON.stringify({ title, body, url: '/settings', tag: 'weekly-summary' })
    totalSent += await sendToAll(wp, subs, payload)
  }

  return NextResponse.json({ ok: true, sent: totalSent })
}

async function sendToAll(
  wp: typeof webpush,
  subs: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  payload: string
): Promise<number> {
  const supabase = createAdminClient()
  let sent = 0
  const stale: string[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'statusCode' in err) {
          const code = (err as { statusCode: number }).statusCode
          if (code === 410 || code === 404) stale.push(sub.id)
        }
      }
    })
  )

  if (stale.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', stale)
  }

  return sent
}

// Also allow GET so cron services that only support GET can call it
export async function GET(req: NextRequest) {
  return POST(req)
}
