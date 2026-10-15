'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="h-12 w-full rounded-2xl bg-danger-soft text-danger-ink font-extrabold text-[15px] flex items-center justify-center gap-2"
    >
      <LogOut className="w-4 h-4" /> Log ud
    </button>
  )
}
