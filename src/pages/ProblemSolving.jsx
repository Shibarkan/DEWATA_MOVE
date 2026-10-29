import { useState } from "react";
import {
  Clock3,
  Building2,
  BusFront,
  ParkingCircle,
  Route,
  TrafficCone,
  ChevronDown,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import Reveal from "../components/ui/Reveal";

const policies = [
  {
    id: "time",
    number: "01",
    icon: Clock3,
    title: "Time-Based Demand Management",
    subtitle: "Redistribusi waktu perjalanan",
    problem:
      "Perjalanan pada jam sibuk berpotensi terkonsentrasi pada periode yang sama.",
    cause:
      "Kesamaan waktu masuk kerja, sekolah, dan aktivitas logistik. Ini merupakan hipotesis yang memerlukan data temporal.",
    solution:
      "Staggered working hours, jadwal sekolah bergiliran, flexible working, dan pengaturan waktu distribusi barang.",
    mechanism:
      "Mengalihkan sebagian permintaan dari periode puncak menuju periode di luar puncak.",
    model:
      "Time-sliced OD matrix, temporal demand distribution, dan traffic reassignment.",
    indicator: "Perubahan volume jam puncak, V/C ratio, dan waktu tempuh.",
    required:
      "Profil perjalanan menurut waktu dan besaran respons perubahan jadwal.",
  },
  {
    id: "destination",
    number: "02",
    icon: Building2,
    title: "Destination & Land Use",
    subtitle: "Pengelolaan tujuan perjalanan",
    problem:
      "Distribusi perjalanan menunjukkan konsentrasi pada pasangan zona tertentu.",
    cause:
      "Kemungkinan konsentrasi kesempatan kerja, pendidikan, dan pelayanan pada lokasi tertentu.",
    solution:
      "Mixed-use development, pusat aktivitas lokal, desentralisasi pelayanan, dan tata ruang yang mendukung perjalanan lebih pendek.",
    mechanism:
      "Mengubah daya tarik tujuan dan distribusi perjalanan secara terstruktur.",
    model:
      "Destination choice, land-use attractiveness, OD redistribution, dan traffic assignment.",
    indicator:
      "Perubahan distribusi OD, panjang perjalanan, VKT, dan volume ruas.",
    required:
      "Informasi tata guna lahan, daya tarik zona, dan fungsi pemilihan tujuan.",
  },
  {
    id: "modal",
    number: "03",
    icon: BusFront,
    title: "Transit Modal Shift",
    subtitle: "Perpindahan ke angkutan umum",
    problem:
      "Referensi Bali 2024 menunjukkan dominasi penggunaan kendaraan pribadi.",
    cause:
      "Hipotesis: daya saing angkutan umum dipengaruhi waktu tunggu, akses halte, reliabilitas, biaya, dan transfer.",
    solution:
      "Integrasi TMD dan feeder, integrasi jadwal dan tarif, peningkatan akses pejalan kaki, serta konektivitas first-mile dan last-mile.",
    mechanism:
      "Menurunkan generalized cost angkutan umum agar lebih kompetitif terhadap kendaraan pribadi.",
    model:
      "Generalized travel cost, mode choice, transit capacity constraint, dan multimodal assignment.",
    indicator:
      "Mode share, ridership, generalized cost, dan perubahan volume kendaraan pribadi.",
    required:
      "Waktu, biaya, okupansi, kapasitas layanan, preferensi pengguna, dan data pergerakan orang.",
  },
  {
    id: "parking",
    number: "04",
    icon: ParkingCircle,
    title: "Parking & Vehicle Restraint",
    subtitle: "Kebijakan pengendalian kendaraan",
    problem:
      "Dominasi kendaraan pribadi dapat menimbulkan tekanan pada jaringan dan ruang parkir.",
    cause:
      "Hipotesis: biaya penggunaan kendaraan pribadi belum sepenuhnya mencerminkan biaya perjalanan dan eksternalitasnya.",
    solution:
      "Progressive parking pricing, pengelolaan parkir tepi jalan, serta pengendalian akses pada kawasan yang layak.",
    mechanism:
      "Menaikkan generalized cost perjalanan kendaraan pribadi, disertai penyediaan alternatif mobilitas.",
    model:
      "Parking cost component, mode choice response, dan perubahan route/destination choice bila didukung data.",
    indicator:
      "Permintaan parkir, perpindahan moda, biaya perjalanan, dan dampak distribusional.",
    required:
      "Tarif parkir, elastisitas respons, distribusi pendapatan, dan alternatif transit.",
  },
  {
    id: "supply",
    number: "05",
    icon: Route,
    title: "Transit Supply Improvement",
    subtitle: "Optimalisasi TMD dan feeder",
    problem:
      "Kualitas dan cakupan layanan angkutan umum perlu dibandingkan dengan distribusi permintaan.",
    cause:
      "Hipotesis: ketidaksesuaian headway, cakupan halte, kapasitas, atau transfer mengurangi daya tarik layanan.",
    solution:
      "Optimasi jumlah armada, jadwal, headway, rancangan feeder, dan prioritas bus.",
    mechanism:
      "Meningkatkan keterjangkauan, frekuensi, dan reliabilitas layanan sesuai kapasitas operasional.",
    model:
      "Fleet requirement, service headway, waiting time, service capacity, passenger assignment.",
    indicator:
      "Waktu tunggu, kebutuhan armada, load factor, aksesibilitas, dan ridership.",
    required:
      "Panjang siklus, armada tersedia, kapasitas kendaraan, rute, halte, dan pola permintaan.",
  },
  {
    id: "road",
    number: "06",
    icon: TrafficCone,
    title: "Road Network Optimization",
    subtitle: "Optimalisasi jaringan jalan",
    problem:
      "Kemacetan dapat dipengaruhi kapasitas efektif ruas, simpang, dan hambatan samping.",
    cause:
      "Kemungkinan ketidakseimbangan antara beban arus, kapasitas efektif, serta pengaturan simpang.",
    solution:
      "Optimasi sinyal, manajemen hambatan samping, perbaikan simpang, dan prioritas pergerakan tertentu.",
    mechanism:
      "Memperbaiki kondisi operasi dan kapasitas efektif pada bagian jaringan yang relevan.",
    model:
      "BPR travel time function, road capacity adjustment, dan traffic reassignment.",
    indicator:
      "V/C ratio, delay, waktu tempuh, dan perpindahan kemacetan antarruas.",
    required:
      "Jaringan jalan tervalidasi, kapasitas ruas, arus lalu lintas, dan karakteristik simpang.",
  },
];

const stages = [
  "Problem",
  "Root Cause",
  "Solution",
  "TDM Mechanism",
  "Mathematical Model",
  "Expected Indicator",
];

export default function ProblemSolving({ onNavigate }) {
  const [expanded, setExpanded] = useState("modal");

  return (
    <div className="bg-white">
      {/* PAGE HEADER */}
      <section className="px-5 pb-16 pt-20 text-center sm:pt-28">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
              Problem Solving & TDM Strategy
            </p>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
              Rethinking Urban
              <br />
              <span className="text-[#B91C1C]">Transportation.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
              Mengidentifikasi persoalan mobilitas, memahami kemungkinan akar
              penyebabnya, dan menyusun intervensi Transport Demand Management
              yang dapat diuji secara ilmiah.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CONCEPT FLOW */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {stages.map((stage, index) => (
                <div
                  key={stage}
                  className="rounded-2xl border border-slate-200 bg-[#FAFAFA] p-4"
                >
                  <p className="mt-3 text-xs font-semibold text-slate-800 sm:text-sm">
                    {stage}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SIX POLICIES */}
      <section className="border-y border-slate-100 bg-[#FAFAFA] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-12 max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
                Integrated Policy Framework
              </p>

              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Six Policy Interventions.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500">
                Pilih kebijakan untuk membuka mekanisme, formula pemodelan, dan
                kebutuhan data.
              </p>
            </div>
          </Reveal>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            {policies.map((policy, index) => {
              const Icon = policy.icon;
              const isOpen = expanded === policy.id;

              const details = [
                ["Problem", policy.problem],
                ["Root Cause Hypothesis", policy.cause],
                ["Proposed Solution", policy.solution],
                ["TDM Mechanism", policy.mechanism],
                ["Mathematical Model", policy.model],
                ["Expected Indicator", policy.indicator],
              ];

              return (
                <Reveal key={policy.id} delay={(index % 2) * 100}>
                  <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:border-red-200 hover:shadow-lg">
                    <button
                      onClick={() => setExpanded(isOpen ? null : policy.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 p-6 text-left sm:p-8"
                    >
                      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#B91C1C]">
                        <Icon size={24} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-semibold text-[#B91C1C]">
                          POLICY {policy.number}
                        </p>

                        <h3 className="font-bold text-slate-900 sm:text-lg">
                          {policy.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {policy.subtitle}
                        </p>
                      </div>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 px-6 pb-7 pt-6 sm:px-8">
                        <div className="space-y-5">
                          {details.map(([label, value]) => (
                            <div key={label}>
                              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#B91C1C]">
                                {label}
                              </p>

                              <p className="text-sm leading-7 text-slate-600">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-800">
                            <AlertCircle size={15} />
                            DATA REQUIRED
                          </div>

                          <p className="text-xs leading-6 text-amber-900/80">
                            {policy.required}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTEGRATION */}
      <section className="px-5 py-16 sm:px-8">
        <Reveal>
          <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-[28px] bg-[#B91C1C] p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-100">
                Strategi TDM Terpadu
              </p>

              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                Satu Kota, Satu Strategi Terpadu.
              </h2>

              <p className="mt-3 text-sm leading-6 text-red-100">
                Padukan pengendalian kendaraan pribadi dengan layanan TMD,
                feeder, aksesibilitas, dan pengelolaan perjalanan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("comparison")}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-bold text-[#B91C1C] transition-transform hover:-translate-y-1 lg:self-center"
            >
              Go to Comparison
              <ArrowRight size={17} />
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
