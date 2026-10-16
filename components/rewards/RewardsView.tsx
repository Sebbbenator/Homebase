'use client'

import { useState } from 'react'
import { Gift, Plus, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { claimReward, createReward, deleteReward } from '@/lib/actions/rewards'
import { cn, displayName, formatDate, haptic } from '@/lib/utils'
import type { Profiles, Reward, RewardClaim } from '@/lib/types'

interface RewardsViewProps {
  rewards: Reward[]
  claims: RewardClaim[]
  /** Optjent i alt pr. bruger */
  earned: Record<string, number>
  memberIds: string[]
  profiles: Profiles
  currentUserId: string
}

const COST_PRESETS = [25, 50, 100, 150, 250, 500]
const EMOJIS = ['🎁', '🍕', '🎬', '🛋️', '🧹', '☕', '🍰', '🛁', '🎮', '🌙', '🍷', '🚗']

export function RewardsView({ rewards: initialRewards, claims: initialClaims, earned, memberIds, profiles, currentUserId }: RewardsViewProps) {
  const toast = useToast()
  const [rewards, setRewards] = useState(initialRewards)
  const [claims, setClaims] = useState(initialClaims)
  const [formOpen, setFormOpen] = useState(false)
  const [confirm, setConfirm] = useState<Reward | null>(null)
  const [busy, setBusy] = useState(false)

  const spentBy = (id: string) => claims.filter((c) => c.user_id === id).reduce((s, c) => s + c.cost, 0)
  const balance = (earned[currentUserId] ?? 0) - spentBy(currentUserId)

  async function claim(reward: Reward) {
    if (busy) return
    setBusy(true)
    haptic()
    try {
      const c = await claimReward(reward.id)
      setClaims((prev) => [c, ...prev])
      toast.show(`${reward.emoji} "${reward.title}" er din! −${reward.cost} point`)
      setConfirm(null)
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Kunne ikke indløse')
    } finally {
      setBusy(false)
    }
  }

  async function remove(reward: Reward) {
    setRewards((prev) => prev.filter((r) => r.id !== reward.id))
    try {
      await deleteReward(reward.id)
    } catch {
      setRewards((prev) => [reward, ...prev])
      toast.show('Kunne ikke fjerne præmien')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="bg-card rounded-card shadow-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-warn-soft flex items-center justify-center">
            <Gift className="w-6 h-6 text-warn-ink" />
          </span>
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-[11px] font-extrabold text-faint uppercase tracking-wider">Din saldo</span>
            <span className="font-display text-3xl font-bold leading-none text-ink">{balance} <span className="text-base text-muted">point</span></span>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {memberIds.filter((id) => id !== currentUserId).map((id) => (
            <li key={id} className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Avatar id={id} emoji={profiles[id]?.avatar_emoji} name={displayName(profiles[id])} size="xs" />
              {displayName(profiles[id])}: {(earned[id] ?? 0) - spentBy(id)}
            </li>
          ))}
        </ul>
        <p className="text-xs font-semibold text-faint">Point du tjener på opgaver, kan bruges på præmier I selv finder på. Scoretavlen tæller stadig alt det, du har optjent.</p>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-[17px] font-semibold">Præmier</h2>
          <button type="button" onClick={() => setFormOpen(true)} className="h-9 px-3 rounded-full bg-accent text-ink text-[13px] font-extrabold flex items-center gap-1 shadow-float">
            <Plus className="w-4 h-4" strokeWidth={3} /> Ny
          </button>
        </div>
        {rewards.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-10">
            <p className="font-display text-xl font-semibold">Ingen præmier endnu</p>
            <p className="text-sm font-semibold text-muted max-w-xs">Fx &ldquo;Slipper for opvask søndag&rdquo; (100), &ldquo;Vælger fredagsfilm&rdquo; (50) eller &ldquo;Morgenmad på sengen&rdquo; (250).</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {rewards.map((r) => {
              const can = balance >= r.cost
              return (
                <div key={r.id} className="bg-card rounded-card shadow-card p-3.5 flex flex-col gap-2 relative">
                  <span className="text-3xl leading-none">{r.emoji}</span>
                  <span className="text-sm font-extrabold leading-tight">{r.title}</span>
                  <span className={cn('text-xs font-extrabold', can ? 'text-good-ink' : 'text-muted')}>{r.cost} point</span>
                  <button
                    type="button"
                    onClick={() => setConfirm(r)}
                    disabled={!can}
                    className={cn('h-10 rounded-xl text-[13px] font-extrabold mt-auto', can ? 'bg-accent text-ink' : 'bg-soft text-faint')}
                  >
                    {can ? 'Indløs' : `Mangler ${r.cost - balance}`}
                  </button>
                  <button type="button" onClick={() => remove(r)} aria-label={`Fjern ${r.title}`} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-danger-ink hover:bg-danger-soft">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {claims.length > 0 && (
        <section className="flex flex-col gap-2 pb-2">
          <h2 className="text-[11px] font-extrabold text-faint uppercase tracking-wider px-1">Indløst</h2>
          <div className="bg-card rounded-card shadow-card overflow-hidden">
            {claims.slice(0, 20).map((c, i) => {
              const p = profiles[c.user_id]
              return (
                <div key={c.id} className={cn('flex items-center gap-3 px-4 py-3', i < Math.min(claims.length, 20) - 1 && 'border-b border-line')}>
                  <Avatar id={c.user_id} emoji={p?.avatar_emoji} name={displayName(p)} size="sm" />
                  <span className="flex-1 min-w-0 text-[13px] font-semibold text-body truncate">
                    <strong className="text-ink">{c.user_id === currentUserId ? 'Du' : displayName(p)}</strong> indløste &ldquo;{c.title}&rdquo;
                  </span>
                  <span className="text-xs font-extrabold text-danger-ink">−{c.cost}</span>
                  <span className="text-[11px] font-bold text-faint">{formatDate(c.created_at)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Indløs præmie?">
        {confirm && (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">{confirm.emoji}</span>
            <span className="font-display text-2xl font-semibold">{confirm.title}</span>
            <span className="text-sm font-bold text-muted">Koster {confirm.cost} point · du har {balance}</span>
            <p className="text-xs font-semibold text-faint">De andre i huset får besked, så de ved, at du har indløst den.</p>
            <div className="flex gap-3 w-full pt-2">
              <button type="button" onClick={() => setConfirm(null)} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">Annullér</button>
              <button type="button" onClick={() => claim(confirm)} disabled={busy} className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-60">
                {busy ? 'Et øjeblik…' : 'Indløs'}
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Ny præmie">
        {formOpen && <RewardForm onClose={() => setFormOpen(false)} onCreated={(r) => setRewards((prev) => [r, ...prev])} />}
      </Sheet>
    </div>
  )
}

function RewardForm({ onClose, onCreated }: { onClose: () => void; onCreated: (r: Reward) => void }) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [cost, setCost] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const r = await createReward({ title, emoji, cost })
      onCreated(r)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noget gik galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="reward-title" className="block text-[13px] font-extrabold text-muted mb-2">Hvad kan man vinde?</label>
        <input
          id="reward-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus maxLength={60}
          placeholder="fx Slipper for opvask søndag"
          className="w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition"
        />
      </div>
      <div>
        <span className="block text-[13px] font-extrabold text-muted mb-2">Ikon</span>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(e)} aria-pressed={emoji === e} aria-label={e}
              className={cn('w-11 h-11 rounded-xl text-2xl flex items-center justify-center', emoji === e ? 'bg-accent-soft ring-2 ring-accent' : 'bg-soft')}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="block text-[13px] font-extrabold text-muted mb-2">Pris i point</span>
        <div className="flex flex-wrap gap-2">
          {COST_PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setCost(p)} aria-pressed={cost === p}
              className={cn('h-10 px-3.5 rounded-full text-[13px] font-extrabold', cost === p ? 'bg-ink text-ground dark:bg-accent dark:text-ink' : 'bg-soft text-muted')}>
              {p}
            </button>
          ))}
          <input
            type="number" inputMode="numeric" min={1} aria-label="Egen pris" placeholder="Andet"
            value={COST_PRESETS.includes(cost) ? '' : cost}
            onChange={(e) => setCost(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 h-10 px-3 bg-soft border-2 border-transparent rounded-full text-ink placeholder-faint text-[13px] font-bold text-center focus:outline-none focus:border-accent focus:bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
      {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">Annullér</button>
        <button type="submit" disabled={loading || !title.trim()} className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-50">
          {loading ? 'Gemmer…' : 'Opret'}
        </button>
      </div>
    </form>
  )
}
