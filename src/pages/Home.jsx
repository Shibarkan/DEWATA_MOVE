
import { ArrowRight, ArrowUpRight } from "lucide-react";

import Reveal from "../components/ui/Reveal";
import SimulationPreview from "../components/home/SimulationPreview";

import {
  matTotal,
  largestOD,
  formatNumber,
  privateVehicleShareReference,
} from "../data/mobility";

// DATA PENELITIAN
const statistics = [
  {
    value: "13",
    label: "Zona analisis",
    detail: "Wilayah studi dalam MAT 2026",
  },
  {
    value: formatNumber(matTotal),
    label: "Total MAT 2026",
    detail: "Satuan smp/jam",
  },
  {
    value: `${privateVehicleShareReference}%`,
    label: "Kendaraan pribadi",
    detail: "Referensi mode share Bali 2024",
  },
];

const researchFocus = [
  {
    number: "01",
    title: "Pola pergerakan",
    description:
      "Mengidentifikasi bangkitan, tarikan, dan distribusi perjalanan antarzona berdasarkan Matriks Asal Tujuan.",
  },
  {
    number: "02",
    title: "Strategi TDM",
    description:
      "Mengkaji pengelolaan permintaan perjalanan, integrasi angkutan umum, dan pengendalian penggunaan kendaraan pribadi.",
  },
  {
    number: "03",
    title: "Evaluasi skenario",
    description:
      "Menyiapkan perbandingan kinerja jaringan antara kondisi Business as Usual dan penerapan kebijakan TDM pada 2041.",
  },
];

