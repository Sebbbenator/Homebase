import { TaskCardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 animate-[page-enter_0.3s_ease-out_both]">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="skeleton w-9 h-9 rounded-full" />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="skeleton h-8 w-14 rounded-full" />
        <div className="skeleton h-8 w-16 rounded-full" />
        <div className="skeleton h-8 w-16 rounded-full" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
