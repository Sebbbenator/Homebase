'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { House, CircleCheck, ShoppingBasket, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  tasksCount: number
  shoppingCount: number
}

export function BottomNav({ tasksCount, shoppingCount }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const items = [
    { href: '/hjem', label: 'Hjem', icon: House, count: 0, countClass: '' },
    { href: '/opgaver', label: 'Opgaver', icon: CircleCheck, count: tasksCount, countClass: 'bg-danger' },
    { href: '/indkoeb', label: 'Indkøb', icon: ShoppingBasket, count: shoppingCount, countClass: 'bg-info' },
    { href: '/mig', label: 'Mig', icon: UserRound, count: 0, countClass: '' },
  ]

  return (
    <nav
      aria-label="Hovedmenu"
      className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-line safe-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-2">
        {items.map(({ href, label, icon: Icon, count, countClass }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onTouchStart={() => router.prefetch(href)}
              onMouseEnter={() => router.prefetch(href)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 min-w-[68px] px-3 py-2 rounded-2xl text-[11px] font-extrabold transition-colors',
                active ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink'
              )}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={2.2} />
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    'absolute top-1 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center',
                    countClass
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
