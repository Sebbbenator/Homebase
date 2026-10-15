'use client'

import { useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { cn, displayName, formatDate } from '@/lib/utils'
import { getFreshness, formatInterval, FRESH_STYLE } from '@/lib/freshness'
import { getCategory, TONE_CHIP } from '@/lib/categories'
import type { Completion, HomeMember, Profiles, Task } from '@/lib/types'

interface TaskSheetProps {
  task: Task | null
  completions: Completion[]
  members: HomeMember[]
  profiles: Profiles
  currentUserId: string
  onClose: () => void
  onComplete: (task: Task, helperId: string | null) => Promise<unknown>
  onEdit: (task: Task) => void
  onDelete: (task: Task) => Promise<unknown>
}

const RING_R = 38
const RING_C = 2 * Math.PI * RING_R

const RING_COLOR = { now: 'var(--danger)', soon: 'var(--warn)', ok: 'var(--good)', none: 'var(--line)' }

export function TaskSheet({ task, onClose, ...rest }: TaskSheetProps) {
  return (
    <Sheet open={!!task} onClose={onClose} title={task?.title}>
      {/* key = task.id så state (hjælper, done, slet-bekræftelse) nulstilles pr. opgave */}
      {task && <TaskSheetBody key={task.id} task={task} onClose={onClose} {...rest} />}
    </Sheet>
  )
}

function TaskSheetBody({ task, completions, members, profiles, currentUserId, onClose, onComplete, onEdit, onDelete }: TaskSheetProps & { task: Task }) {
  const [helperId, setHelperId] = useState<string>('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fresh = getFreshness(task)
  const style = FRESH_STYLE[fresh.state]
  const category = getCategory(task.category)
  const history = completions.filter((c) => c.task_id === task.id).slice(0, 12)
  const others = members.filter((m) => m.user_id !== currentUserId)
  const lastBy = task.last_completed_by ? displayName(profiles[task.last_completed_by]) : null
  const dash = fresh.state === 'none' ? 0 : Math.min(1, fresh.ratio) * RING_C

  const statusTitle =
    fresh.state === 'now'
      ? fresh.neverDone ? 'Trænger – aldrig gjort' : fresh.daysOver > 0 ? `Trænger – ${fresh.daysOver} ${fresh.daysOver === 1 ? 'dag' : 'dage'} over` : 'Trænger nu'
      : fresh.state === 'soon' ? `Snart – om ${fresh.daysLeft} ${fresh.daysLeft === 1 ? 'dag' : 'dage'}`
      : fresh.state === 'ok' ? 'Alt er fint'
      : 'Efter behov'

  async function handleComplete() {
    if (busy) return
    setBusy(true)
    const res = await onComplete(task, helperId || null)
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

  return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full', TONE_CHIP[category.tone])}>{category.label}</span>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-soft text-muted">{formatInterval(task.interval_days)}</span>
            </div>
            {task.description && <p className="text-sm font-semibold text-muted">{task.description}</p>}
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
              {helperId ? `${displayName(profiles[helperId])} fik også ${task.points} point` : 'Logget på dig'}
            </span>
          </div>
        ) : (
          <>
            <div className={cn('flex items-center gap-4 px-4 py-3.5 rounded-card', style.soft)}>
              <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={fresh.label}>
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
              <div className="flex flex-col gap-1 min-w-0">
                <span className={cn('text-[15px] font-extrabold', style.text)}>{statusTitle}</span>
                <span className="text-[13px] font-semibold text-body">Interval: {formatInterval(task.interval_days)}</span>
                <span className="text-[13px] font-semibold text-body truncate">
                  {task.last_completed_at ? `Sidst: ${lastBy}, ${formatDate(task.last_completed_at)}` : 'Aldrig gjort endnu'}
                </span>
              </div>
            </div>

            {others.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-extrabold text-muted">Hjalp nogen til?</span>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                  <HelperChip active={helperId === ''} onClick={() => setHelperId('')} emoji={profiles[currentUserId]?.avatar_emoji} id={currentUserId} label="Kun mig" />
                  {others.map((m) => (
                    <HelperChip
                      key={m.user_id}
                      active={helperId === m.user_id}
                      onClick={() => setHelperId(m.user_id)}
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
            <span className="text-[13px] font-extrabold text-muted">Historik {history.length > 0 && `(${completions.filter((c) => c.task_id === task.id).length})`}</span>
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
                const h = c.helper_id ? profiles[c.helper_id] : undefined
                return (
                  <li key={c.id} className="flex items-center gap-2.5">
                    <Avatar id={c.completed_by} emoji={p?.avatar_emoji} name={displayName(p)} size="sm" />
                    <span className="flex-1 min-w-0 text-[13px] font-bold text-ink truncate">
                      {displayName(p)}
                      <span className="font-semibold text-muted"> · {formatDate(c.completed_at)}</span>
                      {h && <span className="font-semibold text-muted"> · med {h.avatar_emoji} {displayName(h)}</span>}
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
