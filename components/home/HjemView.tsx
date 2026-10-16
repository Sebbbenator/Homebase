'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Flame, ChevronRight, Gift, Recycle, Palmtree } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Confetti } from '@/components/ui/Confetti'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Leaderboard } from './Leaderboard'
import { WeeklySummarySheet } from './WeeklySummarySheet'
import { ReactionButton } from './ReactionButton'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { useRealtimeCompletions } from '@/lib/hooks/useRealtimeCompletions'
import { useTaskActions } from '@/lib/hooks/useTaskActions'
import { deleteTask, reopenTask } from '@/lib/actions/tasks'
import { useToast } from '@/components/ui/Toast'
import { compareByFreshness, getFreshness, isActive, FRESH_STYLE } from '@/lib/freshness'
import { helpersOf, pointsByUser, rankOf, startOfWeek, weeklyStreak } from '@/lib/points'
import { dateKey, nextUp, upcomingAbsences } from '@/lib/rotation'
import { relativeDay } from '@/lib/waste'
import { cn, displayName, formatDate, formatRelative, getGreeting } from '@/lib/utils'
import type { HomeData } from '@/lib/data/home'
import type { Task } from '@/lib/types'

interface HjemViewProps {
  data: HomeData
  waste?: { date: string; summaries: string[] }[]
}

