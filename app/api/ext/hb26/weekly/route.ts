import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

function getWebPush() {
  webpush.setVapidDetails(
    'mailto:homebase@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

// Weekly summary — counts completions per user in the last 7 days
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    // Get completions from last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: completions } = await supabase
      .from('preset_completions')
      .select('completed_by')
      .eq('home_id', homeId)
      .gte('completed_at', weekAgo.toISOString())

    // Count per user
    const counts: Record<string, number> = {}
    for (const c of completions ?? []) {
      counts[c.completed_by] = (counts[c.completed_by] || 0) + 1
    }

    // Get profiles
    const userIds = Object.keys(counts)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_emoji')
      .in('id', userIds.length > 0 ? userIds : ['none'])

    const profileMap: Record<string, { name: string; emoji: string }> = {}
    for (const p of profiles ?? []) {
      profileMap[p.id] = { name: p.display_name || 'Unknown', emoji: p.avatar_emoji || '😀' }
    }

    const totalCompletions = Object.values(counts).reduce((a, b) => a + b, 0)

    let body = ''
    if (totalCompletions === 0) {
      body = 'Ingen opgaver fuldført denne uge 😴'
    } else {
      const lines = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([userId, count]) => {
          const p = profileMap[userId]
          return `${p?.emoji || '😀'} ${p?.name || 'Unknown'}: ${count} opgaver`
        })
      body = `${totalCompletions} opgaver i alt!\n${lines.join('\n')}`
    }

    // Send to everyone
    const wp = getWebPush()
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select()
      .eq('home_id', homeId)

    const payload = JSON.stringify({
      title: '📊 Ugens opsummering',
      body,
      url: '/settings',
      tag: 'weekly-' + Date.now(),
    })

    let sent = 0
    const stale: string[] = []

    await Promise.allSettled(
      (subs ?? []).map(async (sub) => {
        try {
          await wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          sent++
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'statusCode' in err) {
            const statusCode = (err as { statusCode: number }).statusCode
            if (statusCode === 410 || statusCode === 404) stale.push(sub.id)
          }
        }
      })
    )

    if (stale.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', stale)
    }

    return NextResponse.json({ success: true, sent, summary: body })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
