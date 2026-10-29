import { format, pctLabel, percent, sign } from "./helpers";

export default function ComparisonSummary({ model }) {
  const change = percent(
    model.beforeTotal,
    model.afterTotal
  );

  const color =
    change > 0
      ? "text-[#B91C1C]"
      : change < 0
        ? "text-[#0F766E]"
        : "text-slate-700";

  return (
    <div className="mb-10 border-y border-slate-200">
      <div className="grid gap-6 py-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Sebelum TDM
          </p>

          <p className="mt-2 break-words text-[clamp(2rem,5vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums">
            {format(model.beforeTotal)}
          </p>

          <p className="mt-2 text-[11px] text-slate-500">
            smp/jam · horizon 2041
          </p>
        </div>

        <div className="sm:border-l sm:border-slate-200 sm:pl-9">
          <p className="text-xs font-medium text-slate-500">
            Sesudah TDM
          </p>

          <p
            className={`mt-2 break-words text-[clamp(2rem,5vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums ${color}`}
          >
            {format(model.afterTotal)}
          </p>

          <p className="mt-2 text-[11px] text-slate-500">
            smp/jam · horizon 2041
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 py-6">
        <div>
          <p className="text-xs text-slate-500">
            Perubahan permintaan
          </p>

          <p
            className={`mt-1 text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.06em] tabular-nums ${color}`}
          >
            {pctLabel(
              model.beforeTotal,
              model.afterTotal
            )}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-slate-500">
            Selisih ekuivalen
          </p>

          <p className="mt-1 text-xl font-semibold tabular-nums">
            {sign(
              model.afterTotal - model.beforeTotal
            )}{" "}
            smp/jam
          </p>
        </div>
      </div>
    </div>
  );
}
