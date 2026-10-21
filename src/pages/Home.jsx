
import {
  ArrowRight,
  ArrowDown,
  Activity,
  MapPinned,
  SlidersHorizontal,
  BarChart3,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";
import SimulationPreview from "../components/home/SimulationPreview";

const features = [
  {
    number: "01",
    icon: MapPinned,
    title: "Mobility Mapping",
    description:
      "Eksplorasi jaringan jalan, zona perjalanan, dan pola mobilitas dalam satu platform interaktif.",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "TDM Simulation",
    description:
      "Eksperimen kebijakan transportasi untuk memahami pengaruh perubahan permintaan dan kapasitas.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Scenario Analytics",
    description:
      "Bandingkan indikator kinerja transportasi melalui perhitungan yang transparan.",
  },
];

export default function Home({ onNavigate }) {
  return (
    <div className="overflow-hidden bg-white">

      {/* HERO SECTION */}
      <section className="relative isolate px-5 pb-16 pt-20 text-center sm:pb-24 sm:pt-28 lg:pt-32">

        {/* BACKGROUND DECORATION */}
        <div className="hero-orb pointer-events-none absolute -left-32 top-12 -z-10 h-80 w-80 rounded-full bg-red-100/60 blur-[100px]" />
        <div className="hero-orb hero-orb-delay pointer-events-none absolute -right-32 top-24 -z-10 h-96 w-96 rounded-full bg-orange-100/60 blur-[110px]" />

        <div className="mx-auto max-w-5xl">

          <div className="hero-enter mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#B91C1C]">
            <Activity size={14} />
            Urban Mobility Simulation Laboratory
          </div>

          <h1 className="hero-enter hero-delay-1 mx-auto max-w-4xl text-4xl font-black leading-[1.12] tracking-[-0.045em] text-[#17202D] sm:text-6xl lg:text-[76px]">
            Shaping the Future
            <br />
            of{" "}
            <span className="text-[#B91C1C]">
              Denpasar Mobility.
            </span>
          </h1>

          <p className="hero-enter hero-delay-2 mx-auto mt-7 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base lg:text-lg">
            Platform pemodelan transportasi interaktif untuk
            mengeksplorasi mobilitas perkotaan, menguji kebijakan
            Transport Demand Management, dan merancang
            masa depan Denpasar menuju 2041.
          </p>

          {/* CTA */}
          <div className="hero-enter hero-delay-3 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

            <button
              onClick={() => onNavigate("simulation")}
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#B91C1C] px-7 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(185,28,28,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#991B1B] hover:shadow-[0_18px_36px_rgba(185,28,28,0.27)] sm:w-auto"
            >
              Jelajahi Simulasi

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <button
              onClick={() => onNavigate("methodology")}
              className="w-full rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:bg-red-50 sm:w-auto"
            >
              Pelajari Metodologi
            </button>
          </div>

          {/* STUDY SCOPE */}
          <div className="hero-enter hero-delay-4 mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-medium text-slate-500">
            <span>13 Zona Studi</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span>Proyeksi 2026–2041</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span>Transport Demand Management</span>
          </div>

          <a
            href="#preview"
            className="mt-14 inline-flex flex-col items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-[#B91C1C]"
          >
            Scroll to Explore
            <ArrowDown size={18} className="scroll-arrow" />
          </a>
        </div>
      </section>

      {/* SIMULATION SHOWCASE */}
      <section
        id="preview"
        className="scroll-mt-28 px-4 pb-24 sm:px-6 lg:pb-32"
      >
        <Reveal>
          <div className="mx-auto mb-10 max-w-4xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Interactive Visualization
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Explore the Network.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Mulai dari visualisasi jaringan demonstrasi,
              kemudian kembangkan menuju pemodelan transportasi
              berbasis data dan skenario kebijakan.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <SimulationPreview />
        </Reveal>
      </section>

      {/* FEATURES */}
      <section className="border-y border-slate-100 bg-[#FAFAFA] px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">

          <Reveal>
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
                Research Platform
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built for Better
                <br />
                Mobility Decisions.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
                Tiga modul utama yang akan menghubungkan data,
                pemodelan matematis, dan evaluasi kebijakan
                transportasi.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Reveal key={feature.number} delay={index * 100}>
                  <div className="feature-card group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 sm:p-8">

                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#B91C1C] transition-all duration-300 group-hover:bg-[#B91C1C] group-hover:text-white">
                        <Icon size={23} />
                      </div>

                      <span className="text-sm font-bold text-slate-300">
                        {feature.number}
                      </span>
                    </div>

                    <h3 className="mt-8 text-xl font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-500">
                      {feature.description}
                    </p>

                    <div className="mt-8 h-[2px] w-9 rounded-full bg-[#B91C1C] transition-all duration-500 group-hover:w-full" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-24 text-center sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              DENPASAR 2041
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              From Data to Decisions.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Satu platform untuk mendukung analisis
              dan pengembangan strategi mobilitas
              perkotaan yang lebih berkelanjutan.
            </p>

            <button
              onClick={() => onNavigate("simulation")}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#B91C1C] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-red-800"
            >
              Open Simulation Laboratory
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