export default function Home({ onNavigate }) {
  return (
    <div className="overflow-hidden bg-white text-slate-900">

      {/* ==================================
          HERO
      ================================== */}

      <section className="border-b border-slate-100">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20 lg:pb-28 lg:pt-28">

          {/* LEFT CONTENT */}
          <div>
            <div className="hero-enter mb-7 flex items-center gap-3">
              <span className="h-[2px] w-8 bg-[#B91C1C]" />

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B91C1C]">
                Studi Transportasi Kota Denpasar
              </p>
            </div>

            <h1 className="hero-enter hero-delay-1 max-w-3xl text-[42px] font-bold leading-[1.12] tracking-[-0.045em] text-[#17202D] sm:text-6xl lg:text-[70px]">
              Memahami
              <br />
              pergerakan kota.
              <br />
              <span className="text-[#B91C1C]">
                Merancang 2041.
              </span>
            </h1>

            <p className="hero-enter hero-delay-2 mt-8 max-w-xl text-[15px] leading-8 text-slate-600 sm:text-base">
              Denpasar 2041 merupakan platform kajian
              transportasi yang menghubungkan analisis
              permintaan perjalanan, pemodelan jaringan,
              dan strategi Transport Demand Management
              untuk mendukung perencanaan mobilitas
              perkotaan.
            </p>

            <div className="hero-enter hero-delay-3 mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate("problems")}
                className="group inline-flex items-center gap-3 rounded-full bg-[#B91C1C] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#991B1B] hover:shadow-lg"
              >
                Lihat Strategi TDM

                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>

              <button
                onClick={() => onNavigate("data")}
                className="group inline-flex items-center gap-2 px-2 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:text-[#B91C1C]"
              >
                Jelajahi Data

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* RIGHT - STUDY SUMMARY */}
          <div className="hero-enter hero-delay-3">
            <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[#FAFAFA]">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
                <p className="text-sm font-semibold text-slate-900">
                  Ringkasan studi
                </p>

                <span className="text-xs text-slate-400">
                  2026-2041
                </span>
              </div>

              <div className="divide-y divide-slate-200 px-6 sm:px-8">
                {statistics.map((item) => (
                  <div
                    key={item.label}
                    className="py-6"
                  >
                    <p className="text-[29px] font-bold tracking-tight text-[#B91C1C] sm:text-4xl">
                      {item.value}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {item.label}
                    </p>

                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 bg-white px-6 py-5 sm:px-8">
                <p className="text-xs leading-6 text-slate-500">
                  Analisis menggunakan data studi kasus
                  dan asumsi pemodelan yang dinyatakan
                  secara terpisah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================
          INTRODUCTION
      ================================== */}

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">

          <Reveal>
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#B91C1C]">
                Latar Belakang
              </p>

              <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                Persoalan transportasi tidak cukup
                diselesaikan dengan menambah jalan.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-5 text-[15px] leading-8 text-slate-600">
              <p>
                Referensi mode share Bali tahun 2024
                menunjukkan dominasi sepeda motor dan
                mobil pribadi sebesar{" "}
                <strong className="font-semibold text-slate-900">
                  {privateVehicleShareReference}%.
                </strong>{" "}
                Kondisi ini menjadi salah satu dasar
                penting untuk mengkaji alternatif
                mobilitas yang lebih efisien.
              </p>

              <p>
                Berdasarkan MAT 2026, pasangan perjalanan
                terbesar terdapat pada zona{" "}
                <strong className="font-semibold text-slate-900">
                  Z{largestOD.origin} menuju
                  Z{largestOD.destination}
                </strong>{" "}
                dengan nilai{" "}
                <strong className="font-semibold text-slate-900">
                  {formatNumber(largestOD.volume)} smp/jam.
                </strong>{" "}
                Distribusi tersebut menjadi masukan
                untuk analisis pola perjalanan dan
                pembebanan jaringan.
              </p>

              <p>
                Penelitian ini mengkaji bagaimana
                kombinasi pengelolaan permintaan
                perjalanan, peningkatan pelayanan
                angkutan umum, dan pengaturan jaringan
                dapat dievaluasi melalui skenario
                transportasi menuju 2041.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================
          NETWORK PREVIEW
      ================================== */}

      <section className="bg-[#F8F9FA] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">

          <Reveal>
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#B91C1C]">
                  Visualisasi Jaringan
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Melihat pergerakan secara spasial.
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Gambaran awal lingkungan visualisasi
                  yang akan digunakan untuk menampilkan
                  jaringan jalan dan hasil pembebanan
                  lalu lintas.
                </p>
              </div>

              <button
                onClick={() => onNavigate("before")}
                className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#B91C1C]"
              >
                Lihat Kerangka Model
                <ArrowUpRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <SimulationPreview />
          </Reveal>

          <p className="mt-5 text-xs leading-6 text-slate-500">
            Visualisasi di atas menggunakan jaringan
            demonstrasi dan belum merepresentasikan
            hasil simulasi geografis Denpasar.
          </p>
        </div>
      </section>

      {/* ==================================
          RESEARCH FOCUS
      ================================== */}

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">

          <Reveal>
            <div className="mb-12 max-w-2xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#B91C1C]">
                Ruang Lingkup Penelitian
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tiga bagian utama dalam kajian.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-0 border-t border-slate-200 md:grid-cols-3">
            {researchFocus.map((item, index) => (
              <Reveal
                key={item.number}
                delay={index * 100}
              >
                <div className="h-full border-b border-slate-200 py-8 md:border-r md:px-7 md:py-9 md:first:pl-0 md:last:border-r-0">

                  <p className="mb-8 text-sm font-bold text-[#B91C1C]">
                    {item.number}
                  </p>

                  <h3 className="mb-4 text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================
          MODELING OVERVIEW
      ================================== */}

      <section className="border-t border-slate-200 bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">

          <Reveal>
            <div className="mb-10 max-w-3xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#B91C1C]">
                Pemodelan Transportasi
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Dua skenario untuk tahun 2041.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Evaluasi dirancang menggunakan dasar
                proyeksi permintaan dan jaringan yang
                konsisten, sehingga perubahan indikator
                dapat dibandingkan secara terukur.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">

            {/* BEFORE TDM */}
            <Reveal>
              <button
                onClick={() => onNavigate("before")}
                className="group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-[#FAFAFA] p-7 text-left transition-all duration-300 hover:border-slate-300 hover:shadow-md sm:p-9"
              >
                <div className="mb-12 flex w-full items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-slate-500">
                    MODEL 01
                  </span>

                  <ArrowUpRight
                    size={20}
                    className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>

                <h3 className="text-2xl font-semibold text-slate-900">
                  Business as Usual
                </h3>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                  Proyeksi kondisi jaringan transportasi
                  Denpasar pada 2041 tanpa tambahan
                  intervensi TDM yang dikaji.
                </p>

                <p className="mt-auto pt-8 text-xs font-medium text-slate-400">
                  Kerangka model - pengembangan
                </p>
              </button>
            </Reveal>

            {/* AFTER TDM */}
            <Reveal delay={100}>
              <button
                onClick={() => onNavigate("after")}
                className="group flex h-full w-full flex-col rounded-2xl border border-red-100 bg-[#FFF9F9] p-7 text-left transition-all duration-300 hover:border-red-200 hover:shadow-md sm:p-9"
              >
                <div className="mb-12 flex w-full items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-[#B91C1C]">
                    MODEL 02
                  </span>

                  <ArrowUpRight
                    size={20}
                    className="text-[#B91C1C] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>

                <h3 className="text-2xl font-semibold text-slate-900">
                  Integrated TDM
                </h3>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                  Proyeksi kondisi jaringan setelah
                  penerapan kombinasi strategi pengelolaan
                  permintaan dan peningkatan angkutan umum.
                </p>

                <p className="mt-auto pt-8 text-xs font-medium text-[#B91C1C]">
                  Kerangka model - pengembangan
                </p>
              </button>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-8">
              <button
                onClick={() => onNavigate("comparison")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[#B91C1C]"
              >
                Kerangka Perbandingan Skenario
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
