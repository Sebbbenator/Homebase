import Link from 'next/link'
import { Bell, ChevronRight, Clock, ListChecks } from 'lucide-react'
import { requireHome } from '@/lib/data/session'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { InviteCard } from '@/components/profile/InviteCard'
import { SignOutButton } from '@/components/profile/SignOutButton'
import { Avatar } from '@/components/ui/Avatar'
import { displayName } from '@/lib/utils'
import type { Home, Profile } from '@/lib/types'

export default async function MigPage() {
  const { supabase, user, homeId } = await requireHome()

  const [{ data: profile }, { data: home }, { data: members }] = await Promise.all([
    supabase.from('profiles').select().eq('id', user.id).maybeSingle(),
    supabase.from('homes').select().eq('id', homeId).maybeSingle(),
    supabase.from('home_members').select('user_id').eq('home_id', homeId),
  ])

  const ids = (members ?? []).map((m) => m.user_id)
  const { data: profileRows } = ids.length ? await supabase.from('profiles').select().in('id', ids) : { data: [] }
  const others = ((profileRows ?? []) as Profile[]).filter((p) => p.id !== user.id)

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold leading-none">Mig</h1>

      <ProfileCard profile={(profile as Profile | null) ?? null} email={user.email ?? ''} />

      <div className="grid grid-cols-2 gap-2">
        <Link href="/opgaver" className="bg-card rounded-2xl shadow-card px-4 py-3.5 flex items-center gap-3 text-[13px] font-extrabold">
          <ListChecks className="w-5 h-5 text-accent-ink" /> Opgaver
        </Link>
        <Link href="/mig/historik" className="bg-card rounded-2xl shadow-card px-4 py-3.5 flex items-center gap-3 text-[13px] font-extrabold">
          <Clock className="w-5 h-5 text-info-ink" /> Historik
        </Link>
      </div>

      {home && (
        <section className="bg-card rounded-card shadow-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold text-faint uppercase tracking-wider">Husstand</span>
              <span className="font-display text-xl font-semibold">{(home as Home).name}</span>
            </div>
            <div className="flex -space-x-2">
              {others.map((p) => (
                <Avatar key={p.id} id={p.id} emoji={p.avatar_emoji} name={displayName(p)} size="sm" className="ring-2 ring-card" />
              ))}
            </div>
          </div>
          <InviteCard code={(home as Home).invite_code} />
        </section>
      )}

      <Link href="/mig/notifikationer" className="bg-card rounded-card shadow-card px-4 py-3.5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-extrabold">Notifikationer</span>
          <span className="text-xs font-semibold text-muted">Push, påmindelser og stille timer</span>
        </span>
        <ChevronRight className="w-5 h-5 text-faint" />
      </Link>

      <SignOutButton />

      <p className="text-center text-[11px] font-bold text-faint pb-2 flex items-center justify-center gap-1">
        HomeBase <ChevronRight className="w-3 h-3" /> {user.email}
      </p>
    </div>
  )
}
