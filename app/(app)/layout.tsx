import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import { HomeSetup } from '@/components/layout/HomeSetup'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user has a home
  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
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
