import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function wp() {
  webpush.setVapidDetails(
    'mailto:homebase@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

/** Sender push til alle i hjemmet (valgfrit undtagen én bruger). Fejler aldrig højlydt. */
export async function pushToHome(homeId: string, payload: PushPayload, excludeUserId?: string): Promise<number> {
  try {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return 0
    const supabase = admin()
    let query = supabase.from('push_subscriptions').select().eq('home_id', homeId)
    if (excludeUserId) query = query.neq('user_id', excludeUserId)
    const { data: subs } = await query
    if (!subs?.length) return 0

    const push = wp()
    const body = JSON.stringify({ ...payload, tag: payload.tag ?? `hb-${Date.now()}` })
    const stale: string[] = []
    let sent = 0

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await push.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body
          )
          sent++
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode
          if (code === 410 || code === 404) stale.push(sub.id)
        }
      })
    )
    if (stale.length) await supabase.from('push_subscriptions').delete().in('id', stale)
    return sent
  } catch {
    return 0
  }
}
