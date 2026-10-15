import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export function formatDayHeading(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const that = new Date(d)
  that.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - that.getTime()) / 86_400_000)
  if (diff === 0) return 'I dag'
  if (diff === 1) return 'I går'
  return d.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'lige nu'
  if (mins < 60) return `${mins} min`
  if (hours < 24) return `${hours} t`
  if (days === 1) return 'i går'
  if (days < 7) return `${days} d`
  return formatDate(dateStr)
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Godnat'
  if (h < 10) return 'Godmorgen'
  if (h < 12) return 'Godformiddag'
  if (h < 18) return 'Goddag'
  return 'Godaften'
}

export function displayName(profile: { display_name: string | null } | undefined, fallback?: string | null) {
  return profile?.display_name || fallback?.split('@')[0] || 'Ukendt'
}

export function haptic(ms = 12) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms) } catch { /* ikke understøttet */ }
  }
}
