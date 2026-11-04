export default function SimulationPreviewSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:rounded-3xl sm:p-3"
    >
      <div className="animate-pulse rounded-xl bg-slate-100 sm:rounded-2xl">
        <div className="h-[430px] sm:h-[570px] lg:h-[660px]" />
      </div>
      <div className="grid gap-5 p-3 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}