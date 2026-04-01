import { createClient } from '@/lib/supabase/server'
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

export async function POST(req: NextRequest) {
  const wp = getWebPush()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { homeId, title, body, url } = await req.json()

  // Get all push subscriptions for this home (except the sender)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select()
    .eq('home_id', homeId)
    .neq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const payload = JSON.stringify({ title, body, url, tag: 'preset-' + Date.now() })

  let sent = 0
  const stale: string[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
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
        // 410 Gone or 404 = subscription expired, clean it up
        if (err && typeof err === 'object' && 'statusCode' in err) {
          const statusCode = (err as { statusCode: number }).statusCode
          if (statusCode === 410 || statusCode === 404) {
            stale.push(sub.id)
          }
        }
      }
    })
  )

  // Clean up expired subscriptions
  if (stale.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', stale)
  }

  return NextResponse.json({ sent })
}
