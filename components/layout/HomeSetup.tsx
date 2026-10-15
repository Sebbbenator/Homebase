'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { House, Users } from 'lucide-react'
import { createHome, joinHome } from '@/lib/actions/home'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'

export function HomeSetup() {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'create') await createHome(name)
      else await joinHome(code)
      router.replace('/hjem')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /not found/i.test(msg) ? 'Koden blev ikke fundet – tjek den igen.'
        : /already a member/i.test(msg) ? 'Du er allerede med i den husstand.'
        : msg || 'Noget gik galt.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="w-16 h-16 rounded-[22px] bg-accent flex items-center justify-center shadow-float">
            <House className="w-8 h-8 text-ink" strokeWidth={2.4} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold leading-none">Velkommen!</h1>
            <p className="text-sm font-semibold text-muted mt-1.5">Opret en husstand eller kom med i en eksisterende.</p>
          </div>
        </div>

        <div className="bg-card rounded-[28px] shadow-card p-5 flex flex-col gap-5">
          <div className="flex bg-soft rounded-full p-1" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'create'} onClick={() => { setTab('create'); setError('') }}
              className={cn('flex-1 h-10 rounded-full text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors', tab === 'create' ? 'bg-card text-ink shadow-card' : 'text-muted')}>
              <House className="w-4 h-4" /> Opret
            </button>
            <button type="button" role="tab" aria-selected={tab === 'join'} onClick={() => { setTab('join'); setError('') }}
              className={cn('flex-1 h-10 rounded-full text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors', tab === 'join' ? 'bg-card text-ink shadow-card' : 'text-muted')}>
              <Users className="w-4 h-4" /> Kom med
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {tab === 'create' ? (
              <div>
                <label htmlFor="home-name" className="block text-[13px] font-extrabold text-muted mb-2">Hvad hedder jeres hjem?</label>
                <input id="home-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="fx Galthens hus" className={inputClass} autoFocus />
              </div>
            ) : (
              <div>
                <label htmlFor="invite-code" className="block text-[13px] font-extrabold text-muted mb-2">Invitationskode</label>
                <input id="invite-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="fx a1b2c3d4" className={cn(inputClass, 'font-mono tracking-wider')} autoFocus />
              </div>
            )}

            {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-60 disabled:shadow-none">
              {loading ? 'Et øjeblik…' : tab === 'create' ? 'Opret husstand' : 'Kom med'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
