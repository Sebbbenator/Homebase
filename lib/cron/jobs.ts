import { admin, getHomePrefs, isQuiet, localTime, notifyHome } from '@/lib/notify'
import { getFreshness } from '@/lib/freshness'
import { startOfWeek, weeklyStreak } from '@/lib/points'
import { buildWeeklyText } from '@/lib/scoreboard'
import { pushToUsers } from '@/lib/push-server'
import type { Completion, ShoppingItem, Task } from '@/lib/types'

type TaskRow = Task & { needed_notified_at: string | null }
type Result = Record<string, number>

/** Kører alle planlagte notifikationer for alle hjem. Idempotent pr. dag via cron_runs. */
export async function runTick(now = new Date()): Promise<Record<string, Result>> {
  const supabase = admin()
  const { data: homes } = await supabase.from('homes').select('id')
  const out: Record<string, Result> = {}
  for (const home of homes ?? []) {
    try {
      out[home.id] = await runHome(home.id, now)
    } catch (err) {
      out[home.id] = { error: 1 }
      console.error('cron: hjem fejlede', home.id, err)
    }
  }
  return out
}

function listTitles(titles: string[], max = 4) {
  const shown = titles.slice(0, max).join(', ')
  const rest = titles.length - max
  return rest > 0 ? `${shown} og ${rest} ${rest === 1 ? 'mere' : 'mere'}` : shown
}

