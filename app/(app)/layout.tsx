import { redirect } from 'next/navigation'
import { getCurrentHome, getSessionUser } from '@/lib/actions/session'
import { BottomNav } from '@/components/layout/BottomNav'
import { HomeSetup } from '@/components/layout/HomeSetup'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  // Dedupes with any page-level `getCurrentHome()` call in the same request
  // thanks to React's `cache()`.
  const home = await getCurrentHome()
  if (!home) {
    return <HomeSetup />
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      <div className="animate-[page-enter_0.3s_ease-out_both]">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
