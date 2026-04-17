'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Konto oprettet! Du kan nu logge ind.')
        setTab('signin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-end justify-center bg-[#0c0c10] px-4 pb-0 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-orange-600/10 blur-[80px]" />
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[60px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 pb-10">
        <div className="flex flex-col items-center mb-8 pt-16">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-orange-500/30 blur-xl scale-110" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Home className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HomeBase</h1>
          <p className="text-zinc-500 text-sm mt-1.5">Styr jeres hjem sammen</p>
        </div>

        <div className="bg-[#16161e] rounded-3xl border border-white/[0.06] p-6 shadow-2xl shadow-black/50">
          <div className="flex bg-white/[0.04] rounded-2xl p-1 mb-6 gap-1">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  tab === t
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'signin' ? 'Log ind' : 'Opret konto'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="dig@eksempel.dk"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Adgangskode</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-orange-600/25 active:scale-[0.98]"
            >
              {loading ? 'Vent...' : tab === 'signin' ? 'Log ind' : 'Opret konto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