async function runHome(homeId: string, now: Date): Promise<Result> {
  const supabase = admin()
  const t = localTime(now)
  const result: Result = {}

  const since = new Date(now.getTime() - 60 * 86_400_000).toISOString()
  const [{ data: tasksRaw }, { data: completionsRaw }, { data: runs }, { data: profileRows }, { data: members }] = await Promise.all([
    supabase.from('tasks').select().eq('home_id', homeId).eq('is_preset', true),
    supabase.from('preset_completions').select().eq('home_id', homeId).gte('completed_at', since),
    supabase.from('cron_runs').select('job').eq('home_id', homeId).eq('run_date', t.dateKey),
    supabase.from('profiles').select('id, display_name, avatar_emoji'),
    supabase.from('home_members').select('user_id').eq('home_id', homeId),
  ])

  const tasks = (tasksRaw ?? []) as TaskRow[]
  const completions = (completionsRaw ?? []) as Completion[]
  const memberIds = (members ?? []).map((m) => m.user_id)
  const names: Record<string, string> = {}
  for (const p of profileRows ?? []) names[p.id] = p.display_name || 'Nogen'

  const ran = new Set((runs ?? []).map((r) => r.job))
  async function once(job: string, fn: () => Promise<void>) {
    if (ran.has(job)) return
    ran.add(job)
    await supabase.from('cron_runs').insert({ home_id: homeId, job, run_date: t.dateKey })
    await fn()
  }

  const prefs = await getHomePrefs(homeId)
  const needing = tasks
    .map((task) => ({ task, fresh: getFreshness(task, now) }))
    .filter((x) => x.fresh.state === 'now')
    .sort((a, b) => b.fresh.ratio - a.fresh.ratio)
  const badge = needing.length

  // 1. "Opgaven trænger" – én gang pr. cyklus, sendes uden for stille timer
  const fresh = needing.filter(
    (x) => !x.task.needed_notified_at || (x.task.last_completed_at && x.task.needed_notified_at < x.task.last_completed_at)
  )
  if (fresh.length) {
    const recipients = Object.values(prefs).filter((p) => p.task_needed && !isQuiet(p, t)).map((p) => p.user_id)
    if (recipients.length) {
      const payload =
        fresh.length === 1
          ? {
              title: `${fresh[0].task.title} trænger`,
              body: `${fresh[0].fresh.label} · +${fresh[0].task.points} point til den der tager den`,
              url: `/opgaver?task=${fresh[0].task.id}`,
              taskId: fresh[0].task.id,
              badge,
              tag: `needed-${fresh[0].task.id}`,
              actions: [{ action: 'open', title: 'Åbn opgave' }],
            }
          : {
              title: `${fresh.length} opgaver trænger`,
              body: listTitles(fresh.map((x) => x.task.title)),
              url: '/opgaver',
              badge,
              tag: 'needed-many',
            }
      await pushToUsers(recipients, payload)
      await supabase.from('tasks').update({ needed_notified_at: now.toISOString() }).in('id', fresh.map((x) => x.task.id))
      result.needed = fresh.length
    }
  }

  // 2. Morgenbriefing (fra kl. 7 – kun hvis noget trænger)
  if (t.hour >= 7 && t.hour < 12 && needing.length) {
    await once('morning', async () => {
      const n = needing.length
      const sent = await notifyHome(
        homeId,
        'morning_brief',
        {
          title: `Godmorgen – ${n} ${n === 1 ? 'ting' : 'ting'} trænger i dag`,
          body: listTitles(needing.map((x) => x.task.title)),
          url: '/hjem',
          badge,
          tag: 'morning',
        },
        { now, ignoreQuiet: true }
      )
      result.morning = sent.length
    })
  }

  // 3. Aftenpåmindelse (fra kl. 18 – opgaver der er mindst 1 dag over)
  const overdue = needing.filter((x) => x.fresh.daysOver >= 1 || x.fresh.neverDone)
  if (t.hour >= 18 && overdue.length) {
    await once('evening', async () => {
      const sent = await notifyHome(
        homeId,
        'evening_reminder',
        {
          title: overdue.length === 1 ? 'Stadig ikke gjort' : `${overdue.length} ting er stadig ikke gjort`,
          body: listTitles(overdue.map((x) => `${x.task.title} (+${x.task.points})`)),
          url: '/opgaver?filter=now',
          badge,
          tag: 'evening',
        },
        { now }
      )
      result.evening = sent.length
    })
  }

  // 4. Streak-advarsel (søndag fra kl. 11 – stimen ryger hvis ugen ender uden fuldførelse)
  if (t.weekday === 0 && t.hour >= 11) {
    await once('streak', async () => {
      const weekStart = startOfWeek(now).getTime()
      let sent = 0
      for (const id of memberIds) {
        const doneThisWeek = completions.some(
          (c) => (c.completed_by === id || c.helper_id === id) && new Date(c.completed_at).getTime() >= weekStart
        )
        const streak = weeklyStreak(completions, id, now)
        if (doneThisWeek || streak < 1) continue
        const r = await notifyHome(
          homeId,
          'streak_warning',
          {
            title: `Din stime på ${streak} ${streak === 1 ? 'uge' : 'uger'} ryger i aften`,
            body: needing[0] ? `Tag fx "${needing[0].task.title}" (+${needing[0].task.points}) og hold den kørende.` : 'Én opgave i dag, og den lever videre.',
            url: '/opgaver',
            tag: 'streak',
          },
          { only: [id], now }
        )
        sent += r.length
      }
      result.streak = sent
    })
  }

  // 5. Ugens opsummering (søndag fra kl. 18)
  if (t.weekday === 0 && t.hour >= 18) {
    await once('weekly', async () => {
      const body = await buildWeeklyText(homeId)
      const sent = await notifyHome(homeId, 'weekly_summary', { title: '📊 Ugens opsummering', body, url: '/hjem', tag: 'weekly' }, { now, ignoreQuiet: true })
      result.weekly = sent.length
    })
  }

  // 6. Indkøb: samlet besked om nye varer (mindst 3 min gamle, ikke tidligere sendt)
  const cutoff = new Date(now.getTime() - 3 * 60_000).toISOString()
  const { data: newItems } = await supabase
    .from('shopping_items')
    .select()
    .eq('home_id', homeId)
    .is('notified_at', null)
    .eq('is_purchased', false)
    .lt('created_at', cutoff)
  const grouped = new Map<string, ShoppingItem[]>()
  for (const item of (newItems ?? []) as ShoppingItem[]) {
    grouped.set(item.added_by, [...(grouped.get(item.added_by) ?? []), item])
  }
  if (grouped.size) {
    let sent = 0
    for (const [adder, items] of grouped) {
      const r = await notifyHome(
        homeId,
        'shopping',
        {
          title: `${names[adder] ?? 'Nogen'} tilføjede ${items.length} ${items.length === 1 ? 'vare' : 'varer'}`,
          body: listTitles(items.map((i) => (i.quantity ? `${i.name} (${i.quantity})` : i.name)), 5),
          url: '/indkoeb',
          tag: 'shopping-added',
        },
        { exclude: [adder], now }
      )
      sent += r.length
    }
    await supabase.from('shopping_items').update({ notified_at: now.toISOString() }).in('id', (newItems ?? []).map((i) => i.id))
    result.shopping = sent
  }

  // 7. Fredagsindkøb (fra kl. 14, hvis listen er lang)
  if (t.weekday === 5 && t.hour >= 14) {
    await once('friday', async () => {
      const { count } = await supabase.from('shopping_items').select('*', { count: 'exact', head: true }).eq('home_id', homeId).eq('is_purchased', false)
      if ((count ?? 0) < 5) return
      const sent = await notifyHome(
        homeId,
        'shopping',
        { title: `${count} varer på indkøbslisten`, body: 'Hvem handler i weekenden?', url: '/indkoeb', tag: 'friday' },
        { now }
      )
      result.friday = sent.length
    })
  }

  return result
}
