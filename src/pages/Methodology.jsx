
import {
  Database,
  Network,
  Route,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";

// DEWATAMOVE 2041 — RESEARCH METHODOLOGY
// Light mode | Mathematical notation | Responsive

const steps = [
  {
    icon: Database,
    title: "Data Preparation",
    description:
      "Validasi MAT 13 zona, jaringan jalan, atribut kapasitas, dan data layanan transportasi.",
  },
  {
    icon: Network,
    title: "Network Representation",
    description:
      "Merepresentasikan simpang dan ruas sebagai jaringan graf dengan atribut panjang, kapasitas, dan kecepatan.",
  },
  {
    icon: Route,
    title: "Traffic Assignment",
    description:
      "Menentukan rute dan membebankan permintaan perjalanan asal–tujuan pada jaringan transportasi.",
  },
  {
    icon: SlidersHorizontal,
    title: "TDM Scenario Development",
    description:
      "Menyusun dan menguji skenario pengaturan perjalanan, perpindahan moda, dan peningkatan layanan.",
  },
  {
    icon: BarChart3,
    title: "Performance Evaluation",
    description:
      "Mengevaluasi volume ruas, V/C ratio, waktu tempuh, VKT, dan VHT apabila data input mencukupi.",
  },
  {
    icon: ShieldCheck,
    title: "Validation & Limitations",
    description:
      "Memisahkan data sumber, asumsi skenario, hasil perhitungan, dan keterbatasan model.",
  },
];

const formulas = [
  {
    id: "bpr",
    number: "01",
    title: "BPR Travel Time Function",
    category: "Travel Time Model",
    description:
      "Menghubungkan waktu tempuh ruas dengan tingkat pembebanan lalu lintas relatif terhadap kapasitas.",
    variables: [
      ["t", "Waktu tempuh pada kondisi terbebani"],
      ["t₀", "Waktu tempuh arus bebas"],
      ["V", "Volume lalu lintas"],
      ["C", "Kapasitas ruas"],
      ["α, β", "Parameter model atau kalibrasi"],
    ],
    note:
      "Nilai parameter α dan β harus dinyatakan sebagai asumsi atau diperoleh melalui kalibrasi.",
  },
  {
    id: "vc",
    number: "02",
    title: "Volume–Capacity Ratio",
    category: "Road Performance",
    description:
      "Mengukur perbandingan volume lalu lintas dengan kemampuan kapasitas ruas jalan.",
    variables: [
      ["V", "Volume kendaraan ekuivalen per jam"],
      ["C", "Kapasitas ruas per jam"],
    ],
    note:
      "Volume dan kapasitas harus menggunakan satuan serta periode yang konsisten.",
  },
  {
    id: "growth",
    number: "03",
    title: "Demand Projection",
    category: "Demand Forecast",
    description:
      "Mengestimasi perubahan permintaan perjalanan dari tahun dasar 2026 menuju horizon 2041.",
    variables: [
      ["T₂₀₂₆", "Permintaan perjalanan tahun dasar"],
      ["T₂₀₄₁", "Permintaan perjalanan tahun proyeksi"],
      ["g", "Asumsi pertumbuhan tahunan"],
      ["15", "Jumlah tahun proyeksi"],
    ],
    note:
      "Model pertumbuhan majemuk ini merupakan pendekatan skenario, bukan proyeksi terkalibrasi.",
  },
  {
    id: "fleet",
    number: "04",
    title: "Transit Fleet Requirement",
    category: "Transit Operations",
    description:
      "Mengestimasi jumlah minimum armada yang diperlukan berdasarkan waktu siklus dan headway.",
    variables: [
      ["N", "Jumlah minimum armada"],
      ["Tcycle", "Total waktu perjalanan satu siklus"],
      ["H", "Headway atau interval layanan"],
    ],
    note:
      "Hasil dibulatkan ke atas dan belum mencakup armada cadangan atau gangguan operasional.",
  },
  {
    id: "cost",
    number: "05",
    title: "Generalized Travel Cost",
    category: "Transport Economics",
    description:
      "Menggabungkan komponen biaya perjalanan untuk membandingkan berbagai pilihan moda.",
    variables: [
      ["GC", "Biaya umum perjalanan"],
      ["F", "Tarif perjalanan"],
      ["VoT", "Nilai waktu"],
      ["T", "Waktu perjalanan"],
      ["P", "Penalti akses atau perpindahan moda"],
    ],
    note:
      "Seluruh komponen harus dikonversi ke satuan biaya yang konsisten.",
  },
];

const integrity = [
  {
    number: "01",
    name: "SOURCE INPUT",
    description:
      "MAT dan data transportasi yang bersumber dari referensi studi kasus.",
  },
  {
    number: "02",
    name: "CALCULATED",
    description:
      "Nilai yang dihitung menggunakan algoritma dan persamaan yang dapat ditelusuri.",
  },
  {
    number: "03",
    name: "ASSUMPTION",
    description:
      "Parameter eksperimen yang belum dapat dianggap sebagai hasil observasi lapangan.",
  },
  {
    number: "04",
    name: "DATA REQUIRED",
    description:
      "Indikator yang belum dapat dihitung secara valid karena keterbatasan data.",
  },
];

// MATHEMATICAL EQUATIONS
// Native MathML — tanpa library tambahan

function MathEquation({ type }) {
  const common =
    "block w-max min-w-full text-center text-[clamp(1.15rem,3vw,1.6rem)] text-slate-900";

  if (type === "bpr") {
    return (
      <math
        display="block"
        className={common}
        aria-label="t = t nol kali satu ditambah alpha kali V per C pangkat beta"
      >
        <mi>t</mi>
        <mo>=</mo>
        <msub>
          <mi>t</mi>
          <mn>0</mn>
        </msub>
        <mo>·</mo>
        <mrow>
          <mo stretchy="true">[</mo>
          <mn>1</mn>
          <mo>+</mo>
          <mi>α</mi>
          <msup>
            <mrow>
              <mo stretchy="true">(</mo>
              <mfrac>
                <mi>V</mi>
                <mi>C</mi>
              </mfrac>
              <mo stretchy="true">)</mo>
            </mrow>
            <mi>β</mi>
          </msup>
          <mo stretchy="true">]</mo>
        </mrow>
      </math>
    );
  }

  if (type === "vc") {
    return (
      <math
        display="block"
        className={common}
        aria-label="V per C sama dengan volume dibagi kapasitas"
      >
        <mfrac>
          <mi>V</mi>
          <mi>C</mi>
        </mfrac>
        <mo>=</mo>
        <mfrac>
          <mtext>Volume</mtext>
          <mtext>Capacity</mtext>
        </mfrac>
      </math>
    );
  }

  if (type === "growth") {
    return (
      <math
        display="block"
        className={common}
        aria-label="T 2041 sama dengan T 2026 dikali satu ditambah g pangkat lima belas"
      >
        <msub>
          <mi>T</mi>
          <mn>2041</mn>
        </msub>
        <mo>=</mo>
        <msub>
          <mi>T</mi>
          <mn>2026</mn>
        </msub>
        <mo>·</mo>
        <msup>
          <mrow>
            <mo stretchy="true">(</mo>
            <mn>1</mn>
            <mo>+</mo>
            <mi>g</mi>
            <mo stretchy="true">)</mo>
          </mrow>
          <mn>15</mn>
        </msup>
      </math>
    );
  }

  if (type === "fleet") {
    return (
      <math
        display="block"
        className={common}
        aria-label="N sama dengan pembulatan ke atas waktu siklus dibagi headway"
      >
        <mi>N</mi>
        <mo>=</mo>
        <mo stretchy="true">⌈</mo>
        <mfrac>
          <msub>
            <mi>T</mi>
            <mtext>cycle</mtext>
          </msub>
          <mi>H</mi>
        </mfrac>
        <mo stretchy="true">⌉</mo>
      </math>
    );
  }

  if (type === "cost") {
    return (
      <math
        display="block"
        className={common}
        aria-label="GC sama dengan F ditambah VoT dikali T ditambah P"
      >
        <mi mathvariant="normal">GC</mi>
        <mo>=</mo>
        <mi>F</mi>
        <mo>+</mo>
        <mi mathvariant="normal">VoT</mi>
        <mo>×</mo>
        <mi>T</mi>
        <mo>+</mo>
        <mi>P</mi>
      </math>
    );
  }

  return null;
}

// SECTION HEADER

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
        {eyebrow}
      </p>

      <h2 className="text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.055em] text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-5 text-[13px] leading-7 text-slate-500 sm:text-[15px] sm:leading-8">
          {description}
        </p>
      )}
    </div>
  );
}

