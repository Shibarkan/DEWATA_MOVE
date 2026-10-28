
import {
  Database,
  Network,
  Calculator,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
  HardDrive,
  Road,
  FileText,
  SquareSigma,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";

/*
 * DENPASAR 2041 — RESEARCH METHODOLOGY
 *
 * Halaman metodologi pemodelan transportasi.
 * React + Vite + Tailwind CSS.
 */

const steps = [
  {
    icon: HardDrive,
    title: "Data Preparation",
    description:
      "Validasi MAT 13 zona, jaringan jalan, atribut kapasitas, dan data layanan transportasi.",
  },
  {
    icon: Network,
    title: "Network Representation",
    description:
      "Merepresentasikan simpang dan ruas dalam struktur graf dengan atribut panjang, kapasitas, dan kecepatan.",
  },
  {
    icon: Road,
    title: "Traffic Assignment",
    description:
      "Mencari rute terpendek dan membebankan permintaan OD ke jaringan menggunakan algoritma yang terdefinisi.",
  },
  {
    icon: FileText,
    title: "TDM Scenario Development",
    description:
      "Menguji perubahan biaya, waktu, tujuan, moda, kapasitas, dan konfigurasi layanan.",
  },
  {
    icon: SquareSigma,
    title: "Performance Evaluation",
    description:
      "Menghitung volume ruas, V/C ratio, waktu tempuh, VKT, dan VHT jika input mencukupi.",
  },
  {
    icon: ShieldCheck,
    title: "Validation & Limitations",
    description:
      "Membedakan data sumber, asumsi skenario, metode perhitungan, dan hasil simulasi.",
  },
];

const formulas = [
  {
    name: "BPR Travel Time Function",
    equation: "t = t₀ × [1 + α × (V/C)ᵝ]",
    meaning:
      "t = waktu tempuh; t₀ = free-flow travel time; V = volume; C = kapasitas. Nilai α dan β harus dinyatakan sebagai asumsi atau hasil kalibrasi.",
  },
  {
    name: "Volume–Capacity Ratio",
    equation: "V/C = Volume / Capacity",
    meaning:
      "Indikator perbandingan arus kendaraan ekuivalen dengan kapasitas ruas pada periode dan satuan yang konsisten.",
  },
  {
    name: "Demand Projection",
    equation: "T₂₀₄₁ = T₂₀₂₆ × (1 + g)¹⁵",
    meaning:
      "Contoh fungsi pertumbuhan majemuk, dengan g sebagai asumsi laju pertumbuhan tahunan. Bukan proyeksi terkalibrasi.",
  },
  {
    name: "Transit Fleet Requirement",
    equation: "N = ⌈Cycle Time / Headway⌉",
    meaning:
      "Estimasi minimum armada pada rancangan operasi sederhana, sebelum mempertimbangkan cadangan, gangguan, atau batasan jadwal.",
  },
  {
    name: "Generalized Travel Cost",
    equation: "GC = Fare + VoT × Time + Penalties",
    meaning:
      "Biaya umum perjalanan mencakup tarif, nilai waktu, dan penalti transfer atau akses sesuai spesifikasi model.",
  },
];

const dataIntegrity = [
  {
    name: "SOURCE INPUT",
    description:
      "MAT dan data yang diturunkan dari referensi studi kasus.",
  },
  {
    name: "CALCULATED",
    description:
      "Nilai yang dihasilkan melalui rumus dan algoritma yang dapat ditelusuri.",
  },
  {
    name: "ASSUMPTION",
    description:
      "Parameter yang digunakan untuk eksperimen, bukan observasi lapangan.",
  },
  {
    name: "DATA REQUIRED",
    description:
      "Indikator yang belum dapat dihitung karena data pendukung belum tersedia.",
  },
];

export default function Methodology() {
  return (
    <div className="min-h-screen bg-white">

      {/* ========================================
          HEADER
      ======================================== */}

      <section className="px-4 pb-12 pt-16 text-center sm:px-8 sm:pb-16 sm:pt-28">
        <Reveal>
          <div className="mx-auto max-w-3xl">

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Scientific Framework
            </p>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
              Research
              <br />
              <span className="text-[#B91C1C]">
                Methodology.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              Pendekatan sistematis untuk menghubungkan
              data transportasi, model jaringan,
              kebijakan TDM, dan evaluasi kinerja.
            </p>

          </div>
        </Reveal>
      </section>

      {/* ========================================
          MODELING WORKFLOW
      ======================================== */}

      <section className="px-4 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl">

          <Reveal>
            <h2 className="mb-8 text-2xl font-bold text-slate-900 sm:mb-9 sm:text-3xl">
              Modeling Workflow
            </h2>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">

            {steps.map((step, i) => {
              const Icon = step.icon;

              return (
                <Reveal
                  key={step.number}
                  delay={(i % 3) * 100}
                >
                  <div className="feature-card h-full rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-red-200 hover:shadow-lg sm:rounded-3xl sm:p-7">

                    <div className="mb-6 flex items-center justify-between sm:mb-7">

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                        <Icon
                          size={24}
                          className="text-[#B91C1C]"
                        />
                      </div>

                      <span className="text-lg font-black text-slate-300">
                        {step.number}
                      </span>

                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-500">
                      {step.description}
                    </p>

                  </div>
                </Reveal>
              );
            })}

          </div>

        </div>
      </section>

      {/* ========================================
          MATHEMATICAL FOUNDATION
      ======================================== */}

      <section className="border-y border-slate-100 bg-[#FAFAFA] px-4 py-16 sm:px-8 sm:py-24">

        <div className="mx-auto max-w-5xl">

          <Reveal>

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Mathematical Foundation
            </p>

            <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-900 sm:mb-10 sm:text-4xl">
              Modeling Equations.
            </h2>

          </Reveal>

          <div className="space-y-4">

            {formulas.map((formula, i) => (
              <Reveal
                key={formula.name}
                delay={(i % 2) * 70}
              >

                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:rounded-3xl sm:p-8">

                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                    {formula.name}
                  </h3>

                  <div className="my-5 overflow-x-auto rounded-xl bg-red-50 p-4 sm:rounded-2xl sm:p-5">

                    <p className="min-w-max text-center text-lg font-bold tracking-wide text-[#B91C1C] sm:text-2xl">
                      {formula.equation}
                    </p>

                  </div>

                  <p className="text-sm leading-7 text-slate-500">
                    {formula.meaning}
                  </p>

                </div>

              </Reveal>
            ))}

          </div>

        </div>
      </section>

      {/* ========================================
          DATA INTEGRITY
      ======================================== */}

      <section className="px-4 py-16 sm:px-8 sm:py-24">

        <div className="mx-auto max-w-5xl">

          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Data Integrity & Model Boundaries
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            {dataIntegrity.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-red-200 sm:p-6"
              >

                <p className="mb-3 text-xs font-bold tracking-widest text-[#B91C1C]">
                  {item.name}
                </p>

                <p className="text-sm leading-7 text-slate-600">
                  {item.description}
                </p>

              </div>
            ))}

          </div>

          <Reveal>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={22}
                  className="mt-1 shrink-0 text-[#B91C1C]"
                />

                <div>

                  <h3 className="text-sm font-bold text-slate-900">
                    Model Comparison Framework
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Pada implementasi model, MAT 2026
                    diproyeksikan menuju 2041 dengan
                    parameter yang dinyatakan secara
                    eksplisit. Kondisi Business as Usual
                    2041 dibandingkan terhadap kondisi
                    Integrated TDM 2041 menggunakan
                    basis jaringan yang sama.
                  </p>

                </div>

              </div>

            </div>
          </Reveal>

        </div>
      </section>

    </div>
  );
}
