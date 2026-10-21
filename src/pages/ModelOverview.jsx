
import {
  ArrowRight,
  Database,
  Layers3,
  Map,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";
import { matTotal, formatNumber } from "../data/mobility";

const metrics = [
  "Traffic Volume",
  "V/C Ratio",
  "Travel Time",
  "Vehicle Kilometers Traveled",
  "Vehicle Hours Traveled",
  "Transit Mode Share",
];

function ModelCanvas({ label }) {
  return (
    <div className="relative flex min-h-[350px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 text-center sm:min-h-[450px]">

      <div className="preview-grid absolute inset-0 opacity-50" />

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-100 bg-white text-[#B91C1C] shadow-lg">
          <Layers3 size={35} strokeWidth={1.5} />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
          {label}
        </p>

        <h3 className="mt-4 text-2xl font-bold text-slate-900">
          Modeling Environment
        </h3>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          Area integrasi peta 2D MapLibre,
          visualisasi 3D Three.js,
          dan pembebanan lalu lintas.
        </p>

        <span className="mt-7 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          Model Not Yet Available
        </span>
      </div>
    </div>
  );
}

function MetricList() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <h3 className="mb-5 text-lg font-bold text-slate-900">
        Performance Indicators
      </h3>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric}
            className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"
          >
            <span className="text-sm text-slate-600">
              {metric}
            </span>

            <span className="shrink-0 text-xs text-slate-400">
              Data Required
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comparison({ onNavigate }) {
  return (
    <div className="bg-white">
      <section className="px-5 pb-16 pt-20 text-center sm:pt-28">
        <Reveal>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
            Before–After Evaluation
          </p>

          <h1 className="text-4xl font-black text-slate-900 sm:text-6xl">
            Model <span className="text-[#B91C1C]">Comparison.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-500">
            Perbandingan Business as Usual 2041
            dan Integrated TDM 2041 menggunakan
            basis proyeksi serta jaringan yang sama.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              name: "BEFORE TDM",
              title: "Business as Usual 2041",
              page: "before",
            },
            {
              name: "AFTER TDM",
              title: "Integrated TDM 2041",
              page: "after",
            },
          ].map((model, i) => (
            <Reveal key={model.page} delay={i * 100}>
              <div className="rounded-3xl border border-slate-200 p-4 sm:p-5">
                <div className="mb-5 px-2 pt-2">
                  <p className="text-xs font-bold text-[#B91C1C]">
                    {model.name}
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {model.title}
                  </h2>
                </div>

                <ModelCanvas label={model.name} />

                <button
                  onClick={() => onNavigate(model.page)}
                  className="mt-5 flex items-center gap-2 px-2 text-sm font-semibold text-[#B91C1C]"
                >
                  Open Model
                  <ArrowRight size={16} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 rounded-3xl border border-slate-200 p-7 sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className="text-[#B91C1C]" />

              <h2 className="text-xl font-bold text-slate-900">
                Comparative Performance
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-4">Indicator</th>
                    <th>Before 2041</th>
                    <th>After 2041</th>
                    <th>Change</th>
                  </tr>
                </thead>

                <tbody>
                  {metrics.map((metric) => (
                    <tr
                      key={metric}
                      className="border-b border-slate-100"
                    >
                      <td className="py-4 text-slate-700">
                        {metric}
                      </td>
                      <td className="text-slate-400">—</td>
                      <td className="text-slate-400">—</td>
                      <td className="text-slate-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-amber-800">
              <AlertCircle size={16} className="mt-1 shrink-0" />
              Hasil perbandingan baru akan tersedia setelah
              kedua skenario menjalankan mesin traffic assignment
              dan evaluasi kinerja yang sama.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default function ModelOverview({
  type = "before",
  onNavigate,
  transitConfig,
}) {
  if (type === "comparison") {
    return <Comparison onNavigate={onNavigate} />;
  }

  const before = type === "before";

  return (
    <div className="bg-white">
      <section className="px-5 pb-14 pt-20 text-center sm:pt-28">
        <Reveal>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
            {before ? "MODEL 01 — BEFORE TDM" : "MODEL 02 — AFTER TDM"}
          </p>

          <h1 className="text-4xl font-black text-slate-900 sm:text-6xl">
            Denpasar 2041
            <br />
            <span className="text-[#B91C1C]">
              {before ? "Business as Usual." : "Integrated TDM."}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
            {before
              ? "Proyeksi kinerja jaringan transportasi pada 2041 tanpa penerapan paket kebijakan TDM tambahan."
              : "Evaluasi perubahan kinerja jaringan setelah penerapan kombinasi intervensi TDM dan peningkatan layanan angkutan umum."}
          </p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Base Year", "2026"],
              ["Scenario Year", "2041"],
              ["Source MAT", `${formatNumber(matTotal)} smp/jam`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <ModelCanvas
              label={before ? "BASELINE FRAMEWORK" : "TDM FRAMEWORK"}
            />
          </Reveal>

          <Reveal delay={100}>
            <MetricList />
          </Reveal>
        </div>

        {!before && (
          <Reveal>
            <div className="mt-8 rounded-3xl border border-slate-200 bg-[#FAFAFA] p-7">
              <h3 className="text-lg font-bold text-slate-900">
                Transit Service Configuration
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                Parameter rancangan dari Transit Operations App.
                Belum diterapkan ke traffic assignment.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Headway", `${transitConfig.headway} min`],
                  ["Fleet", `${transitConfig.fleet} vehicles`],
                  ["Vehicle Capacity", `${transitConfig.capacity} seats`],
                ].map(([name, value]) => (
                  <div key={name} className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-500">{name}</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate("transit-operator")}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#B91C1C]"
              >
                Edit Transit Configuration
                <ArrowRight size={16} />
              </button>
            </div>
          </Reveal>
        )}

        <Reveal>
          <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-7">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-700" />
              <h3 className="font-bold text-amber-900">
                Modeling Integration Pending
              </h3>
            </div>

            <p className="mt-4 text-sm leading-7 text-amber-900/80">
              Proyeksi MAT 2041, atribut jaringan jalan,
              shortest-path assignment, BPR travel time,
              dan perhitungan volume ruas akan
              diimplementasikan pada fase modeling.
              Belum ada hasil lalu lintas yang dapat
              dinyatakan sebagai keluaran skenario.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            onClick={() =>
              onNavigate(before ? "after" : "before")
            }
            className="inline-flex items-center gap-2 rounded-full bg-[#B91C1C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            {before ? "Explore After TDM" : "Explore Before TDM"}
            <ArrowRight size={17} />
          </button>

          <button
            onClick={() => onNavigate("comparison")}
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Compare Models
          </button>
        </div>
      </div>
    </div>
  );
}
