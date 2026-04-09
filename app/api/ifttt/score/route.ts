import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

function getWebPush() {
  webpush.setVapidDetails(
    'mailto:homebase@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

// "Hey Google, activate score" → sends leaderboard as push notification to everyone
export async function POST(req: NextRequest) {
  try {
    const apiKey =
      req.headers.get('x-api-key') ||
      req.nextUrl.searchParams.get('key')

    if (!apiKey || apiKey !== process.env.IFTTT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) {
      return NextResponse.json({ error: 'Home not configured' }, { status: 500 })
    }

    // Get leaderboard
    const { data: points } = await supabase
      .from('user_points')
      .select('user_id, points')
      .eq('home_id', homeId)
      .order('points', { ascending: false })

    // Get profiles for display names
    const userIds = (points ?? []).map((p) => p.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_emoji')
      .in('id', userIds)

    const profileMap: Record<string, { name: string; emoji: string }> = {}
    for (const p of profiles ?? []) {
      profileMap[p.id] = {
        name: p.display_name || 'Unknown',
        emoji: p.avatar_emoji || '😀',
      }
    }

    // Build leaderboard text
    let body = ''
    if (!points || points.length === 0) {
      body = 'Ingen points endnu!'
    } else {
      body = (points ?? [])
        .map((p, i) => {
          const profile = profileMap[p.user_id]
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
          return `${medal} ${profile?.emoji || ''} ${profile?.name || 'Unknown'}: ${p.points} pts`
        })
        .join('\n')
    }

    // Send push to ALL members
    const wp = getWebPush()
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select()
      .eq('home_id', homeId)

    const payload = JSON.stringify({
      title: '🏆 Scoreboard',
      body,
      url: '/settings',
      tag: 'score-' + Date.now(),
    })

    let sent = 0
    const stale: string[] = []

    await Promise.allSettled(
      (subs ?? []).map(async (sub) => {
        try {
          await wp.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
          sent++
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'statusCode' in err) {
            const statusCode = (err as { statusCode: number }).statusCode
            if (statusCode === 410 || statusCode === 404) {
              stale.push(sub.id)
            }
          }
        }
      })
    )

    if (stale.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', stale)
    }

    return NextResponse.json({ success: true, sent, leaderboard: body })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
