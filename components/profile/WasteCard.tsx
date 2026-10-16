'use client'

import { useState } from 'react'
import { Recycle } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { setWasteUrl } from '@/lib/actions/home'

export function WasteCard({ initialUrl }: { initialUrl: string | null }) {
  const toast = useToast()
  const [url, setUrl] = useState(initialUrl ?? '')
  const [saved, setSaved] = useState(initialUrl ?? '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save(value: string | null) {
    setLoading(true)
    setError('')
    try {
      const { count } = await setWasteUrl(value)
      setSaved(value ?? '')
      setUrl(value ?? '')
      setOpen(false)
      toast.show(value ? `Affaldskalender gemt – ${count} afhentninger fundet` : 'Affaldskalender fjernet')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente kalenderen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-card rounded-card shadow-card p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-good-soft text-good-ink flex items-center justify-center flex-shrink-0">
        <Recycle className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-extrabold">Affaldskalender</span>
        <span className="text-xs font-semibold text-muted truncate">
          {saved ? 'Tilsluttet – næste afhentning vises på Hjem, og I får besked aftenen før.' : 'Tilslut kommunens kalender, så appen siger til aftenen før afhentning.'}
        </span>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="h-9 px-3 rounded-full bg-soft text-body text-[13px] font-extrabold flex-shrink-0">
        {saved ? 'Ændr' : 'Tilslut'}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Affaldskalender">
        <form onSubmit={(e) => { e.preventDefault(); save(url.trim() || null) }} className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-body">
            De fleste kommuner tilbyder et kalender-link (ICS) til jeres adresse – typisk under &ldquo;Affald&rdquo; på kommunens hjemmeside eller i appen (fx <em>Mit Affald</em>, <em>Affaldsportal</em>, <em>Perfect Waste</em>), hvor du kan vælge &ldquo;Tilføj til kalender&rdquo; og kopiere linket.
          </p>
          <div>
            <label htmlFor="waste-url" className="block text-[13px] font-extrabold text-muted mb-2">Kalender-link</label>
            <input
              id="waste-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…/kalender.ics"
              className="w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[14px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition"
            />
          </div>
          {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            {saved && (
              <button type="button" onClick={() => save(null)} disabled={loading} className="h-12 px-4 rounded-2xl bg-danger-soft text-danger-ink font-extrabold text-[15px]">Fjern</button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">Annullér</button>
            <button type="submit" disabled={loading || !url.trim()} className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-50">
              {loading ? 'Tjekker…' : 'Gem'}
            </button>
          </div>
        </form>
      </Sheet>
    </section>
  )
}
