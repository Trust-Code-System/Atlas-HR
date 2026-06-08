export function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full animate-pulse">
      {/* Hero bar */}
      <div className="h-24 rounded-[24px] bg-navy-200 mb-8" />
      {/* Cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-navy-100" />
        ))}
      </div>
      {/* Main content block */}
      <div className="space-y-3">
        <div className="h-10 rounded-2xl bg-navy-100 w-1/3" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-navy-100" />
        ))}
      </div>
    </div>
  );
}
