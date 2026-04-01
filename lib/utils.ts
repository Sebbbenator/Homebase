import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function format(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return email.substring(0, 2).toUpperCase()
}

export function isOverdue(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false
  const due = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export function smartDueDate(dueDateStr: string | null): { label: string; color: string } | null {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: 'text-red-400' }
  if (diffDays === 0) return { label: 'Today', color: 'text-amber-400' }
  if (diffDays === 1) return { label: 'Tomorrow', color: 'text-yellow-400' }
  if (diffDays <= 7) return { label: `In ${diffDays} days`, color: 'text-neutral-400' }
  return { label: formatDate(dueDateStr), color: 'text-neutral-500' }
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
