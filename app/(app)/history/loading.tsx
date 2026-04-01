import { ActivitySkeleton } from '@/components/ui/Skeleton'

export default function HistoryLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 animate-[page-enter_0.3s_ease-out_both]">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-6 w-20" />
        <div className="skeleton h-3 w-40" />
      </div>

      <div className="space-y-6">
        <div>
          <div className="skeleton h-3 w-24 mb-3 mx-1" />
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
