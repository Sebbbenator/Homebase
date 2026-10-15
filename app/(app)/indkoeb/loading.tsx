export default function IndkoebLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-28" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton h-11 w-24 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-12 flex-1 rounded-2xl" />
        <div className="skeleton h-12 w-20 rounded-2xl" />
        <div className="skeleton h-12 w-12 rounded-2xl" />
      </div>
      <div className="skeleton h-[260px] rounded-card" />
    </div>
  )
}
