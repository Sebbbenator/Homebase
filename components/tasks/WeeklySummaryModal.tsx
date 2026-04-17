'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Trophy } from 'lucide-react'

interface RankedEntry {
  userId: string
  name: string
  emoji: string
  count: number
  rank: number
}

function medal(rank: number): string {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return ''
}

function opgave(n: number): string {
  return n === 1 ? '1 opgave' : `${n} opgaver`
}

/** Returns "YYYY-Www" for the current Copenhagen week */
function getCphWeekKey(): string {
  const now = new Date()
  const todayCph = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Copenhagen' })
  const [y, m, d] = todayCph.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay() || 7 // Mon=1 … Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

const STORAGE_KEY = 'weekly_summary_seen'

export function WeeklySummaryModal() {
  const [open, setOpen] = useState(false)
  const [ranked, setRanked] = useState<RankedEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentWeek = getCphWeekKey()
    const seen = localStorage.getItem(STORAGE_KEY)
    if (seen === currentWeek) return

    setLoading(true)
    fetch('/api/weekly-summary')
      .then((r) => r.json())
      .then((data) => {
        if (data.ranked && data.ranked.length > 0) {
          setRanked(data.ranked)
          setOpen(true)
        } else {
          // Nothing to show — mark as seen so we don't re-check every time
          localStorage.setItem(STORAGE_KEY, currentWeek)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, getCphWeekKey())
    setOpen(false)
  }

  if (loading || !open) return null

  const winner = ranked[0]

  return (
    <Modal open={open} onClose={handleClose} title="Ugentlig opsummering">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-3">
            <Trophy className="w-7 h-7 text-orange-400" />
          </div>
          <p className="text-sm text-zinc-400 text-center">
            Her er ugens resultat for jeres hjem
          </p>
        </div>

        {/* Ranked list */}
        <div className="space-y-2">
          {ranked.map((entry) => {
            const isWinner = entry.rank === 0
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                  isWinner
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 ring-1 ring-orange-500/30'
                    : 'bg-white/[0.04]'
                }`}
              >
                <span className="text-2xl">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isWinner ? 'text-orange-300' : 'text-zinc-200'}`}>
                    {entry.name}
                  </p>
                  <p className="text-xs text-zinc-500">{opgave(entry.count)}</p>
                </div>
                <span className="text-xl">{medal(entry.rank)}</span>
              </div>
            )
          })}
        </div>

        {winner && (
          <p className="text-center text-xs text-zinc-500 pt-1">
            Tillykke til {winner.name}! {winner.emoji}
          </p>
        )}

        <button
          onClick={handleClose}
          className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-2xl text-sm transition-colors mt-2"
        >
          Fedt, luk!
        </button>
      </div>
    </Modal>
  )
}
