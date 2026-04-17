'use client'

import { useState } from 'react'
import { AlertCircle, Check, Trash2, Pencil, ChevronRight, Users, Star, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { getCategory } from '@/lib/categories'
import { completePresetTask, flagPresetNeedsDoing, flagPresetIdle, deleteTask } from '@/lib/actions/tasks'
import { sendPushToHome } from '@/lib/push'
import type { Task, PresetCompletion, Profile, HomeMember } from '@/lib/types'

interface PresetCardProps {
  task: Task
  completions: PresetCompletion[]
  currentUserId: string
  profiles: Record<string, Profile>
  members: HomeMember[]
  onEdit: (task: Task) => void
  isLast?: boolean
}

const CONFETTI_COLORS = ['#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#f472b6']

function Confetti({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {Array.from({ length: 40 }).map((_, i) => {
        const left = 5 + Math.random() * 90
        const delay = Math.random() * 0.5
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const size = 6 + Math.random() * 8
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: '40%',
              width: size,
              height: size,
              backgroundColor: color,
              animation: `confetti-pop 0.8s ${delay}s ease-out both`,
            }}
          />
        )
      })}
    </div>
  )
}

const TZ = 'Europe/Copenhagen'

function cphMidnight(date: Date): Date {
  return new Date(date.toLocaleDateString('en-CA', { timeZone: TZ }) + 'T00:00:00')
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.round(
    (cphMidnight(now).getTime() - cphMidnight(d).getTime()) / 86400000
  )
  if (diffDays === 0) return 'I dag'
  if (diffDays === 1) return 'I går'
  if (diffDays < 7) return `${diffDays}d siden`
  return d.toLocaleDateString('da-DK', { timeZone: TZ, day: 'numeric', month: 'short' })
}

