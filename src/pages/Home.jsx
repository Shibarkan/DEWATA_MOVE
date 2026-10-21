
import {
  ArrowRight,
  ArrowDown,
  Activity,
  MapPinned,
  TrainFront,
  SlidersHorizontal,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";
import SimulationPreview from "../components/home/SimulationPreview";

import {
  matTotal,
  largestOD,
  formatNumber,
  privateVehicleShareReference,
} from "../data/mobility";

const challenges = [
  {
    icon: Activity,
    title: "High Private Vehicle Dependence",
    text: "Dominasi kendaraan pribadi menjadi tantangan dalam transisi menuju mobilitas berkelanjutan.",
  },
  {
    icon: TrainFront,
    title: "Public Transport Integration",
    text: "Integrasi layanan TMD, feeder, halte, jadwal, dan akses perjalanan perlu dievaluasi.",
  },
  {
    icon: MapPinned,
    title: "Spatial Demand Concentration",
    text: "Distribusi asal dan tujuan perjalanan menunjukkan kebutuhan penanganan antarzona.",
  },
];

export default function Home({ onNavigate }) {
  return (
    <div className="overflow-hidden bg-white">

      {/* HERO */}
      <section className="relative isolate px-5 pb-20 pt-20 text-center sm:pb-24 sm:pt-28 lg:pt-32">
        <div className="hero-orb pointer-events-none absolute -left-32 top-0 -z-10 h-80 w-80 rounded-full bg-red-100/60 blur-[100px]" />

        <div className="hero-orb hero-orb-delay pointer-events-none absolute -right-32 top-32 -z-10 h-96 w-96 rounded-full bg-orange-100/50 blur-[110px]" />

        <div className="mx-auto max-w-5xl">
          <div className="hero-enter mb-7 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#B91C1C]">
            <Activity size={14} />
            Urban Mobility Simulation Laboratory
          </div>

          <h1 className="hero-enter hero-delay-1 mx-auto max-w-4xl text-4xl font-black leading-[1.12] tracking-[-0.045em] text-[#17202D] sm:text-6xl lg:text-[76px]">
            A Smarter Future
            <br />
            for{" "}
            <span className="text-[#B91C1C]">
              Denpasar Mobility.
            </span>
          </h1>

          <p className="hero-enter hero-delay-2 mx-auto mt-7 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base lg:text-lg">
            Membangun sistem transportasi perkotaan yang lebih
            efisien, terintegrasi, dan berkelanjutan melalui
            pemodelan matematis serta strategi
            Transport Demand Management menuju 2041.
          </p>

          <div className="hero-enter hero-delay-3 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate("before")}
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#B91C1C] px-7 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(185,28,28,0.2)] transition-all duration-300 hover:-translate-y-1 hover:bg-red-800"
            >
              Explore Modeling
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <button
              onClick={() => onNavigate("problems")}
              className="rounded-full border border-slate-200 px-7 py-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50"
            >
              Explore TDM Solutions
            </button>
          </div>

          <a
            href="#overview"
            className="hero-enter hero-delay-4 mt-16 inline-flex flex-col items-center gap-2 text-xs font-medium text-slate-400"
          >
            Scroll to Explore
            <ArrowDown size={19} className="scroll-arrow" />
          </a>
        </div>
      </section>

      {/* DATA OVERVIEW */}
      <section
        id="overview"
        className="scroll-mt-28 px-5 pb-24 sm:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
                Understanding the Challenge
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Mobility by the Numbers.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                value: `${privateVehicleShareReference}%`,
                label: "Private Vehicle Mode Share",
                note: "Referensi Bali 2024 — mobil + motor",
              },
              {
                value: formatNumber(matTotal),
                label: "Total OD Matrix",
                note: "MAT 2026 • smp/jam",
              },
              {
                value: `Z${largestOD.origin} → Z${largestOD.destination}`,
                label: "Highest OD Pair",
                note: `${formatNumber(largestOD.volume)} smp/jam`,
              },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 100}>
                <div className="feature-card h-full rounded-3xl border border-slate-200 bg-white p-7 sm:p-8">
                  <p className="text-3xl font-black tracking-tight text-[#B91C1C] sm:text-4xl">
                    {item.value}
                  </p>

                  <h3 className="mt-4 font-bold text-slate-900">
                    {item.label}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {item.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL SHOWCASE */}
      <section className="px-4 pb-24 sm:px-6 lg:pb-32">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Interactive Network
            </p>

            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Visualize Urban Mobility.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Eksplorasi ilustrasi jaringan transportasi
              sebagai gambaran awal lingkungan simulasi.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <SimulationPreview />
        </Reveal>
      </section>

      {/* CHALLENGES */}
      <section className="border-y border-slate-100 bg-[#FAFAFA] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-12 max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
                Problem Identification
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Why Denpasar
                <br />
                Needs a New Approach.
              </h2>

              <p className="mt-5 text-sm leading-8 text-slate-500 sm:text-base">
                Solusi transportasi tidak hanya berfokus
                pada pembangunan infrastruktur,
                tetapi juga pada pengelolaan permintaan,
                perilaku perjalanan, dan kualitas layanan.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {challenges.map((item, i) => {
              const Icon = item.icon;

              return (
                <Reveal key={item.title} delay={i * 100}>
                  <div className="feature-card h-full rounded-3xl border border-slate-200 bg-white p-8">
                    <div className="mb-7 flex h-13 w-13 items-center justify-center rounded-2xl bg-red-50 text-[#B91C1C]">
                      <Icon size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal>
            <div className="mt-10">
              <button
                onClick={() => onNavigate("problems")}
                className="group inline-flex items-center gap-2 font-semibold text-[#B91C1C]"
              >
                Explore Problem Solving
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
                Research Workflow
              </p>

              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                From Data to Decisions.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: MapPinned,
                number: "01",
                title: "Analyze Demand",
                text: "Memahami pola perjalanan berdasarkan MAT 13 zona dan karakteristik jaringan.",
              },
              {
                icon: SlidersHorizontal,
                number: "02",
                title: "Design TDM Policies",
                text: "Menyusun kombinasi kebijakan push dan pull yang dapat diuji secara matematis.",
              },
              {
                icon: Activity,
                number: "03",
                title: "Evaluate Performance",
                text: "Membandingkan indikator transportasi sebelum dan sesudah intervensi.",
              },
            ].map((item, i) => {
              const Icon = item.icon;

              return (
                <Reveal key={item.number} delay={i * 100}>
                  <div className="rounded-3xl border border-slate-200 p-7">
                    <div className="mb-8 flex items-center justify-between">
                      <Icon size={24} className="text-[#B91C1C]" />
                      <span className="text-sm font-bold text-slate-300">
                        {item.number}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
