import { useMemo, useState } from "react";
import { MODEL_ZONES } from "../../../data/modelEngine";
import { format, pctLabel, percent, sign, zoneCode } from "./helpers";
import { SectionHeading } from "./Controls";

function heatClass(before, after) {
  const value = percent(before, after);

  if (value === null) {
    return after > 0
      ? "bg-[#991B1B] text-white"
      : "bg-slate-100 text-slate-500";
  }

  if (Math.abs(value) < 0.05) {
    return "bg-slate-100 text-slate-500";
  }

  const magnitude = Math.abs(value);

  if (value > 0) {
    if (magnitude >= 20)
      return "bg-[#991B1B] text-white";

    if (magnitude >= 10)
      return "bg-[#B91C1C] text-white";

    if (magnitude >= 4)
      return "bg-[#F3B2B2] text-[#7F1D1D]";

    return "bg-[#FFF1F2] text-[#B91C1C]";
  }

  if (magnitude >= 20)
    return "bg-[#115E59] text-white";

  if (magnitude >= 10)
    return "bg-[#0F766E] text-white";

  if (magnitude >= 4)
    return "bg-[#BDE6E0] text-[#115E59]";

  return "bg-[#EDF8F6] text-[#0F766E]";
}

// OD HEATMAP COMPARISON

export default function ODHeatmap({ model }) {
  const [selected, setSelected] = useState([10, 2]);
  const [from, to] = selected;

  const before = model.matrixBefore[from]?.[to] || 0;
  const after = model.matrixAfter[from]?.[to] || 0;

  const changes = useMemo(
    () =>
      (model.pairs || [])
        .slice()
        .sort(
          (a, b) =>
            Math.abs(b.after - b.before) -
            Math.abs(a.after - a.before)
        )
        .slice(0, 6),
    [model]
  );

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <SectionHeading
        title="Perubahan perjalanan antarzona"
        description="Angka dalam setiap kotak adalah persentase perubahan OD. Merah berarti kenaikan, hijau kebiruan berarti penurunan, dan abu-abu berarti tetap. Pilih kotak untuk membaca volume detail."
      />

      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-600">
        {[
          ["bg-[#B91C1C]", "Kenaikan"],
          [
            "bg-slate-100 border border-slate-200",
            "Tetap",
          ],
          ["bg-[#0F766E]", "Penurunan"],
        ].map(([cls, text]) => (
          <span
            key={text}
            className="inline-flex items-center gap-2"
          >
            <span
              className={`h-3 w-3 rounded-[2px] ${cls}`}
            />
            {text}
          </span>
        ))}
      </div>

      <div className="max-w-full overflow-x-auto pb-4">
        <div className="min-w-[840px]">
          <div className="grid grid-cols-[60px_repeat(13,minmax(0,1fr))] gap-1 pb-1">
            <span className="self-end text-[10px] font-semibold text-slate-500">
              ASAL
            </span>

            {Array.from({ length: 13 }, (_, j) => (
              <span
                key={j}
                className="pb-2 text-center text-[10px] font-semibold text-slate-500"
              >
                {zoneCode(j)}
              </span>
            ))}
          </div>

          {model.matrixBefore.map((row, i) => (
            <div
              key={i}
              className="mb-1 grid grid-cols-[60px_repeat(13,minmax(0,1fr))] gap-1"
            >
              <span className="self-center text-[11px] font-semibold text-slate-600">
                {zoneCode(i)}
              </span>

              {row.map((value, j) => (
                <button
                  key={j}
                  type="button"
                  aria-label={`${zoneCode(i)} ke ${zoneCode(j)} perubahan ${pctLabel(
                    value,
                    model.matrixAfter[i]?.[j] || 0
                  )}`}
                  aria-pressed={
                    selected[0] === i &&
                    selected[1] === j
                  }
                  onClick={() => setSelected([i, j])}
                  className={`flex aspect-square min-h-[50px] items-center justify-center rounded-[4px] px-0.5 text-[10px] font-bold tabular-nums outline-offset-2 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#B91C1C] ${
                    heatClass(
                      value,
                      model.matrixAfter[i]?.[j] || 0
                    )
                  } ${
                    selected[0] === i &&
                    selected[1] === j
                      ? "z-10 ring-2 ring-[#B91C1C] ring-offset-2"
                      : ""
                  }`}
                >
                  {pctLabel(
                    value,
                    model.matrixAfter[i]?.[j] || 0
                  )}
                </button>
              ))}
            </div>
          ))}

          <p className="mt-2 pl-[60px] text-center text-[10px] font-semibold tracking-widest text-slate-400">
            ZONA TUJUAN
          </p>
        </div>
      </div>

      <div className="mt-5 border-l-[3px] border-[#B91C1C] bg-[#F8FAFC] px-5 py-5 sm:px-7">
        <p className="text-[11px] font-semibold text-slate-500">
          Hubungan terpilih
        </p>

        <h3 className="mt-1 text-lg font-bold">
          {zoneCode(from)} → {zoneCode(to)}
        </h3>

        <p className="mt-1 text-[12px] leading-5 text-slate-500">
          {MODEL_ZONES[from]?.name} menuju{" "}
          {MODEL_ZONES[to]?.name}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-4">
          {[
            ["Sebelum", format(before)],
            ["Sesudah", format(after)],
            ["Selisih", sign(after - before)],
            ["Perubahan", pctLabel(before, after)],
          ].map(([label, value], i) => (
            <div key={label}>
              <p className="text-xs text-slate-500">
                {label}
              </p>

              <p
                className={`mt-1 text-xl font-bold tabular-nums ${
                  i >= 2
                    ? after > before
                      ? "text-[#B91C1C]"
                      : after < before
                        ? "text-[#0F766E]"
                        : "text-slate-700"
                    : "text-slate-900"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-slate-500">
          Volume Before, After dan selisih dalam smp/jam;
          persentase relatif terhadap Before.
        </p>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold tracking-tight">
          Hubungan dengan perubahan absolut terbesar
        </h3>

        <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
          {changes.map((pair) => (
            <button
              type="button"
              key={`${pair.from}-${pair.to}`}
              onClick={() =>
                setSelected([pair.from, pair.to])
              }
              className="grid w-full grid-cols-[1fr_90px_100px] items-center gap-3 py-3 text-left text-xs hover:bg-slate-50 sm:grid-cols-[1fr_140px_140px_110px]"
            >
              <span className="font-semibold text-slate-800">
                {zoneCode(pair.from)} →{" "}
                {zoneCode(pair.to)}
              </span>

              <span className="text-right tabular-nums text-slate-500">
                {format(pair.before)}
              </span>

              <span className="text-right tabular-nums text-slate-500">
                {format(pair.after)}
              </span>

              <span
                className={`hidden text-right font-bold tabular-nums sm:block ${
                  pair.after > pair.before
                    ? "text-[#B91C1C]"
                    : "text-[#0F766E]"
                }`}
              >
                {pctLabel(pair.before, pair.after)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