export function PresetCard({ task, completions, currentUserId, profiles, members, onEdit }: PresetCardProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [helperIds, setHelperIds] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const needsDoing = task.preset_status === 'needs_doing'
  const category = getCategory(task.category ?? 'other')
  const otherMembers = members.filter((m) => m.user_id !== currentUserId)
  const lastCompletion = completions[0]

  async function handleFlag() {
    setLoading(true)
    try {
      if (needsDoing) {
        await flagPresetIdle(task.id)
      } else {
        await flagPresetNeedsDoing(task.id)
        sendPushToHome(task.home_id, 'HomeBase', `"${task.title}" needs to be done`)
      }
    } finally {
      setLoading(false)
    }
  }

  function toggleHelper(id: string) {
    setHelperIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    )
  }

  async function handleComplete() {
    setLoading(true)
    try {
      await completePresetTask(task.id, helperIds)
      setHelperIds([])
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        setOpen(false)
      }, 1200)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Slet denne opgave og al dens historik?')) return
    setLoading(true)
    try {
      await deleteTask(task.id)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Confetti show={showConfetti} />

      {/* Row card */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full text-left rounded-3xl p-4 transition-all active:scale-[0.98] relative overflow-hidden',
          needsDoing
            ? 'bg-orange-950/25 border border-orange-500/20'
            : 'bg-[#16161e] border border-white/[0.05]'
        )}
        style={{ boxShadow: needsDoing ? '0 0 20px rgba(249,115,22,0.08)' : undefined }}
      >
        {/* Left accent */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ backgroundColor: needsDoing ? '#f97316' : category.borderColor }}
        />

        <div className="pl-3 flex items-center gap-3">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            needsDoing ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse' : 'bg-white/[0.08]'
          )} />

          <div className="flex-1 min-w-0">
            <p className={cn('text-base font-semibold truncate', needsDoing ? 'text-orange-300' : 'text-white')}>
              {task.title}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {needsDoing
                ? 'Skal gøres'
                : lastCompletion
                ? `Gjort ${formatDate(lastCompletion.completed_at)} af ${lastCompletion.completed_email || 'nogen'}`
                : 'Aldrig udført'}
            </p>
          </div>

          <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 rounded-full flex-shrink-0">
            <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
            <span className="text-xs font-bold text-orange-400">{task.points ?? 10}</span>
          </span>

          <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
        </div>
      </button>

      {/* Bottom sheet */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-6">

          {/* Header: title + meta */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-2xl font-bold text-white leading-tight">{task.title}</h2>
              {/* Status pill */}
              <span className={cn(
                'flex-shrink-0 mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
                needsDoing
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'bg-green-500/10 text-green-400'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', needsDoing ? 'bg-orange-400 animate-pulse' : 'bg-green-400')} />
                {needsDoing ? 'Skal gøres' : 'Alt godt'}
              </span>
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${category.color}`}>
                {category.label}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full">
                <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                <span className="text-xs font-bold text-orange-400">{task.points ?? 10} pts</span>
              </span>
            </div>

            {task.description && (
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Last done */}
          {lastCompletion && (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
              <Avatar
                email={lastCompletion.completed_email ?? lastCompletion.completed_by}
                emoji={lastCompletion.completed_emoji}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-500">Sidst udført</p>
                <p className="text-sm font-semibold text-zinc-200 truncate">
                  {lastCompletion.completed_email ?? 'Someone'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-zinc-600">
                <Clock className="w-3 h-3" />
                {formatDate(lastCompletion.completed_at)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Helper picker — tap to toggle */}
            {needsDoing && otherMembers.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  <Users className="w-3.5 h-3.5" />
                  Hvem hjalp?
                </label>
                <div className="flex flex-wrap gap-2">
                  {otherMembers.map((m) => {
                    const profile = profiles[m.user_id]
                    const name = profile?.display_name || m.email?.split('@')[0] || m.user_id.slice(0, 8)
                    const emoji = profile?.avatar_emoji || '😀'
                    const selected = helperIds.includes(m.user_id)
                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => toggleHelper(m.user_id)}
                        className={cn(
                          'flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-95',
                          selected
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-white/[0.05] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.08]'
                        )}
                      >
                        <span>{emoji}</span>
                        <span>{name}</span>
                        {selected && <span className="text-orange-400 text-xs">✓</span>}
                      </button>
                    )
                  })}
                </div>
                {helperIds.length > 0 && (
                  <p className="text-xs text-orange-400/70 font-medium mt-2">
                    {helperIds.length} {helperIds.length === 1 ? 'person' : 'personer'} valgt — hver tjener {task.points ?? 10} pt
                  </p>
                )}
              </div>
            )}

            {/* Primary action */}
            {needsDoing ? (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                Marker som gjort
              </button>
            ) : (
              <button
                onClick={handleFlag}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-2xl text-base transition-all active:scale-[0.98]"
              >
                <AlertCircle className="w-5 h-5" />
                Markér som nødvendig
              </button>
            )}

            {needsDoing && (
              <button
                onClick={handleFlag}
                disabled={loading}
                className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-400 font-semibold rounded-2xl text-sm transition-all active:scale-[0.98]"
              >
                Ikke nødvendigt længere
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* History */}
          <div>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
              Historik {completions.length > 0 && `· ${completions.length}`}
            </p>
            {completions.length === 0 ? (
              <p className="text-sm text-zinc-700 text-center py-6 font-medium">Ingen udførelser endnu</p>
            ) : (
              <div className="space-y-2">
                {completions.map((c) => {
                  const profile = profiles[c.completed_by]
                  const name = c.completed_email || profile?.display_name || c.completed_by.slice(0, 8)
                  const emoji = c.completed_emoji || profile?.avatar_emoji
                  // Use enriched helpers array if available, fall back to legacy single helper
                  const helpers = c.helpers && c.helpers.length > 0
                    ? c.helpers
                    : c.helper_id
                    ? [{ id: c.helper_id, email: c.helper_email, emoji: c.helper_emoji }]
                    : []
                  return (
                    <div key={c.id} className="py-2.5 px-3.5 rounded-2xl bg-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <Avatar email={name} emoji={emoji} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200">{name}</p>
                        </div>
                        <span className="text-xs font-medium text-zinc-600">{formatDate(c.completed_at)}</span>
                      </div>
                      {helpers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
                          {helpers.map((h) => (
                            <span key={h.id} className="flex items-center gap-1 text-xs text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                              {h.emoji || '😀'} {h.email}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Edit / Delete */}
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); onEdit(task) }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-300 font-semibold rounded-2xl text-sm transition-all active:scale-[0.98]"
            >
              <Pencil className="w-3.5 h-3.5" />
              Rediger
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/8 hover:bg-red-500/15 text-red-400 font-semibold rounded-2xl text-sm transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Slet
            </button>
          </div>

        </div>
      </Modal>
    </>
  )
}
