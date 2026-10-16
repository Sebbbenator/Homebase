'use client'

import { useState } from 'react'
import { CalendarDays, Check, Pencil, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { cn, displayName, formatDate } from '@/lib/utils'
import { getFreshness, formatInterval, FRESH_STYLE } from '@/lib/freshness'
import { getCategory, TONE_CHIP } from '@/lib/categories'
import { helpersOf } from '@/lib/points'
import type { Completion, HomeMember, Profiles, Task } from '@/lib/types'

interface TaskSheetProps {
  task: Task | null
  completions: Completion[]
  members: HomeMember[]
  profiles: Profiles
  currentUserId: string
  onClose: () => void
  onComplete: (task: Task, helperIds: string[]) => Promise<unknown>
  onEdit: (task: Task) => void
  onDelete: (task: Task) => Promise<unknown>
  onReopen?: (task: Task) => Promise<unknown>
}

const RING_R = 38
const RING_C = 2 * Math.PI * RING_R
const RING_COLOR = { now: 'var(--danger)', soon: 'var(--warn)', ok: 'var(--good)', none: 'var(--line)' }

export function TaskSheet({ task, onClose, ...rest }: TaskSheetProps) {
  return (
    <Sheet open={!!task} onClose={onClose} title={task?.title}>
      {/* key = task.id så state (hjælpere, done, slet-bekræftelse) nulstilles pr. opgave */}
      {task && <TaskSheetBody key={task.id} task={task} onClose={onClose} {...rest} />}
    </Sheet>
  )
}

function TaskSheetBody({ task, completions, members, profiles, currentUserId, onClose, onComplete, onEdit, onDelete, onReopen }: TaskSheetProps & { task: Task }) {
  const [helpers, setHelpers] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fresh = getFreshness(task)
  const style = FRESH_STYLE[fresh.state]
  const category = getCategory(task.category)
  const allForTask = completions.filter((c) => c.task_id === task.id)
  const history = allForTask.slice(0, 12)
  const others = members.filter((m) => m.user_id !== currentUserId)
  const lastBy = task.last_completed_by ? displayName(profiles[task.last_completed_by]) : null
  const dash = fresh.state === 'none' ? 0 : Math.min(1, fresh.ratio) * RING_C
  const isSpecial = !task.is_preset
  const completedSpecial = isSpecial && task.is_completed
  const assignee = task.assigned_to ? profiles[task.assigned_to] : undefined

  const statusTitle = isSpecial
    ? fresh.state === 'now' ? (task.due_date ? fresh.label : 'Skal gøres')
      : fresh.state === 'soon' ? fresh.label
      : fresh.label
    : fresh.state === 'now'
      ? fresh.neverDone ? 'Trænger – aldrig gjort' : fresh.daysOver > 0 ? `Trænger – ${fresh.daysOver} ${fresh.daysOver === 1 ? 'dag' : 'dage'} over` : 'Trænger nu'
      : fresh.state === 'soon' ? `Snart – om ${fresh.daysLeft} ${fresh.daysLeft === 1 ? 'dag' : 'dage'}`
      : fresh.state === 'ok' ? 'Alt er fint'
      : 'Efter behov'

  function toggleHelper(id: string) {
    setHelpers((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]))
  }

  async function handleComplete() {
    if (busy) return
    setBusy(true)
    const res = await onComplete(task, helpers)
    setBusy(false)
    if (res) {
      setDone(true)
      window.setTimeout(onClose, 1100)
    }
  }

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    await onDelete(task)
    setBusy(false)
    onClose()
  }

  async function handleReopen() {
    if (busy || !onReopen) return
    setBusy(true)
    await onReopen(task)
    setBusy(false)
    onClose()
  }

  const helperNames = helpers.map((h) => displayName(profiles[h]))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isSpecial ? (
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-info-soft text-info-ink flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Engangsopgave
              </span>
            ) : (
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-soft text-muted">{formatInterval(task.interval_days)}</span>
            )}
            <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full', TONE_CHIP[category.tone])}>{category.label}</span>
          </div>
          {task.description && <p className="text-sm font-semibold text-muted">{task.description}</p>}
          {assignee && (
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-body">
              <Avatar id={task.assigned_to!} emoji={assignee.avatar_emoji} name={displayName(assignee)} size="xs" />
              {task.assigned_to === currentUserId ? 'Tildelt dig' : `Tildelt ${displayName(assignee)}`}
            </span>
          )}
        </div>
        <span className="flex flex-col items-center px-3 py-2 rounded-2xl bg-accent-soft flex-shrink-0">
          <span className="font-display text-2xl font-bold text-accent-ink leading-none">{task.points}</span>
          <span className="text-[10px] font-extrabold text-muted">point</span>
        </span>
      </div>

      {done ? (
        <div className="anim-pop flex flex-col items-center gap-2 py-6 px-4 rounded-card bg-good-soft text-center">
          <span className="w-14 h-14 rounded-full bg-good flex items-center justify-center">
            <Check className="w-8 h-8 text-white" strokeWidth={3.5} />
          </span>
          <span className="font-display text-2xl font-bold text-good-ink">Flot! +{task.points} point</span>
          <span className="text-sm font-bold text-body">
            {helpers.length ? `${helperNames.join(' og ')} fik også ${task.points} point` : 'Logget på dig'}
          </span>
        </div>
      ) : completedSpecial ? (
        <div className="flex flex-col gap-3 px-4 py-4 rounded-card bg-good-soft">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-good flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-extrabold text-good-ink">Klaret</span>
              <span className="text-[13px] font-semibold text-body truncate">
                {task.last_completed_at ? `${lastBy}, ${formatDate(task.last_completed_at)}` : ''}
              </span>
            </div>
          </div>
          {onReopen && (
            <button type="button" onClick={handleReopen} disabled={busy} className="h-11 rounded-2xl bg-card text-ink font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <RotateCcw className="w-4 h-4" /> Skal gøres igen
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={cn('flex items-center gap-4 px-4 py-3.5 rounded-card', style.soft)}>
            {isSpecial ? (
              <span className={cn('w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0 bg-card')}>
                <CalendarDays className={cn('w-8 h-8', style.text)} />
              </span>
            ) : (
              <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={fresh.label} className="flex-shrink-0">
                <circle cx="44" cy="44" r={RING_R} fill="none" stroke="var(--card)" strokeWidth="9" />
                <circle
                  cx="44" cy="44" r={RING_R} fill="none"
                  stroke={RING_COLOR[fresh.state]} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${dash} ${RING_C}`} transform="rotate(-90 44 44)"
                />
                <text x="44" y="42" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">
                  {fresh.daysSince === null ? '–' : fresh.daysSince}
                </text>
                <text x="44" y="58" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--muted)">
                  {fresh.daysSince === 1 ? 'dag' : 'dage'}
                </text>
              </svg>
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <span className={cn('text-[15px] font-extrabold', style.text)}>{statusTitle}</span>
              {isSpecial ? (
                <span className="text-[13px] font-semibold text-body">
                  {task.due_date ? `Deadline: ${formatDate(task.due_date)}` : 'Ingen deadline'}
                </span>
              ) : (
                <span className="text-[13px] font-semibold text-body">Interval: {formatInterval(task.interval_days)}</span>
              )}
              <span className="text-[13px] font-semibold text-body truncate">
                {task.last_completed_at ? `Sidst: ${lastBy}, ${formatDate(task.last_completed_at)}` : isSpecial ? `Oprettet ${formatDate(task.created_at)}` : 'Aldrig gjort endnu'}
              </span>
            </div>
          </div>

          {others.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-extrabold text-muted">
                Hjalp nogen til? <span className="font-semibold text-faint">Alle valgte får {task.points} point</span>
              </span>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                <HelperChip active={helpers.length === 0} onClick={() => setHelpers([])} emoji={profiles[currentUserId]?.avatar_emoji} id={currentUserId} label="Kun mig" />
                {others.map((m) => (
                  <HelperChip
                    key={m.user_id}
                    active={helpers.includes(m.user_id)}
                    onClick={() => toggleHelper(m.user_id)}
                    emoji={profiles[m.user_id]?.avatar_emoji}
                    id={m.user_id}
                    label={displayName(profiles[m.user_id])}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleComplete}
            disabled={busy}
            className="h-14 rounded-2xl bg-accent text-ink font-display text-lg font-bold flex items-center justify-center gap-2.5 shadow-float active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <Check className="w-6 h-6" strokeWidth={3} />
            Jeg har gjort det
          </button>
        </>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-extrabold text-muted">Historik {allForTask.length > 0 && `(${allForTask.length})`}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => onEdit(task)} className="h-9 px-3 rounded-xl text-[13px] font-extrabold text-accent-ink hover:bg-accent-soft flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Rediger
            </button>
            {confirmDelete ? (
              <>
                <button type="button" onClick={handleDelete} disabled={busy} className="h-9 px-3 rounded-xl text-[13px] font-extrabold bg-danger text-white">Slet</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-9 px-3 rounded-xl text-[13px] font-extrabold text-muted">Nej</button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="h-9 px-3 rounded-xl text-[13px] font-extrabold text-danger-ink hover:bg-danger-soft flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Slet
              </button>
            )}
          </div>
        </div>
        {history.length === 0 ? (
          <p className="text-sm font-semibold text-faint text-center py-4">Ingen fuldførelser endnu</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {history.map((c) => {
              const p = profiles[c.completed_by]
              const hs = helpersOf(c).map((h) => profiles[h]).filter(Boolean)
              return (
                <li key={c.id} className="flex items-center gap-2.5">
                  <Avatar id={c.completed_by} emoji={p?.avatar_emoji} name={displayName(p)} size="sm" />
                  <span className="flex-1 min-w-0 text-[13px] font-bold text-ink truncate">
                    {displayName(p)}
                    <span className="font-semibold text-muted"> · {formatDate(c.completed_at)}</span>
                    {hs.length > 0 && (
                      <span className="font-semibold text-muted"> · med {hs.map((h) => `${h.avatar_emoji} ${displayName(h)}`).join(', ')}</span>
                    )}
                  </span>
                  <span className="text-xs font-extrabold text-good-ink">+{c.points}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function HelperChip({ active, onClick, emoji, id, label }: { active: boolean; onClick: () => void; emoji?: string | null; id: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-shrink-0 h-16 min-w-[84px] px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 text-xs font-extrabold transition-colors',
        active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-card text-body'
      )}
    >
      <Avatar id={id} emoji={emoji} name={label} size="xs" className="bg-transparent" />
      {label}
    </button>
  )
}