// FORMULA SECTION

function MathematicalFoundation() {
  return (
    <section className="border-y border-slate-200 bg-[#FAFAF9] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionTitle
            eyebrow="02 / Mathematical Foundation"
            title="Modeling Equations"
            description="Dasar matematis yang digunakan untuk menjelaskan hubungan antara permintaan perjalanan, kinerja jaringan, dan kebutuhan layanan transportasi."
          />
        </Reveal>

        <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200 sm:mt-16">
          {formulas.map((formula) => (
            <article
              key={formula.id}
              className="grid gap-7 py-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-12"
            >
              {/* LEFT: EXPLANATION */}

              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tabular-nums text-[#B91C1C]">
                    {formula.number}
                  </span>

                  <span className="h-px w-6 bg-slate-300" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                    {formula.category}
                  </span>
                </div>

                <h3 className="mt-5 text-[20px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[24px]">
                  {formula.title}
                </h3>

                <p className="mt-3 max-w-md text-[13px] leading-7 text-slate-500">
                  {formula.description}
                </p>

                <div className="mt-6">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Keterangan Variabel
                  </p>

                  <dl className="space-y-2">
                    {formula.variables.map(([symbol, meaning]) => (
                      <div
                        key={symbol}
                        className="grid grid-cols-[70px_1fr] gap-3 text-[12px] leading-6"
                      >
                        <dt className="font-semibold text-slate-900">
                          {symbol}
                        </dt>
                        <dd className="text-slate-500">
                          {meaning}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* RIGHT: MATHEMATICAL EQUATION */}

              <div className="min-w-0">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Mathematical Expression
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ({formula.number})
                    </span>
                  </div>

                  <div className="overflow-x-auto px-5 py-12 sm:px-8 sm:py-16">
                    <div className="flex min-w-max justify-center px-2">
                      <MathEquation type={formula.id} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 border-l-2 border-[#B91C1C] pl-4">
                  <p className="text-[12px] leading-6 text-slate-500">
                    <span className="font-semibold text-slate-800">
                      Catatan metodologis.{" "}
                    </span>
                    {formula.note}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[11px] leading-6 text-slate-400">
          Persamaan di atas merupakan kerangka matematis.
          Tidak seluruh indikator merupakan hasil perhitungan
          aktual. Penerapannya bergantung pada ketersediaan data,
          validitas asumsi, dan spesifikasi model.
        </p>
      </div>
    </section>
  );
}

// MAIN PAGE

export default function Methodology() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-8 sm:pb-28 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-4xl">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-[#B91C1C]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
                  DewataMove 2041 / Research
                </span>
              </div>

              <h1 className="text-[clamp(3.2rem,9vw,7rem)] font-black leading-[0.98] tracking-[-0.075em]">
                Research
                <span className="block text-[#B91C1C]">
                  Methodology.
                </span>
              </h1>

              <p className="mt-9 max-w-2xl text-[15px] leading-8 text-slate-500 sm:text-[18px] sm:leading-9">
                Pendekatan pemodelan transportasi berbasis
                data untuk menguji kebijakan Transportation
                Demand Management menuju Denpasar 2041.
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                <span>13 Traffic Zones</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>2026 Baseline</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>2041 Horizon</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pb-24 pt-8 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionTitle
              eyebrow="01 / Research Process"
              title="Modeling Workflow"
              description="Tahapan penelitian disusun secara berurutan, mulai dari persiapan data hingga validasi hasil pemodelan."
            />
          </Reveal>

          <div className="mt-12 border-y border-slate-200 sm:mt-16">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="group grid gap-4 border-b border-slate-200 py-7 last:border-b-0 sm:grid-cols-[80px_minmax(0,1fr)] lg:grid-cols-[90px_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8 lg:py-9"
                >
                  <div className="flex items-center gap-4 sm:block">
                    <span className="text-[12px] font-semibold tabular-nums text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <Icon
                      size={22}
                      strokeWidth={1.7}
                      className="text-[#B91C1C] sm:mt-4"
                    />
                  </div>

                  <h3 className="text-[19px] font-bold tracking-[-0.035em] text-slate-900 sm:text-[22px]">
                    {step.title}
                  </h3>

                  <p className="max-w-xl text-[13px] leading-7 text-slate-500 sm:text-[14px]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MathematicalFoundation />

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionTitle
              eyebrow="03 / Research Reliability"
              title="Data Integrity & Model Boundaries"
              description="Setiap komponen model dibedakan berdasarkan asal informasi dan tingkat kepastian agar hasil simulasi dapat dipertanggungjawabkan."
            />
          </Reveal>

          <div className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2 sm:gap-y-12">
            {integrity.map((item) => (
              <div
                key={item.number}
                className="border-t border-slate-200 pt-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#B91C1C]">
                    {item.number}
                  </span>
                  <ArrowUpRight
                    size={17}
                    className="text-slate-300"
                  />
                </div>

                <h3 className="text-[16px] font-bold tracking-tight text-slate-900">
                  {item.name}
                </h3>

                <p className="mt-3 max-w-md text-[13px] leading-7 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 border-t border-slate-200 pt-8 sm:mt-20">
            <div className="grid gap-5 lg:grid-cols-[250px_1fr] lg:gap-14">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={22}
                  strokeWidth={1.7}
                  className="shrink-0 text-[#B91C1C]"
                />

                <h3 className="text-[15px] font-bold text-slate-900">
                  Model Comparison Framework
                </h3>
              </div>

              <p className="max-w-2xl text-[13px] leading-8 text-slate-500 sm:text-[14px]">
                Pada implementasi model, MAT 2026 diproyeksikan
                menuju tahun 2041 menggunakan parameter yang
                dinyatakan secara eksplisit. Kondisi
                Business as Usual 2041 dibandingkan dengan
                Integrated TDM 2041 berdasarkan horizon
                dan jaringan yang sama. Hasil simulasi
                diinterpretasikan dengan memperhatikan
                keterbatasan data, cakupan jaringan, serta
                asumsi intervensi kebijakan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
