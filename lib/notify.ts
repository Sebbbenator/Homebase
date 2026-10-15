import { createClient } from '@supabase/supabase-js'
import { pushToUsers, type PushPayload } from '@/lib/push-server'
import { DEFAULT_PREFS, type NotificationPrefs, type PrefKey } from '@/lib/types'

export const TIMEZONE = 'Europe/Copenhagen'

export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export interface LocalTime {
  hour: number
  minute: number
  /** 0 = søndag … 6 = lørdag */
  weekday: number
  /** YYYY-MM-DD i dansk tid */
  dateKey: string
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function localTime(d = new Date(), tz = TIMEZONE): LocalTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    hour: parseInt(get('hour')),
    minute: parseInt(get('minute')),
    weekday: WEEKDAYS[get('weekday')] ?? 0,
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
  }
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n))
  return (h || 0) * 60 + (m || 0)
}

/** Er vi inde i brugerens stille timer? Håndterer vinduer hen over midnat. */
export function isQuiet(prefs: Pick<NotificationPrefs, 'quiet_start' | 'quiet_end'>, t: LocalTime) {
  const now = t.hour * 60 + t.minute
  const start = toMinutes(prefs.quiet_start)
  const end = toMinutes(prefs.quiet_end)
  if (start === end) return false
  return start < end ? now >= start && now < end : now >= start || now < end
}

/** Præferencer for alle medlemmer i et hjem (standardværdier hvor der ikke er gemt noget) */
export async function getHomePrefs(homeId: string): Promise<Record<string, NotificationPrefs>> {
  const supabase = admin()
  const { data: members } = await supabase.from('home_members').select('user_id').eq('home_id', homeId)
  const ids = (members ?? []).map((m) => m.user_id)
  const { data: rows } = ids.length ? await supabase.from('notification_prefs').select().in('user_id', ids) : { data: [] }
  const map: Record<string, NotificationPrefs> = {}
  for (const id of ids) map[id] = { user_id: id, ...DEFAULT_PREFS }
  for (const r of rows ?? []) map[r.user_id] = { ...map[r.user_id], ...r }
  return map
}

interface NotifyOptions {
  exclude?: string[]
  only?: string[]
  /** Send også i stille timer (bruges ikke til noget i dag, men kan slås til for akutte ting) */
  ignoreQuiet?: boolean
  now?: Date
}

/**
 * Send til medlemmer i hjemmet der har `pref` slået til og ikke er i stille timer.
 * Returnerer de bruger-id'er der faktisk fik besked (0 subs tæller stadig som "forsøgt").
 */
export async function notifyHome(homeId: string, pref: PrefKey, payload: PushPayload, opts: NotifyOptions = {}): Promise<string[]> {
  try {
    const prefs = await getHomePrefs(homeId)
    const t = localTime(opts.now)
    const recipients = Object.values(prefs)
      .filter((p) => p[pref])
      .filter((p) => !opts.exclude?.includes(p.user_id))
      .filter((p) => !opts.only || opts.only.includes(p.user_id))
      .filter((p) => opts.ignoreQuiet || !isQuiet(p, t))
      .map((p) => p.user_id)
    if (recipients.length) await pushToUsers(recipients, payload)
    return recipients
  } catch {
    return []
  }
}
