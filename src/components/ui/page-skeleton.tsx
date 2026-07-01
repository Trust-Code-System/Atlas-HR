export function PageSkeleton() {
  return (
    <div
      aria-label="Loading page"
      role="status"
      className="w-full p-6 lg:p-8"
    >
      <div className="mx-auto w-full max-w-6xl animate-pulse">
        <div className="relative mb-8 overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_18px)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10" />
              <div className="space-y-2">
                <div className="h-6 w-36 rounded-lg bg-white/35" />
                <div className="h-4 w-48 rounded-lg bg-blue-300/35" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-32 rounded-xl bg-white/10 ring-1 ring-white/10" />
              <div className="h-10 w-36 rounded-xl bg-white/10 ring-1 ring-white/10" />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            "from-blue-400 to-blue-600",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-violet-400 to-purple-500",
          ].map((strip) => (
            <div
              key={strip}
              className="relative h-36 overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 shadow-sm"
            >
              <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${strip}`} />
              <div className="mb-5 h-10 w-10 rounded-xl bg-navy-100" />
              <div className="mb-3 h-8 w-16 rounded-lg bg-navy-200" />
              <div className="h-4 w-28 rounded-lg bg-navy-100" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-navy-200 bg-navy-50/80 px-5 py-4">
            <div className="col-span-4 h-3 rounded bg-navy-200" />
            <div className="col-span-3 hidden h-3 rounded bg-navy-200 md:block" />
            <div className="col-span-3 hidden h-3 rounded bg-navy-200 sm:block" />
            <div className="col-span-2 h-3 rounded bg-navy-200" />
          </div>
          <div className="divide-y divide-navy-100">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="grid grid-cols-12 items-center gap-4 px-5 py-4">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-navy-200" />
                    <div className="h-3 w-44 rounded bg-navy-100" />
                  </div>
                </div>
                <div className="col-span-3 hidden h-4 rounded bg-navy-100 md:block" />
                <div className="col-span-3 hidden h-7 rounded-full bg-navy-100 sm:block" />
                <div className="col-span-2 h-7 rounded-full bg-emerald-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
