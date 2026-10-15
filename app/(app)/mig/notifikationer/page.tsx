import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireHome } from '@/lib/data/session'
import { getMyPrefs } from '@/lib/actions/notifications'
import { NotificationSettings } from '@/components/notifications/NotificationSettings'
import { PushPrompt } from '@/components/push/PushPrompt'

export default async function NotifikationerPage() {
  await requireHome()
  const prefs = await getMyPrefs()

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/mig" aria-label="Tilbage" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-muted hover:bg-soft">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-3xl font-bold leading-none">Notifikationer</h1>
      </div>
      <PushPrompt />
      <NotificationSettings initial={prefs} />
    </div>
  )
}
