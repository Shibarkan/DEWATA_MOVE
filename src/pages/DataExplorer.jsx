
import { useState } from "react";
import { Database, ArrowRightLeft, Info } from "lucide-react";

import Reveal from "../components/ui/Reveal";

import {
  zoneNames,
  mat2026,
  matTotal,
  rowTotals,
  columnTotals,
  intraZonalTotal,
  odPairs,
  formatNumber,
  validateMAT,
} from "../data/mobility";

export default function DataExplorer() {
  const [selectedZone, setSelectedZone] = useState(0);
  const [showValues, setShowValues] = useState(true);

  const maxValue = Math.max(...mat2026.flat());
  const validation = validateMAT();

  const departures = rowTotals[selectedZone];
  const arrivals = columnTotals[selectedZone];

  const topPairs = odPairs
    .filter((pair) => pair.origin !== pair.destination)
    .slice(0, 6);

  return (
    <div className="bg-white">
      {/* HEADER */}
      <section className="px-5 pb-16 pt-20 text-center sm:pt-28">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Data Explorer
            </p>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
              Understanding
              <br />
              <span className="text-[#B91C1C]">
                Mobility Data.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
              Eksplorasi Matriks Asal Tujuan 2026 yang
              terdiri dari 13 zona studi dan digunakan
              sebagai input dasar pemodelan transportasi.
            </p>
          </div>
        </Reveal>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        {/* SUMMARY */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total MAT", formatNumber(matTotal), "smp/jam"],
            ["Jumlah Zona", "13", "zona studi"],
            ["Intrazona", formatNumber(intraZonalTotal), "smp/jam"],
            [
              "Validasi",
              validation.valid ? "VALID" : "ERROR",
              "Struktur MAT 13 × 13",
            ],
          ].map(([label, value, unit], index) => (
            <Reveal key={label} delay={index * 80}>
              <div className="rounded-3xl border border-slate-200 p-6">
                <p className="text-xs font-medium text-slate-500">
                  {label}
                </p>

                <p className="mt-3 text-2xl font-black text-[#B91C1C]">
                  {value}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {unit}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ZONE EXPLORER */}
        <Reveal>
          <div className="mb-12 rounded-3xl border border-slate-200 p-6 sm:p-8">
            <div className="mb-7 flex items-center gap-3">
              <Database className="text-[#B91C1C]" />
              <h2 className="text-xl font-bold text-slate-900">
                Zone Explorer
              </h2>
            </div>

            <label
              htmlFor="zone-select"
              className="mb-3 block text-xs font-semibold text-slate-500"
            >
              Select Origin Zone
            </label>

            <select
              id="zone-select"
              value={selectedZone}
              onChange={(event) =>
                setSelectedZone(Number(event.target.value))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#B91C1C]"
            >
              {zoneNames.map((name, index) => (
                <option key={index} value={index}>
                  Z{index + 1} — {name}
                </option>
              ))}
            </select>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#FAFAFA] p-6">
                <p className="text-xs text-slate-500">
                  Bangkitan / Origin Row Total
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {formatNumber(departures)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  smp/jam
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAFAFA] p-6">
                <p className="text-xs text-slate-500">
                  Tarikan / Destination Column Total
                </p>

                <p className="mt-3 text-3xl font-bold text-[#B91C1C]">
                  {formatNumber(arrivals)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  smp/jam
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* MAT TABLE */}
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Origin–Destination Matrix
                </h2>

                <p className="mt-2 text-xs text-slate-500">
                  MAT 2026 • 13 × 13 • smp/jam
                </p>
              </div>

              <button
                onClick={() => setShowValues(!showValues)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {showValues ? "Heatmap Only" : "Show Values"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-[#FAFAFA] px-4 py-4 text-left">
                      O / D
                    </th>

                    {zoneNames.map((_, index) => (
                      <th
                        key={index}
                        className="border-b border-slate-200 px-3 py-4 text-center"
                      >
                        Z{index + 1}
                      </th>
                    ))}

                    <th className="border-b border-slate-200 px-4 py-4">
                      Origin Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {mat2026.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        selectedZone === i ? "bg-red-50/30" : ""
                      }
                    >
                      <th
                        className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-3 text-left font-bold text-slate-800"
                      >
                        Z{i + 1}
                      </th>

                      {row.map((value, j) => {
                        const intensity = value / maxValue;
                        const alpha = 0.05 + intensity * 0.65;

                        return (
                          <td
                            key={j}
                            title={`Z${i + 1} → Z${j + 1}: ${formatNumber(value)} smp/jam`}
                            style={{
                              backgroundColor: `rgba(185,28,28,${alpha})`,
                              color:
                                intensity > 0.55
                                  ? "#ffffff"
                                  : "#334155",
                            }}
                            className="border-b border-r border-white/40 px-2 py-3 text-center tabular-nums"
                          >
                            {showValues ? formatNumber(value) : " "}
                          </td>
                        );
                      })}

                      <td className="border-b border-slate-100 px-3 py-3 text-center font-bold text-slate-800">
                        {formatNumber(rowTotals[i])}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-50 font-bold">
                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 text-left">
                      Dest. Total
                    </th>

                    {columnTotals.map((value, index) => (
                      <td
                        key={index}
                        className="px-2 py-4 text-center tabular-nums"
                      >
                        {formatNumber(value)}
                      </td>
                    ))}

                    <td className="px-3 py-4 text-center">
                      {formatNumber(matTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* TOP OD PAIRS */}
        <section className="mt-16">
          <Reveal>
            <div className="mb-8 flex items-center gap-3">
              <ArrowRightLeft className="text-[#B91C1C]" />

              <h2 className="text-2xl font-bold text-slate-900">
                Priority OD Movements
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            {topPairs.map((pair, index) => (
              <Reveal
                key={`${pair.origin}-${pair.destination}`}
                delay={(index % 2) * 100}
              >
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 transition-all hover:border-red-200 hover:shadow-md">
                  <div>
                    <p className="text-xs text-slate-400">
                      Rank {index + 1}
                    </p>

                    <p className="mt-2 text-lg font-bold text-slate-900">
                      Z{pair.origin} → Z{pair.destination}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {zoneNames[pair.origin - 1]}
                    </p>
                    <p className="text-xs text-slate-400">
                      menuju {zoneNames[pair.destination - 1]}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-bold text-[#B91C1C]">
                      {formatNumber(pair.volume)}
                    </p>
                    <p className="text-xs text-slate-400">
                      smp/jam
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* DATA DISCLAIMER */}
        <div className="mt-12 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <Info
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <p className="text-xs leading-7 text-blue-900">
            Data berasal dari MAT studi kasus 2026.
            Nilai dalam satuan smp/jam dan tidak boleh
            langsung ditafsirkan sebagai jumlah penumpang.
            Angka pada halaman ini adalah input dan hasil
            agregasi matriks, bukan hasil traffic assignment.
          </p>
        </div>
      </div>
    </div>
  );
}
