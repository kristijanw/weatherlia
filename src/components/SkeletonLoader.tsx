export function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <div className="h-6 bg-white/10 rounded w-1/3" />
        <div className="h-20 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-1/4" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 h-32" />
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 h-48" />
    </div>
  );
}
