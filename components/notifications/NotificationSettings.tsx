'use client'

import { useState } from 'react'
import { MoonStar } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { updateMyPrefs } from '@/lib/actions/notifications'
import { cn } from '@/lib/utils'
import type { NotificationPrefs, PrefKey } from '@/lib/types'

interface Row { key: PrefKey; label: string; sub: string }

const INSTANT: Row[] = [
  { key: 'task_needed', label: 'En opgave trænger', sub: 'Når friskheden rammer rød' },
  { key: 'task_done', label: 'Nogen tog en opgave', sub: '"Sofie tog opvasken (+10)"' },
  { key: 'helper_mention', label: 'Du blev nævnt som hjælper', sub: 'Når du får point for at hjælpe' },
  { key: 'rank_change', label: 'Nogen overhalede dig', sub: 'Når du mister førstepladsen i ugen' },
  { key: 'shopping', label: 'Indkøb', sub: 'Nye varer (samlet), nogen handler, og fredagsliste' },
  { key: 'reactions', label: 'Reaktioner', sub: 'Når nogen klapper af din indsats 👏' },
]

const SCHEDULED: Row[] = [
  { key: 'morning_brief', label: 'Morgenbriefing', sub: 'Kl. 08 – kun hvis noget trænger' },
  { key: 'evening_reminder', label: 'Aftenpåmindelse', sub: 'Kl. 19 – opgaver der er mindst en dag over' },
  { key: 'weekly_summary', label: 'Ugens opsummering', sub: 'Søndag kl. 18 – point og vinder' },
  { key: 'streak_warning', label: 'Streak-advarsel', sub: 'Søndag – hvis din stime er ved at ryge' },
  { key: 'waste', label: 'Affald', sub: 'Aftenen før afhentning (kræver affaldskalender under Mig)' },
]

export function NotificationSettings({ initial }: { initial: NotificationPrefs }) {
  const toast = useToast()
  const [prefs, setPrefs] = useState(initial)

  async function save(patch: Partial<Omit<NotificationPrefs, 'user_id'>>) {
    const prev = prefs
    setPrefs((p) => ({ ...p, ...patch }))
    try {
      await updateMyPrefs(patch)
    } catch {
      setPrefs(prev)
      toast.show('Kunne ikke gemme indstillingen')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Group title="Når noget sker" rows={INSTANT} prefs={prefs} onToggle={(k, v) => save({ [k]: v })} />
      <Group title="Planlagt" rows={SCHEDULED} prefs={prefs} onToggle={(k, v) => save({ [k]: v })} />

      <section className="rounded-card bg-info-soft px-4 py-3.5 flex items-center gap-3">
        <MoonStar className="w-5 h-5 text-info-ink flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-extrabold">Stille timer</span>
          <span className="text-xs font-semibold text-body">Ingen push i dette tidsrum (ugens opsummering og morgenbriefing undtaget)</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-extrabold">
          <label className="sr-only" htmlFor="quiet-start">Fra</label>
          <input
            id="quiet-start"
            type="time"
            value={prefs.quiet_start}
            onChange={(e) => e.target.value && save({ quiet_start: e.target.value })}
            className="h-10 px-2 rounded-xl bg-card text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="quiet-end">Til</label>
          <input
            id="quiet-end"
            type="time"
            value={prefs.quiet_end}
            onChange={(e) => e.target.value && save({ quiet_end: e.target.value })}
            className="h-10 px-2 rounded-xl bg-card text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </section>
    </div>
  )
}

function Group({ title, rows, prefs, onToggle }: { title: string; rows: Row[]; prefs: NotificationPrefs; onToggle: (k: PrefKey, v: boolean) => void }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] font-extrabold text-faint uppercase tracking-wider px-1">{title}</h2>
      <div className="bg-card rounded-card shadow-card overflow-hidden">
        {rows.map((r, i) => {
          const on = prefs[r.key]
          return (
            <div key={r.key} className={cn('flex items-center gap-3 pl-4 pr-3.5 py-3', i < rows.length - 1 && 'border-b border-line')}>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-extrabold">{r.label}</span>
                <span className="text-xs font-semibold text-muted">{r.sub}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={r.label}
                onClick={() => onToggle(r.key, !on)}
                className={cn('w-[50px] h-[30px] rounded-full p-[3px] flex items-center transition-colors flex-shrink-0', on ? 'bg-good justify-end' : 'bg-line justify-start')}
              >
                <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]" />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
