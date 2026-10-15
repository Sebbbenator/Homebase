export default function OpgaverLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-3 w-48" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-9 w-14 rounded-full" />
        <div className="skeleton h-9 w-24 rounded-full" />
        <div className="skeleton h-9 w-20 rounded-full" />
      </div>
      <div className="skeleton h-5 w-24" />
      <div className="skeleton h-[230px] rounded-card" />
      <div className="skeleton h-5 w-28" />
      <div className="skeleton h-[150px] rounded-card" />
    </div>
  )
}
