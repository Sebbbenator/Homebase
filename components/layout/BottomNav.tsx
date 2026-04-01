'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Clock, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tasks', icon: LayoutDashboard, badgeKey: 'tasks' as const },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart, badgeKey: 'shopping' as const },
  { href: '/history', label: 'History', icon: Clock, badgeKey: null },
  { href: '/settings', label: 'Settings', icon: Settings, badgeKey: null },
]

export function BottomNav() {
  const pathname = usePathname()
  const [badges, setBadges] = useState<{ tasks: number; shopping: number }>({ tasks: 0, shopping: 0 })

  useEffect(() => {
    async function loadBadges() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('home_members')
        .select('home_id')
        .eq('user_id', user.id)
        .single()
      if (!membership) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const [{ data: taskData }, { count: presetNeedsCount }, { count: shoppingCount }] = await Promise.all([
        supabase
          .from('tasks')
          .select('due_date, repeat_type')
          .eq('home_id', membership.home_id)
          .eq('is_completed', false)
          .eq('is_preset', false),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('home_id', membership.home_id)
          .eq('is_preset', true)
          .eq('preset_status', 'needs_doing'),
        supabase
          .from('shopping_items')
          .select('*', { count: 'exact', head: true })
          .eq('home_id', membership.home_id)
          .eq('is_purchased', false),
      ])

      // Only count tasks that are actually visible (exclude future repeating tasks)
      const visibleTasks = (taskData ?? []).filter((t) => {
        if (t.repeat_type !== 'none' && t.due_date && t.due_date > todayISO) return false
        return true
      })

      setBadges({ tasks: visibleTasks.length + (presetNeedsCount ?? 0), shopping: shoppingCount ?? 0 })
    }
    loadBadges()
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 safe-area-pb">
      <div className="flex items-center max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
          const active = pathname === href
          const count = badgeKey ? badges[badgeKey] : 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-colors',
                active ? 'text-orange-400' : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]')} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-orange-500 text-white text-[9px] font-bold rounded-full px-1">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
