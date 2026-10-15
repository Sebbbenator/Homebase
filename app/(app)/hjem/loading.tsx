export default function HjemLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-7 w-36" />
        </div>
        <div className="skeleton w-10 h-10 rounded-full" />
      </div>
      <div className="skeleton h-[118px] rounded-card" />
      <div className="skeleton h-6 w-28" />
      <div className="skeleton h-[220px] rounded-card" />
      <div className="skeleton h-[180px] rounded-card" />
    </div>
  )
}
