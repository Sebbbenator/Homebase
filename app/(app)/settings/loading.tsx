import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 animate-[page-enter_0.3s_ease-out_both]">
      {/* Header */}
      <div className="relative mb-6 pt-2">
        <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-purple-500/6 blur-3xl pointer-events-none" />
        <Skeleton className="h-8 w-44" />
      </div>

      {/* Profile card */}
      <div className="relative rounded-3xl overflow-hidden mb-4 border border-white/[0.06] bg-[#16161e] p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>

      {/* Home card */}
      <div className="bg-[#16161e] border border-white/[0.05] rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-7 h-7 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      {/* Leaderboard */}
      <div className="bg-[#16161e] border border-white/[0.05] rounded-3xl p-5 mb-4">
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.03]">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  )
}
