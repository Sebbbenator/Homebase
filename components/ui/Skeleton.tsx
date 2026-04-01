import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShoppingItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900">
      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-10 rounded-full" />
    </div>
  )
}

export function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  )
}
