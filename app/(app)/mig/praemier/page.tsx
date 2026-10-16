import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireHome } from '@/lib/data/session'
import { RewardsView } from '@/components/rewards/RewardsView'
import { pointsByUser } from '@/lib/points'
import type { Completion, Profiles, Reward, RewardClaim } from '@/lib/types'

export default async function PraemierPage() {
  const { supabase, user, homeId } = await requireHome()

  const [{ data: rewards }, { data: claims }, { data: completions }, { data: members }] = await Promise.all([
    supabase.from('rewards').select().eq('home_id', homeId).eq('active', true).order('cost'),
    supabase.from('reward_claims').select().eq('home_id', homeId).order('created_at', { ascending: false }),
    supabase.from('preset_completions').select('id, task_id, home_id, completed_by, completed_at, helper_id, helper_ids, points').eq('home_id', homeId),
    supabase.from('home_members').select('user_id').eq('home_id', homeId),
  ])

  const memberIds = (members ?? []).map((m) => m.user_id)
  const { data: profileRows } = memberIds.length ? await supabase.from('profiles').select().in('id', memberIds) : { data: [] }
  const profiles: Profiles = {}
  for (const p of profileRows ?? []) profiles[p.id] = p

  const earned = pointsByUser(((completions ?? []) as Completion[]).map((c) => ({ ...c, points: c.points ?? 10 })), null)

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/mig" aria-label="Tilbage" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-muted hover:bg-soft">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-3xl font-bold leading-none">Præmier</h1>
      </div>
      <RewardsView
        rewards={(rewards ?? []) as Reward[]}
        claims={(claims ?? []) as RewardClaim[]}
        earned={earned}
        memberIds={memberIds}
        profiles={profiles}
        currentUserId={user.id}
      />
    </div>
  )
}
