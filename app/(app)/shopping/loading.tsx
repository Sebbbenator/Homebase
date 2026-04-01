import { ShoppingItemSkeleton } from '@/components/ui/Skeleton'

export default function ShoppingLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 animate-[page-enter_0.3s_ease-out_both]">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-3 w-16" />
      </div>

      <div className="flex gap-2 mb-6">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="skeleton h-10 w-20 rounded-xl" />
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <ShoppingItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
