'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { House } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const supabase = createClient()
    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/hjem')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Kontoen er oprettet – du kan logge ind nu.')
        setTab('signin')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /invalid login/i.test(msg) ? 'Forkert e-mail eller adgangskode.'
        : /already registered/i.test(msg) ? 'Der findes allerede en konto med den e-mail.'
        : msg || 'Noget gik galt – prøv igen.'
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
            <h1 className="font-display text-3xl font-bold leading-none">HomeBase</h1>
            <p className="text-sm font-semibold text-muted mt-1.5">Opgaver, indkøb og point – sammen.</p>
          </div>
        </div>

        <div className="bg-card rounded-[28px] shadow-card p-5 flex flex-col gap-5">
          <div className="flex bg-soft rounded-full p-1" role="tablist">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={cn('flex-1 h-10 rounded-full text-sm font-extrabold transition-colors', tab === t ? 'bg-card text-ink shadow-card' : 'text-muted')}
              >
                {t === 'signin' ? 'Log ind' : 'Opret konto'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-extrabold text-muted mb-2">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="dig@eksempel.dk"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[13px] font-extrabold text-muted mb-2">Adgangskode</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                placeholder="Mindst 6 tegn"
                className={inputClass}
              />
            </div>

            {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}
            {success && <p className="text-good-ink text-sm font-bold bg-good-soft rounded-xl px-3 py-2">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? 'Et øjeblik…' : tab === 'signin' ? 'Log ind' : 'Opret konto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
