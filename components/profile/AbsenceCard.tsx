'use client'

import { useState } from 'react'
import { Palmtree, Plus, X } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { addAbsence, deleteAbsence } from '@/lib/actions/absences'
import { dateKey, upcomingAbsences } from '@/lib/rotation'
import { cn, displayName, formatDate } from '@/lib/utils'
import type { Absence, Profiles } from '@/lib/types'

interface AbsenceCardProps {
  absences: Absence[]
  profiles: Profiles
  currentUserId: string
}

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'

export function AbsenceCard({ absences: initial, profiles, currentUserId }: AbsenceCardProps) {
  const toast = useToast()
  const [absences, setAbsences] = useState(initial)
  const [open, setOpen] = useState(false)
  const today = dateKey(new Date())
  const list = upcomingAbsences(absences, today, 60)

  async function remove(a: Absence) {
    setAbsences((prev) => prev.filter((x) => x.id !== a.id))
    try {
      await deleteAbsence(a.id)
    } catch {
      setAbsences((prev) => [a, ...prev])
      toast.show('Kunne ikke fjerne')
    }
  }

  return (
    <section className="bg-card rounded-card shadow-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-info-soft text-info-ink flex items-center justify-center flex-shrink-0">
          <Palmtree className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-extrabold">Fravær</span>
          <span className="text-xs font-semibold text-muted">Væk et par dage? Så springer rotation og påmindelser dig over.</span>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="h-9 px-3 rounded-full bg-accent text-ink text-[13px] font-extrabold flex items-center gap-1 flex-shrink-0">
          <Plus className="w-4 h-4" strokeWidth={3} /> Jeg er væk
        </button>
      </div>

      {list.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {list.map((a) => {
            const p = profiles[a.user_id]
            const mine = a.user_id === currentUserId
            return (
              <li key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-soft">
                <Avatar id={a.user_id} emoji={p?.avatar_emoji} name={displayName(p)} size="xs" />
                <span className="flex-1 min-w-0 text-[13px] font-bold text-body truncate">
                  <strong className="text-ink">{mine ? 'Du' : displayName(p)}</strong> · {formatDate(a.from_date)}{a.from_date !== a.to_date && ` – ${formatDate(a.to_date)}`}
                  {a.note && <span className="text-muted"> · {a.note}</span>}
                </span>
                {mine && (
                  <button type="button" onClick={() => remove(a)} aria-label="Fjern fravær" className="w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-danger-ink">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Jeg er væk">
        {open && <AbsenceForm today={today} onClose={() => setOpen(false)} onAdded={(a) => setAbsences((prev) => [a, ...prev])} />}
      </Sheet>
    </section>
  )
}

function AbsenceForm({ today, onClose, onAdded }: { today: string; onClose: () => void; onAdded: (a: Absence) => void }) {
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const a = await addAbsence({ from_date: from, to_date: to < from ? from : to, note })
      onAdded(a)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noget gik galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="abs-from" className="block text-[13px] font-extrabold text-muted mb-2">Fra</label>
          <input id="abs-from" type="date" value={from} min={today} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value) }} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="abs-to" className="block text-[13px] font-extrabold text-muted mb-2">Til</label>
          <input id="abs-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} required className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="abs-note" className="block text-[13px] font-extrabold text-muted mb-2">Note <span className="font-semibold text-faint">(valgfri)</span></label>
        <input id="abs-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} placeholder="fx Hos mor i Jylland" className={inputClass} />
      </div>
      {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">Annullér</button>
        <button type="submit" disabled={loading} className={cn('flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float', loading && 'opacity-60')}>
          {loading ? 'Gemmer…' : 'Gem'}
        </button>
      </div>
    </form>
  )
}
