'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Clock, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Opgaver', icon: LayoutDashboard, badgeKey: 'tasks' as const },
  { href: '/shopping', label: 'Indkøb', icon: ShoppingCart, badgeKey: 'shopping' as const },
  { href: '/history', label: 'Historik', icon: Clock, badgeKey: null },
  { href: '/settings', label: 'Indstillinger', icon: Settings, badgeKey: null },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
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

      const [{ count: needsDoingCount }, { count: shoppingCount }] = await Promise.all([
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

      setBadges({ tasks: needsDoingCount ?? 0, shopping: shoppingCount ?? 0 })
    }
    loadBadges()
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c10]/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb">
      <div className="flex items-center max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
          const active = pathname === href
          const count = badgeKey ? badges[badgeKey] : 0
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onTouchStart={() => router.prefetch(href)}
              onMouseEnter={() => router.prefetch(href)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-all duration-200',
                active ? 'text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
              )}
            >
              {/* Active background pill */}
              {active && (
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-8 rounded-2xl bg-orange-500/10 -z-0" />
              )}

              <div className="relative z-10">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-all duration-200',
                    active && 'animate-[tab-pop_0.2s_cubic-bezier(0.34,1.56,0.64,1)_both]'
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-orange-500 text-white text-[9px] font-bold rounded-full px-1">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span className={cn('text-[11px] font-semibold tracking-wide z-10', active ? 'text-orange-400' : 'text-zinc-600')}>
                {label}
              </span>

              {/* Active dot */}
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