export function HjemView({ data, waste = [] }: HjemViewProps) {
  const [tasks, setTasks] = useRealtimeTasks(data.homeId, data.tasks)
  const [completions, setCompletions] = useRealtimeCompletions(data.homeId, data.completions)
  const { complete } = useTaskActions({ currentUserId: data.userId, setTasks, setCompletions })
  const toast = useToast()

  const [openId, setOpenId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [justDone, setJustDone] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)

  const now = useMemo(() => new Date(), [])
  const today = dateKey(now)
  const me = data.profiles[data.userId]
  const myName = displayName(me, data.userEmail)

  const active = useMemo(() => tasks.filter(isActive), [tasks])
  const sorted = useMemo(() => [...active].sort((a, b) => compareByFreshness(a, b, now)), [active, now])
  const needsNow = sorted.filter((t) => getFreshness(t, now).state === 'now')
  const soon = sorted.filter((t) => getFreshness(t, now).state === 'soon').slice(0, 4)

  const turns = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const t of tasks) if (t.rotation) map[t.id] = nextUp(t, completions, data.members, data.absences, now)
    return map
  }, [tasks, completions, data.members, data.absences, now])

  const memberIds = data.members.map((m) => m.user_id)
  const weekPoints = pointsByUser(completions, startOfWeek(now))
  const { rank, total, sorted: ranking } = rankOf(weekPoints, data.userId, memberIds)
  const myWeek = weekPoints[data.userId] ?? 0
  const streak = weeklyStreak(completions, data.userId, now)
  const earnedAll = pointsByUser(completions, null)[data.userId] ?? 0
  const spent = data.claims.filter((c) => c.user_id === data.userId).reduce((s, c) => s + c.cost, 0)
  const balance = earnedAll - spent

  const absences = useMemo(() => upcomingAbsences(data.absences, today), [data.absences, today])

  const hint = useMemo(() => {
    const leader = ranking[0]
    if (!leader) return null
    if (leader.id === data.userId) {
      const runnerUp = ranking[1]
      if (!runnerUp || myWeek === 0) return 'Ugen er lige begyndt – første opgave sætter dig i front.'
      const gap = myWeek - runnerUp.pts
      return gap === 0 ? `Du deler førstepladsen med ${displayName(data.profiles[runnerUp.id])}.` : `Du fører med ${gap} point. Hold fast!`
    }
    const gap = leader.pts - myWeek
    const myTurnTask = needsNow.find((t) => turns[t.id] === data.userId)
    const suggestion = myTurnTask ?? needsNow[0] ?? soon[0]
    if (!suggestion) return `Du er ${gap} point efter ${displayName(data.profiles[leader.id])}.`
    const verb = suggestion.points > gap ? 'så fører du' : suggestion.points === gap ? 'så er I lige' : 'så haler du ind'
    return `Du er ${gap} point efter ${displayName(data.profiles[leader.id])}. Tag "${suggestion.title}" (+${suggestion.points}), ${verb}.`
  }, [ranking, myWeek, needsNow, soon, turns, data.userId, data.profiles])

  const recent = completions.slice(0, 5)
  const openTask = openId ? tasks.find((t) => t.id === openId) ?? null : null

  async function handleComplete(task: Task, helperIds: string[] = []) {
    const wasHot = getFreshness(task, now).state === 'now'
    setJustDone(task.id)
    window.setTimeout(() => setJustDone(null), 700)
    if (wasHot) {
      setConfetti(true)
      window.setTimeout(() => setConfetti(false), 1000)
    }
    return complete(task, helperIds)
  }

  async function handleDelete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await deleteTask(task.id)
      toast.show(`"${task.title}" er slettet`)
    } catch {
      setTasks((prev) => [task, ...prev])
      toast.show('Kunne ikke slette')
    }
  }

  async function handleReopen(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: false } : t)))
    try {
      await reopenTask(task.id)
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t)))
      toast.show('Kunne ikke genåbne')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-5">
      <Confetti show={confetti} />
      <WeeklySummarySheet homeId={data.homeId} completions={completions} members={data.members} profiles={data.profiles} currentUserId={data.userId} />

      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-muted">{getGreeting()},</span>
          <h1 className="font-display text-3xl font-bold leading-none truncate">{myName}</h1>
        </div>
        <Link href="/mig" aria-label="Min profil" className="rounded-full active:scale-95 transition-transform">
          <Avatar id={data.userId} emoji={me?.avatar_emoji} name={myName} size="md" />
        </Link>
      </header>

      {(absences.length > 0 || waste.length > 0) && (
        <div className="flex flex-col gap-2 -mt-1">
          {absences.map((a) => {
            const p = data.profiles[a.user_id]
            const isMe = a.user_id === data.userId
            const started = a.from_date <= today
            return (
              <div key={a.id} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-info-soft text-[13px] font-bold text-body">
                <Palmtree className="w-4 h-4 text-info-ink flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  <strong className="text-ink">{isMe ? 'Du' : displayName(p)}</strong> {started ? 'er væk til' : `er væk ${formatDate(a.from_date)} –`} {formatDate(a.to_date)}
                  {a.note && <span className="text-muted"> · {a.note}</span>}
                </span>
              </div>
            )
          })}
          {waste.length > 0 && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-good-soft text-[13px] font-bold text-body">
              <Recycle className="w-4 h-4 text-good-ink flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate">
                <strong className="text-ink">{waste[0].summaries.join(' + ')}</strong> hentes {relativeDay(waste[0].date, today)}
                {waste[1] && <span className="text-muted"> · {waste[1].summaries.join(' + ')} {relativeDay(waste[1].date, today)}</span>}
              </span>
            </div>
          )}
        </div>
      )}

      <section className="bg-card rounded-card shadow-card p-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat value={myWeek} label="point i ugen" bg="bg-accent-soft" color="text-accent-ink" />
          <Stat value={total > 0 ? `#${rank}` : '–'} label={`af ${total} i huset`} bg="bg-info-soft" color="text-info-ink" />
          <Stat
            value={<span className="flex items-center gap-1">{streak}<Flame className="w-5 h-5 text-warn fill-warn" /></span>}
            label={streak === 1 ? 'uge i træk' : 'uger i træk'}
            bg="bg-warn-soft"
            color="text-warn-ink"
          />
        </div>
        {hint && <p className="text-[13px] font-semibold text-muted">{hint}</p>}
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Trænger nu</h2>
          <span className={cn('text-xs font-extrabold px-2.5 py-1 rounded-full', needsNow.length ? 'bg-danger-soft text-danger-ink' : 'bg-good-soft text-good-ink')}>
            {needsNow.length ? `${needsNow.length} ${needsNow.length === 1 ? 'opgave' : 'opgaver'}` : 'Alt er fint'}
          </span>
        </div>
        {needsNow.length === 0 ? (
          <div className="bg-good-soft rounded-card px-4 py-5 text-center">
            <p className="font-display text-lg font-semibold text-good-ink">Intet trænger lige nu</p>
            <p className="text-[13px] font-semibold text-body mt-1">
              {active.length === 0 ? <Link href="/opgaver" className="underline">Opret husets første opgaver</Link> : 'Nyd det – appen siger til, når noget nærmer sig.'}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-card shadow-card overflow-hidden">
            {needsNow.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                now={now}
                showCategory
                profiles={data.profiles}
                turnUserId={turns[t.id]}
                currentUserId={data.userId}
                onOpen={(task) => setOpenId(task.id)}
                onComplete={(task) => handleComplete(task)}
                justDone={justDone === t.id}
                isLast={i === needsNow.length - 1}
              />
            ))}
          </div>
        )}
      </section>

      {soon.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Snart</h2>
            <Link href="/opgaver" className="text-[13px] font-extrabold text-accent-ink flex items-center gap-0.5">
              Se alle <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-card rounded-card shadow-card overflow-hidden">
            {soon.map((t, i) => {
              const f = getFreshness(t, now)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left', i < soon.length - 1 && 'border-b border-line')}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="text-sm font-extrabold truncate">
                      {t.title}
                      {turns[t.id] === data.userId && <span className="ml-2 text-[11px] font-extrabold text-info-ink">Din tur</span>}
                    </span>
                    <div className="h-1.5 rounded-full bg-soft overflow-hidden">
                      <div className={cn('h-full rounded-full', FRESH_STYLE.soon.bar)} style={{ width: `${Math.round(f.ratio * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-muted whitespace-nowrap">
                    {t.is_preset ? `om ${f.daysLeft} ${f.daysLeft === 1 ? 'dag' : 'dage'}` : f.label.toLowerCase()}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <Leaderboard completions={completions} members={data.members} profiles={data.profiles} currentUserId={data.userId} />

      <Link href="/mig/praemier" className="flex items-center gap-3 px-4 py-3 rounded-card bg-warn-soft">
        <Gift className="w-5 h-5 text-warn-ink flex-shrink-0" />
        <span className="flex-1 min-w-0 text-[13px] font-bold text-body">
          Din saldo: <strong className="text-ink">{balance} point</strong>{spent > 0 && <span className="text-muted"> · {spent} brugt på præmier</span>}
        </span>
        <span className="text-[13px] font-extrabold text-warn-ink flex items-center">Præmier <ChevronRight className="w-4 h-4" /></span>
      </Link>

      {recent.length > 0 && (
        <section className="flex flex-col gap-2.5 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Sidst i huset</h2>
            <Link href="/mig/historik" className="text-[13px] font-extrabold text-accent-ink flex items-center gap-0.5">
              Historik <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="flex flex-col gap-2.5">
            {recent.map((c) => {
              const p = data.profiles[c.completed_by]
              const hs = helpersOf(c).map((h) => displayName(data.profiles[h]))
              const task = tasks.find((t) => t.id === c.task_id)
              const mine = c.completed_by === data.userId
              return (
                <li key={c.id} className="flex items-center gap-2.5">
                  <Avatar id={c.completed_by} emoji={p?.avatar_emoji} name={displayName(p)} size="sm" />
                  <span className="flex-1 min-w-0 text-[13px] font-semibold text-body truncate">
                    <strong className="text-ink">{displayName(p)}</strong> tog {task ? `"${task.title}"` : 'en opgave'}
                    {hs.length > 0 && <> med {hs.join(' og ')}</>}
                    <span className="text-good-ink font-extrabold"> +{c.points}</span>
                  </span>
                  <ReactionButton
                    completionId={c.id}
                    reactions={data.reactions.filter((r) => r.completion_id === c.id)}
                    currentUserId={data.userId}
                    profiles={data.profiles}
                    disabled={mine}
                  />
                  <span className="text-[11px] font-bold text-faint whitespace-nowrap">{formatRelative(c.completed_at)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <TaskSheet
        task={openTask}
        completions={completions}
        members={data.members}
        profiles={data.profiles}
        currentUserId={data.userId}
        turnUserId={openTask ? turns[openTask.id] : null}
        onClose={() => setOpenId(null)}
        onComplete={handleComplete}
        onEdit={(task) => { setOpenId(null); setEditTask(task); setFormOpen(true) }}
        onDelete={handleDelete}
        onReopen={handleReopen}
      />
      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editTask={editTask}
        onSaved={(task) => setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))}
        members={data.members}
        profiles={data.profiles}
        currentUserId={data.userId}
      />
    </div>
  )
}

function Stat({ value, label, bg, color }: { value: React.ReactNode; label: string; bg: string; color: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 px-3 py-2.5 rounded-2xl', bg)}>
      <span className={cn('font-display text-[26px] font-bold leading-none', color)}>{value}</span>
      <span className="text-[11px] font-extrabold text-muted">{label}</span>
    </div>
  )
}
