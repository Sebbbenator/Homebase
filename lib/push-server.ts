import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  /** Antal på app-ikonets badge (fx antal opgaver der trænger) */
  badge?: number
  /** Knapper i notifikationen (understøttes på Android/desktop) */
  actions?: { action: string; title: string }[]
  taskId?: string
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

interface Sub { id: string; endpoint: string; p256dh: string; auth: string }

async function send(subs: Sub[], payload: PushPayload): Promise<number> {
  if (!subs.length) return 0
  if (!process.env.VAPID_PRIVATE_KEY) return 0
  const push = wp()
  const body = JSON.stringify({ ...payload, tag: payload.tag ?? `hb-${Date.now()}` })
  const stale: string[] = []
  let sent = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await push.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body)
        sent++
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode
        if (code === 410 || code === 404) stale.push(sub.id)
      }
    })
  )
  if (stale.length) await admin().from('push_subscriptions').delete().in('id', stale)
  return sent
}

/** Push til bestemte brugere. Fejler aldrig højlydt. */
export async function pushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  try {
    if (!userIds.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) return 0
    const { data: subs } = await admin().from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', userIds)
    return send((subs ?? []) as Sub[], payload)
  } catch {
    return 0
  }
}

/** Push til alle i hjemmet (valgfrit undtagen én bruger) – uden hensyn til præferencer. */
export async function pushToHome(homeId: string, payload: PushPayload, excludeUserId?: string): Promise<number> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 0
    let query = admin().from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('home_id', homeId)
    if (excludeUserId) query = query.neq('user_id', excludeUserId)
    const { data: subs } = await query
    return send((subs ?? []) as Sub[], payload)
  } catch {
    return 0
  }
}
