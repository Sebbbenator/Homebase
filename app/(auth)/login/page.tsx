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
        setSuccess('Account created! You can now sign in.')
        setTab('signin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center mb-4">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-50">HomeBase</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage your household together</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          {/* Tabs */}
          <div className="flex bg-neutral-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-neutral-700 text-neutral-50 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-neutral-700 text-neutral-50 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-sm bg-green-400/10 rounded-lg px-3 py-2">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
            >
              {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
