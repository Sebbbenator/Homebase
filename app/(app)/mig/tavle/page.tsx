import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireHome } from '@/lib/data/session'
import { NotesView } from '@/components/notes/NotesView'
import type { Note, Profiles } from '@/lib/types'

export default async function TavlePage() {
  const { supabase, homeId } = await requireHome()

  const [{ data: notes }, { data: members }] = await Promise.all([
    supabase.from('notes').select().eq('home_id', homeId).order('updated_at', { ascending: false }),
    supabase.from('home_members').select('user_id').eq('home_id', homeId),
  ])
  const ids = (members ?? []).map((m) => m.user_id)
  const { data: profileRows } = ids.length ? await supabase.from('profiles').select().in('id', ids) : { data: [] }
  const profiles: Profiles = {}
  for (const p of profileRows ?? []) profiles[p.id] = p

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/mig" aria-label="Tilbage" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-muted hover:bg-soft">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-3xl font-bold leading-none">Opslagstavle</h1>
      </div>
      <NotesView notes={(notes ?? []) as Note[]} profiles={profiles} />
    </div>
  )
}
