'use client'

import { useState } from 'react'
import { createHome, joinHome } from '@/lib/actions/home'
import { useRouter } from 'next/navigation'
import { Home, Users } from 'lucide-react'

export function HomeSetup() {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createHome(name.trim())
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create home')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await joinHome(code.trim())
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center mb-4">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-50">Welcome!</h1>
          <p className="text-neutral-400 text-sm mt-1 text-center">
            Create a new home or join an existing one
          </p>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex bg-neutral-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab('create'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'create'
                  ? 'bg-neutral-700 text-neutral-50'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Create
            </button>
            <button
              onClick={() => { setTab('join'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'join'
                  ? 'bg-neutral-700 text-neutral-50'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Join
            </button>
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Home Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. The Smiths"
                  className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
              >
                {loading ? 'Creating...' : 'Create Home'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Invite Code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="e.g. a1b2c3d4"
                  className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition font-mono"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
              >
                {loading ? 'Joining...' : 'Join Home'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
