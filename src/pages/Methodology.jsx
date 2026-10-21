
import {
  Database,
  Network,
  Calculator,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Data Preparation",
    description:
      "Validasi MAT 13 zona, jaringan jalan, atribut kapasitas, dan data layanan transportasi.",
  },
  {
    number: "02",
    icon: Network,
    title: "Network Representation",
    description:
      "Merepresentasikan simpang dan ruas dalam struktur graf dengan atribut panjang, kapasitas, dan kecepatan.",
  },
  {
    number: "03",
    icon: Calculator,
    title: "Traffic Assignment",
    description:
      "Mencari rute terpendek dan membebankan permintaan OD ke jaringan menggunakan algoritma yang terdefinisi.",
  },
  {
    number: "04",
    icon: SlidersHorizontal,
    title: "TDM Scenario Development",
    description:
      "Menguji perubahan biaya, waktu, tujuan, moda, kapasitas, dan konfigurasi layanan.",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Performance Evaluation",
    description:
      "Menghitung volume ruas, V/C ratio, waktu tempuh, VKT, dan VHT jika input mencukupi.",
  },
  {
    number: "06",
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

export default function Methodology() {
  return (
    <div className="bg-white">
      <section className="px-5 pb-16 pt-20 text-center sm:pt-28">
        <Reveal>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
            Scientific Framework
          </p>

          <h1 className="text-4xl font-black text-slate-900 sm:text-6xl">
            Research
            <br />
            <span className="text-[#B91C1C]">Methodology.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
            Pendekatan sistematis untuk menghubungkan
            data transportasi, model jaringan,
            kebijakan TDM, dan evaluasi kinerja.
          </p>
        </Reveal>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="mb-9 text-2xl font-bold text-slate-900 sm:text-3xl">
              Modeling Workflow
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;

              return (
                <Reveal key={step.number} delay={(i % 3) * 100}>
                  <div className="feature-card h-full rounded-3xl border border-slate-200 p-7">
                    <div className="mb-7 flex items-center justify-between">
                      <Icon size={24} className="text-[#B91C1C]" />
                      <span className="font-bold text-slate-300">
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

      <section className="border-y border-slate-100 bg-[#FAFAFA] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Mathematical Foundation
            </p>

            <h2 className="mb-10 text-3xl font-bold text-slate-900 sm:text-4xl">
              Modeling Equations.
            </h2>
          </Reveal>

          <div className="space-y-4">
            {formulas.map((formula, i) => (
              <Reveal key={formula.name} delay={(i % 2) * 70}>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-slate-900">
                    {formula.name}
                  </h3>

                  <div className="my-5 overflow-x-auto rounded-2xl bg-red-50 p-5 text-center">
                    <p className="whitespace-nowrap text-xl font-bold tracking-wide text-[#B91C1C] sm:text-2xl">
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

      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-3xl font-bold text-slate-900">
              Data Integrity & Model Boundaries
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              [
                "SOURCE INPUT",
                "MAT dan data yang diturunkan dari referensi studi kasus.",
              ],
              [
                "CALCULATED",
                "Nilai yang dihasilkan melalui rumus dan algoritma yang dapat ditelusuri.",
              ],
              [
                "ASSUMPTION",
                "Parameter yang digunakan untuk eksperimen, bukan observasi lapangan.",
              ],
              [
                "DATA REQUIRED",
                "Indikator yang belum dapat dihitung karena data pendukung belum tersedia.",
              ],
            ].map(([name, description]) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-200 p-6"
              >
                <p className="mb-3 text-xs font-bold tracking-widest text-[#B91C1C]">
                  {name}
                </p>

                <p className="text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm leading-8 text-slate-500">
            Pada implementasi model, MAT 2026 diproyeksikan
            menuju 2041 dengan parameter yang dinyatakan
            secara eksplisit. Kondisi Business as Usual 2041
            dibandingkan terhadap kondisi Integrated TDM
            2041 menggunakan basis jaringan yang sama.
          </p>
        </div>
      </section>
    </div>
  );
}
