
import { useMemo, useState } from "react";
import {
  Database,
  Leaf,
  Fuel,
  BusFront,
  CarFront,
  ArrowRightLeft,
  TrendingDown,
  Info,
  Activity,
  ChevronRight,
  BarChart3,
  MapPinned,
  CheckCircle2,
  MousePointerClick,
} from "lucide-react";

import {
  zoneNames,
  mat2026,
  matTotal,
} from "../data/mobility";

/*
 * DEWATAMOVE 2041 — DATA EXPLORER
 *
 * Dashboard data transportasi yang mudah dibaca.
 *
 * React + Vite + Tailwind CSS.
 * Tidak membutuhkan library chart tambahan.
 *
 * Sumber angka mengikuti DataExplorer sebelumnya:
 * - ToR ITEC-U
 * - Data Sekunder
 * - Case Collaborator WRI Indonesia
 * - Inventarisasi GRK Denpasar
 *
 * Perhatikan:
 * - Satuan tabel emisi belum dikonfirmasi.
 * - Mode share Bali bukan hasil survei Denpasar 2026.
 * - Simulasi TDM adalah asumsi sensitivitas.
 */

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

const EMISSION = {
  grk: {
    label: "GRK Transportasi",
    values: [5410.5, 2278.28, 506.35, 652.7, 804.04, 891.97],
    color: "#b91c1c",
  },
  co2: {
    label: "CO₂ Transportasi",
    values: [5416, 2283, 515, 660, 805, 872],
    color: "#dc2626",
  },
  no2: {
    label: "NO₂ (label tabel)",
    values: [0.21, 0.1, 0.1, 0.09, 0.09, 0.04],
    color: "#2563eb",
  },
  nh4: {
    label: "NH₄ (label tabel)",
    values: [1.16, 0.84, 0.83, 0.84, 0.31, 0.33],
    color: "#0f766e",
  },
};

const SECTORS = [
  { name: "Pembangkit listrik", value: 1645.92, color: "#334155" },
  { name: "Transportasi", value: 891.97, color: "#b91c1c" },
  { name: "Rumah tangga", value: 187.83, color: "#f59e0b" },
];

const SECTOR_TOTAL = SECTORS.reduce(
  (sum, item) => sum + item.value,
  0
);

const MODES = [
  { name: "Sepeda motor", value: 62.25345721582618, color: "#b91c1c" },
  { name: "Mobil", value: 32.84599966262082, color: "#ea580c" },
  { name: "Kendaraan berat", value: 3.4963680173374596, color: "#64748b" },
  { name: "Angkutan umum", value: 0.8910346270376266, color: "#2563eb" },
  { name: "Tidak bermotor", value: 0.5131404771779189, color: "#16a34a" },
];

const PRIVATE_SHARE = MODES[0].value + MODES[1].value;

const TMD = [
  { id: 1, route: "Kuta – Pesiapan", passengers: 34810, lf: 38.47 },
  { id: 2, route: "Ubung – Bandara", passengers: 31973, lf: 35.34 },
  { id: 3, route: "Ubung – Sanur", passengers: 15809, lf: 20.19 },
  { id: 4, route: "Ubung – Monkey Forest", passengers: 23909, lf: 28.63 },
  { id: 5, route: "Kuta – PNB", passengers: 28419, lf: 31.41 },
  { id: 6, route: "Kuta – Nusa Dua", passengers: 11737, lf: 14.99 },
];

const TOTAL_TMD = TMD.reduce(
  (sum, item) => sum + item.passengers,
  0
);

const FUELS = {
  ron88: {
    name: "RON 88",
    values: [329874, 154754, 2856, 3208, 0, 0],
  },
  ron90: {
    name: "RON 90",
    values: [504638, 470151, 151882, 197248, 226992, 231340],
  },
  ron92: {
    name: "RON 92",
    values: [157462, 106612, 29854, 29955, 39268, 55900],
  },
  ron95: {
    name: "RON 95",
    values: [2416, 2456, 1380, 1176, 1528, 1852],
  },
  biosolar: {
    name: "Biosolar",
    values: [210548, 154591, 25360, 37976, 53928, 61768],
  },
  avtur: {
    name: "Avtur",
    values: [980000, 37200, 0, 0, 0, 0],
  },
  dex: {
    name: "Dex",
    values: [1956, 1732, 0, 0, 5240, 4361],
  },
  diesel51: {
    name: "Diesel 51 dalam Biosolar",
    values: [0, 0, 0, 0, 0, 6331],
  },
};

const ROAD_VOLUME = [
  { name: "08.00", value: 225 },
  { name: "10.00", value: 252 },
  { name: "16.00", value: 265.8 },
  { name: "20.00", value: 264 },
  { name: "23.00", value: 42.8 },
];

const NAVIGATION = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "emisi", label: "Emisi" },
  { id: "energi", label: "BBM" },
  { id: "moda", label: "Moda" },
  { id: "angkutan", label: "TMD" },
  { id: "jalan", label: "Volume Jalan" },
  { id: "mat", label: "MAT 2026" },
  { id: "skenario", label: "Skenario TDM" },
];

const fmt = (value, decimals = 2) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: decimals,
  }).format(value ?? 0);

const pct = (value, digits = 2) =>
  `${fmt(value, digits)}%`;

const clamp = (v, min, max) =>
  Math.min(max, Math.max(min, v));

const zid = (i) =>
  `Z${String(i + 1).padStart(2, "0")}`;

const deltaPercent = (current, previous) =>
  previous > 0
    ? ((current - previous) / previous) * 100
    : null;

/* =========================================
   KOMPONEN VISUAL
========================================= */

function SectionTitle({
  id,
  number,
  icon: Icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
        <Icon size={17} />
        {number} / {eyebrow}
      </div>

      <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, unit, note }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Icon size={16} className="shrink-0 text-red-700" />
        {label}
      </div>

      <p className="mt-4 break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-600">
        {unit}
      </p>

      {note && (
        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          {note}
        </p>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-6">
      {(title || subtitle) && (
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-900">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

function Explanation({ title = "Cara membaca data", children }) {
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <Info size={15} className="text-red-700" />
        {title}
      </p>

      <p className="mt-2 text-xs leading-6 text-slate-600">
        {children}
      </p>
    </div>
  );
}

/*
 * Grafik tren:
 * - Titik mewakili tahun.
 * - Tombol tahun menampilkan nilai terpilih.
 * - Tidak menyimpulkan sebab perubahan.
 */
function LineChart({
  years,
  values,
  color = "#b91c1c",
  selectedYear,
  onYearChange,
  unit = "",
}) {
  const width = 600;
  const height = 260;

  const left = 66;
  const right = 28;
  const top = 30;
  const bottom = 45;

  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const maxValue = Math.max(1, ...values);
  const yMax = maxValue * 1.12;

  const points = years.map((year, index) => ({
    year,
    value: values[index],
    x: left + (index / Math.max(1, years.length - 1)) * plotW,
    y: top + plotH * (1 - values[index] / yMax),
  }));

  const line = points
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const active =
    points.find((p) => p.year === selectedYear) ??
    points[points.length - 1];

  return (
    <div>
      <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">
              Nilai tahun {active.year}
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {fmt(active.value)}
            </p>
          </div>

          <span className="text-xs font-medium text-slate-500">
            {unit}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[450px]"
          role="img"
          aria-label={`Grafik tren ${unit} ${years.join(" sampai ")}`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = top + plotH * (1 - fraction);

            return (
              <g key={fraction}>
                <line
                  x1={left}
                  x2={left + plotW}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 5"
                />

                <text
                  x={left - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="11"
                  textAnchor="end"
                >
                  {fmt(yMax * fraction, 0)}
                </text>
              </g>
            );
          })}

          <line
            x1={active.x}
            x2={active.x}
            y1={top}
            y2={top + plotH}
            stroke={color}
            strokeDasharray="5 5"
            strokeOpacity="0.35"
          />

          <polyline
            points={line}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p) => (
            <g key={p.year}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.year === active.year ? 7 : 4.5}
                fill={p.year === active.year ? color : "white"}
                stroke={color}
                strokeWidth="2.5"
              >
                <title>
                  {p.year}: {fmt(p.value)} {unit}
                </title>
              </circle>

              <text
                x={p.x}
                y={top + plotH + 25}
                fontSize="12"
                textAnchor="middle"
                fill={p.year === active.year ? color : "#64748b"}
                fontWeight={p.year === active.year ? "700" : "400"}
              >
                {p.year}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap gap-1.5">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => onYearChange(year)}
            aria-pressed={selectedYear === year}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
              selectedYear === year
                ? "bg-red-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-400 sm:hidden">
        Geser grafik ke samping jika diperlukan.
      </p>
    </div>
  );
}

function ProgressBars({
  items,
  max,
  suffix = "",
  color = "#b91c1c",
}) {
  const maximum =
    max ?? Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={`${item.name}-${i}`}>
          <div className="mb-1.5 flex items-end justify-between gap-3 text-xs">
            <span className="min-w-0 font-medium text-slate-700">
              {item.name}
            </span>

            <span className="shrink-0 font-bold tabular-nums text-slate-900">
              {fmt(item.value)}{suffix}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${clamp((item.value / maximum) * 100, 0, 100)}%`,
                backgroundColor: item.color || color,
              }}
            />
          </div>

          {item.description && (
            <p className="mt-1 text-[11px] text-slate-400">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/*
 * Diagram donat memakai CSS.
 */
function ModeDonut() {
  let progress = 0;

  const gradient = `conic-gradient(${MODES.map((item) => {
    const from = progress;
    progress += item.value;

    return `${item.color} ${from}% ${progress}%`;
  }).join(",")})`;

  return (
    <div className="flex justify-center">
      <div
        className="relative h-56 w-56 rounded-full sm:h-64 sm:w-64"
        style={{ background: gradient }}
        role="img"
        aria-label={`${pct(PRIVATE_SHARE)} pangsa sepeda motor dan mobil`}
      >
        <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-white text-center">
          <p className="text-[11px] font-semibold text-slate-500">
            Motor + Mobil
          </p>

          <p className="mt-1 text-3xl font-black text-slate-900">
            {pct(PRIVATE_SHARE, 1)}
          </p>

          <p className="text-[10px] text-slate-400">
            Bali 2024
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   HALAMAN DATA EXPLORER
========================================= */

export default function DataExplorer() {
  const [emissionType, setEmissionType] = useState("grk");
  const [emissionYear, setEmissionYear] = useState(2024);
  const [emissionRange, setEmissionRange] = useState("recent");

  const [gasType, setGasType] = useState("co2");
  const [gasYear, setGasYear] = useState(2024);

  const [fuelType, setFuelType] = useState("ron90");
  const [fuelYear, setFuelYear] = useState(2024);

  const [tmdMetric, setTmdMetric] = useState("passengers");
  const [selectedCorridor, setSelectedCorridor] = useState(1);

  const [selectedOrigin, setSelectedOrigin] = useState(10);
  const [selectedDestination, setSelectedDestination] = useState(2);
  const [showMatrixValues, setShowMatrixValues] = useState(false);

  const [reduction, setReduction] = useState(12);

  const matrixSum = useMemo(
    () =>
      mat2026.flat().reduce(
        (sum, value) => sum + Number(value || 0),
        0
      ),
    []
  );

  const originTotals = useMemo(
    () =>
      mat2026.map((row) =>
        row.reduce((sum, value) => sum + Number(value || 0), 0)
      ),
    []
  );

  const destinationTotals = useMemo(
    () =>
      zoneNames.map((_, j) =>
        mat2026.reduce(
          (sum, row) => sum + Number(row[j] || 0),
          0
        )
      ),
    []
  );

  const intraZonal = useMemo(
    () =>
      mat2026.reduce(
        (sum, row, i) => sum + Number(row[i] || 0),
        0
      ),
    []
  );

  const topOD = useMemo(
    () =>
      mat2026
        .flatMap((row, i) =>
          row.map((value, j) => ({
            i,
            j,
            value: Number(value || 0),
          }))
        )
        .filter((item) => item.i !== item.j)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    []
  );

  const maxCell = Math.max(1, ...mat2026.flat());

  const selectedOD =
    Number(
      mat2026[selectedOrigin]?.[selectedDestination] || 0
    );

  const selectedShare =
    matrixSum > 0 ? (selectedOD / matrixSum) * 100 : 0;

  const currentEmission = EMISSION[emissionType];

  const emissionYears =
    emissionRange === "recent"
      ? YEARS.slice(2)
      : YEARS;

  const emissionValues =
    emissionRange === "recent"
      ? currentEmission.values.slice(2)
      : currentEmission.values;

  const emissionIndex = YEARS.indexOf(emissionYear);
  const emissionValue = currentEmission.values[emissionIndex];

  const previousEmission =
    emissionIndex > 0
      ? currentEmission.values[emissionIndex - 1]
      : null;

  const emissionDelta =
    previousEmission == null
      ? null
      : deltaPercent(emissionValue, previousEmission);

  const fuel = FUELS[fuelType];
  const fuelIndex = YEARS.indexOf(fuelYear);
  const fuelValue = fuel.values[fuelIndex];

  const selectedGas = EMISSION[gasType];

  const corridor =
    TMD.find((item) => item.id === selectedCorridor) || TMD[0];

  const grk2024 = EMISSION.grk.values[5];
  const scenarioGRK = grk2024 * (1 - reduction / 100);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">

      {/* HERO */}

      <header className="relative overflow-hidden border-b border-slate-100 px-4 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
            DewataMove 2041 / Evidence Dashboard
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Data yang berbicara.
            <br />
            <span className="text-red-700">
              Mobilitas yang dipahami.
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Memahami tantangan transportasi Denpasar
            melalui data perjalanan, pilihan moda,
            layanan bus, penggunaan energi, dan emisi.
            Setiap grafik dilengkapi penjelasan agar
            angka lebih mudah diinterpretasikan.
          </p>

          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
              Data historis
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
              Analisis MAT 2026
            </span>
            <span className="rounded-full bg-red-50 px-3 py-2 text-red-700">
              Eksperimen TDM 2041
            </span>
          </div>
        </div>
      </header>

      {/* NAVIGASI */}

  
{/* NAVIGASI SECTION — TANPA PINDAH HALAMAN */}

<nav
  aria-label="Navigasi analisis data"
  className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md"
>
  <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-8">

    {NAVIGATION.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          const section = document.getElementById(
            item.id
          );

          if (section) {
            section.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }}
        className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-95"
      >
        {item.label}
      </button>
    ))}

  </div>
</nav>



      <div className="mx-auto max-w-7xl space-y-20 px-4 pb-24 pt-10 sm:px-8 sm:pt-14">

        {/* RINGKASAN */}

        <section id="ringkasan" className="scroll-mt-24">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              Start here
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Gambaran Mobilitas
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Empat indikator untuk memahami konteks studi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={Database}
              label="Total MAT 2026"
              value={fmt(matTotal, 0)}
              unit="smp/jam"
            />

            <KpiCard
              icon={CarFront}
              label="Motor + Mobil"
              value={pct(PRIVATE_SHARE, 1)}
              unit="Mode share Bali 2024"
            />

            <KpiCard
              icon={Leaf}
              label="Kontribusi Transportasi"
              value={pct((891.97 / SECTOR_TOTAL) * 100)}
              unit="Terhadap GRK seluruh sektor 2024"
            />

            <KpiCard
              icon={BusFront}
              label="Penumpang TMD"
              value={fmt(TOTAL_TMD, 0)}
              unit="Enam koridor · Juni 2026"
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Lihat pola perjalanan",
                text: "MAT membantu menunjukkan zona asal, zona tujuan, dan besarnya arus perjalanan.",
              },
              {
                number: "02",
                title: "Pahami pilihan moda",
                text: "Mode share dan data bus menjelaskan mengapa integrasi angkutan umum menjadi penting.",
              },
              {
                number: "03",
                title: "Uji kemungkinan perbaikan",
                text: "Skenario TDM membantu mengeksplorasi dampak yang masih perlu diuji lebih lanjut.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-2xl bg-slate-50 p-4 sm:p-5"
              >
                <p className="text-xs font-black text-red-700">
                  {item.number}
                </p>

                <h3 className="mt-2 text-sm font-bold">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <Explanation title="Panduan membaca dashboard">
            Klik tahun pada grafik garis untuk membaca nilai
            tertentu. Semakin panjang batang, semakin besar
            nilainya. Pada matriks OD, warna merah yang lebih
            kuat menunjukkan arus relatif lebih tinggi.
            Perhatikan selalu tahun, wilayah, dan satuan data.
          </Explanation>
        </section>

        {/* EMISI */}

        <section className="space-y-5">
          <SectionTitle
            id="emisi"
            number="01"
            icon={Leaf}
            eyebrow="Environmental impact"
            title="Jejak Emisi Transportasi"
            description="Menampilkan perubahan angka inventarisasi emisi dan perbandingan antar-sektor. Pilihan tahun membantu pembaca memahami perubahan tanpa langsung mengasumsikan penyebabnya."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard
              title="Bagaimana angka GRK transportasi berubah?"
              subtitle="Inventarisasi 2019–2024"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <select
                  value={emissionType}
                  onChange={(e) => setEmissionType(e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  <option value="grk">GRK Transportasi</option>
                  <option value="co2">CO₂ Transportasi</option>
                </select>

                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    onClick={() => {
                      setEmissionRange("recent");
                      if (emissionYear < 2021) {
                        setEmissionYear(2024);
                      }
                    }}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
                      emissionRange === "recent"
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    2021–2024
                  </button>

                  <button
                    onClick={() => setEmissionRange("all")}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
                      emissionRange === "all"
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Semua tahun
                  </button>
                </div>
              </div>

              <LineChart
                years={emissionYears}
                values={emissionValues}
                color={currentEmission.color}
                selectedYear={emissionYear}
                onYearChange={setEmissionYear}
                unit="Angka sesuai tabel sumber"
              />

              <Explanation title="Apa yang terlihat?">
                Pada tahun {emissionYear}, nilai{" "}
                {currentEmission.label.toLowerCase()} adalah{" "}
                <strong>{fmt(emissionValue)}</strong>.
                {emissionDelta != null && (
                  <>
                    {" "}Perubahannya{" "}
                    <strong>
                      {emissionDelta >= 0 ? "naik" : "turun"}{" "}
                      {pct(Math.abs(emissionDelta))}
                    </strong>{" "}
                    dibandingkan tahun sebelumnya.
                  </>
                )}
                {" "}Perubahan ini belum menunjukkan
                penyebab ataupun efektivitas kebijakan tertentu.
              </Explanation>
            </ChartCard>

            <ChartCard
              title="Sektor mana yang menyumbang angka GRK?"
              subtitle="Komposisi sektor, 2024"
            >
              <div className="mb-6 flex h-5 overflow-hidden rounded-full">
                {SECTORS.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      width: `${(item.value / SECTOR_TOTAL) * 100}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.name}: ${fmt(item.value)}`}
                  />
                ))}
              </div>

              <ProgressBars
                items={SECTORS}
                max={SECTOR_TOTAL}
              />

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500">
                  Pangsa transportasi dari total sektor
                </p>

                <p className="mt-1 text-3xl font-black text-red-700">
                  {pct((891.97 / SECTOR_TOTAL) * 100)}
                </p>
              </div>

              <Explanation>
                Grafik membandingkan sektor berdasarkan
                angka pada tabel GRK yang sama. Bagian
                transportasi dihitung dari 891,97 dibagi
                total 2.725,72. Ini bukan persentase CO₂
                kendaraan terhadap seluruh emisi kota.
              </Explanation>
            </ChartCard>
          </div>

          <ChartCard
            title="Rincian CO₂ dan gas lainnya"
            subtitle="Pilih parameter untuk melihat tren masing-masing"
          >
            <div className="mb-5 flex flex-wrap gap-2">
              {["co2", "no2", "nh4"].map((key) => (
                <button
                  key={key}
                  onClick={() => setGasType(key)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold ${
                    gasType === key
                      ? "bg-red-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {EMISSION[key].label}
                </button>
              ))}
            </div>

            <LineChart
              years={YEARS}
              values={selectedGas.values}
              selectedYear={gasYear}
              onYearChange={setGasYear}
              color={selectedGas.color}
              unit="Angka sesuai tabel"
            />

            <Explanation title="Perhatikan satuan dan jenis gas">
              Tabel sumber memakai label NO₂ dan NH₄,
              sementara narasi ToR membahas CH₄ dan N₂O.
              Notasi tersebut berbeda secara kimia.
              Karena itu, nilainya ditampilkan terpisah,
              tidak dijumlahkan ataupun dikonversi menjadi CO₂e.
              Satuan asli juga masih perlu dikonfirmasi.
            </Explanation>
          </ChartCard>
        </section>

        {/* ENERGI */}

        <section className="space-y-5">
          <SectionTitle
            id="energi"
            number="02"
            icon={Fuel}
            eyebrow="Energy consumption"
            title="Konsumsi Bahan Bakar"
            description="Memahami bagaimana konsumsi bahan bakar yang tercatat berubah menurut jenis dan tahun. Angka ditampilkan dalam kiloliter (kL)."
          />

          <ChartCard
            title="Tren konsumsi bahan bakar"
            subtitle="Tabel 14 ToR · 2019–2024"
          >
            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Pilih jenis bahan bakar
              </label>

              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold sm:max-w-sm"
              >
                {Object.entries(FUELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
              <LineChart
                years={YEARS}
                values={fuel.values}
                selectedYear={fuelYear}
                onYearChange={setFuelYear}
                color="#ea580c"
                unit="kiloliter (kL)"
              />

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold text-slate-500">
                  {fuel.name} · {fuelYear}
                </p>

                <p className="mt-2 text-3xl font-black">
                  {fmt(fuelValue, 0)}
                </p>

                <p className="text-xs text-slate-500">
                  kiloliter
                </p>

                <div className="mt-6 space-y-3">
                  {YEARS.map((year, index) => (
                    <button
                      key={year}
                      onClick={() => setFuelYear(year)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs ${
                        fuelYear === year
                          ? "bg-white font-bold text-red-700"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span>{year}</span>
                      <span>{fmt(fuel.values[index], 0)} kL</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Explanation>
              Pilih jenis BBM untuk membandingkan perubahan
              dalam jenis yang sama. Nilai nol mengikuti
              tabel sumber dan belum tentu membuktikan
              tidak adanya konsumsi; status pencatatannya
              perlu dipastikan. Tren konsumsi tidak otomatis
              menjelaskan tren emisi tanpa faktor emisi
              dan batasan inventarisasi yang sesuai.
            </Explanation>
          </ChartCard>
        </section>

        {/* MODA */}

        <section className="space-y-5">
          <SectionTitle
            id="moda"
            number="03"
            icon={CarFront}
            eyebrow="Travel behavior"
            title="Bagaimana Orang Bepergian?"
            description="Mode share Bali 2024 menunjukkan pembagian moda transportasi. Angka ini menjadi referensi struktur perjalanan, bukan hasil pengukuran khusus semua perjalanan Denpasar pada 2026."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard
              title="Komposisi Moda"
              subtitle="Provinsi Bali · 2024"
            >
              <ModeDonut />

              <Explanation>
                Dari setiap 100 bagian moda pada data
                Bali 2024, sekitar 95,1 bagian berasal
                dari motor dan mobil jika keduanya
                digabungkan.
              </Explanation>
            </ChartCard>

            <ChartCard
              title="Rincian Moda"
              subtitle="Persentase dari seluruh kelompok moda"
            >
              <ProgressBars
                items={MODES}
                max={100}
                suffix="%"
              />

              <Explanation title="Apa implikasinya untuk TDM?">
                Dominasi kendaraan pribadi menunjukkan
                bahwa solusi tidak cukup berupa
                penambahan jalan. Peningkatan daya
                tarik angkutan umum, pengelolaan parkir,
                dan akses ke halte menjadi kandidat
                kebijakan yang perlu diuji.
              </Explanation>
            </ChartCard>
          </div>
        </section>

        {/* TRANS METRO DEWATA */}

        <section className="space-y-5">
          <SectionTitle
            id="angkutan"
            number="04"
            icon={BusFront}
            eyebrow="Public transport"
            title="Kinerja Trans Metro Dewata"
            description="Perbandingan jumlah penumpang dan load factor dari enam koridor selama Juni 2026. Pilih koridor untuk membaca nilainya secara detail."
          />

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <ChartCard
              title="Bandingkan Enam Koridor"
              subtitle="Pilih indikator, kemudian pilih salah satu koridor"
            >
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setTmdMetric("passengers")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold ${
                    tmdMetric === "passengers"
                      ? "bg-red-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Penumpang
                </button>

                <button
                  onClick={() => setTmdMetric("lf")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold ${
                    tmdMetric === "lf"
                      ? "bg-red-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Load Factor
                </button>
              </div>

              <div className="space-y-3">
                {TMD.map((item) => {
                  const value = item[tmdMetric];

                  const maximum =
                    tmdMetric === "lf"
                      ? 100
                      : Math.max(...TMD.map((x) => x.passengers));

                  const selected =
                    item.id === selectedCorridor;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCorridor(item.id)}
                      className={`w-full rounded-xl border p-3 text-left transition sm:p-4 ${
                        selected
                          ? "border-red-300 bg-red-50"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold">
                          Koridor {item.id}
                        </span>

                        <span className="font-black tabular-nums">
                          {fmt(value)}
                          {tmdMetric === "lf" ? "%" : ""}
                        </span>
                      </div>

                      <div className="h-2.5 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-red-700 transition-all"
                          style={{
                            width: `${clamp(
                              (value / maximum) * 100,
                              0,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-500">
                        {item.route}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ChartCard>

            <ChartCard
              title={`Detail Koridor ${corridor.id}`}
              subtitle={corridor.route}
            >
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs text-slate-500">
                    Penumpang selama Juni
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {fmt(corridor.passengers, 0)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs text-slate-500">
                    Load Factor
                  </p>

                  <p className="mt-2 text-3xl font-black text-red-700">
                    {pct(corridor.lf)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-500">
                    Total seluruh koridor
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {fmt(TOTAL_TMD, 0)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Penumpang · Juni 2026
                  </p>
                </div>
              </div>

              <Explanation>
                Jumlah penumpang menunjukkan
                penggunaan layanan selama periode
                pencatatan. Load factor menunjukkan
                tingkat keterisian menurut data
                sumber. Keduanya tidak boleh
                disamakan, dan load factor antarkoridor
                tidak dijumlahkan.
              </Explanation>
            </ChartCard>
          </div>
        </section>

        {/* VOLUME JALAN */}

        <section className="space-y-5">
          <SectionTitle
            id="jalan"
            number="05"
            icon={Activity}
            eyebrow="Road observation"
            title="Aktivitas Lalu Lintas Ruas"
            description="Contoh pembacaan data observasi Jalan Waturenggong pada 2022 dengan lima interval waktu yang tercantum pada berkas sekunder."
          />

          <ChartCard
            title="Perbandingan antarwaktu pengamatan"
            subtitle="Jalan Waturenggong · 2022"
          >
            <ProgressBars
              items={ROAD_VOLUME}
              color="#64748b"
            />

            <Explanation>
              Batang yang lebih panjang berarti
              nilai pengamatan lebih tinggi pada
              interval tersebut. Ini adalah contoh
              pengamatan satu ruas jalan, bukan
              gambaran seluruh Denpasar. Penyebutan
              periode 10 menit dan satuan volumenya
              mengikuti dokumen sumber dan perlu
              dipertahankan saat membandingkan
              dengan data ruas lainnya.
            </Explanation>
          </ChartCard>
        </section>

        {/* MAT */}

        <section className="space-y-5">
          <SectionTitle
            id="mat"
            number="06"
            icon={Database}
            eyebrow="Origin–destination demand"
            title="Dari Mana dan Ke Mana Perjalanan?"
            description="MAT 2026 menunjukkan besar pergerakan antarzona. Pilih zona asal dan tujuan, atau sentuh sebuah sel heatmap untuk melihat angka pergerakannya."
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={Database}
              label="Total Matriks"
              value={fmt(matrixSum, 0)}
              unit="smp/jam"
            />

            <KpiCard
              icon={MapPinned}
              label="Zona Studi"
              value={fmt(zoneNames.length, 0)}
              unit="zona"
            />

            <KpiCard
              icon={ArrowRightLeft}
              label="Intrazona"
              value={fmt(intraZonal, 0)}
              unit="smp/jam"
            />

            <KpiCard
              icon={CheckCircle2}
              label="Kesesuaian Total"
              value={
                Math.abs(matrixSum - matTotal) < 0.01
                  ? "Sesuai"
                  : "Perlu cek"
              }
              unit="Total matriks vs nilai referensi"
            />
          </div>

          <ChartCard
            title="Eksplorasi Pasangan Asal–Tujuan"
            subtitle="Pilih dua zona untuk memahami arus pergerakannya"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">
                Zona Asal
                <select
                  value={selectedOrigin}
                  onChange={(e) =>
                    setSelectedOrigin(Number(e.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  {zoneNames.map((name, i) => (
                    <option key={i} value={i}>
                      {zid(i)} — {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold text-slate-600">
                Zona Tujuan
                <select
                  value={selectedDestination}
                  onChange={(e) =>
                    setSelectedDestination(Number(e.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  {zoneNames.map((name, i) => (
                    <option key={i} value={i}>
                      {zid(i)} — {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Bangkitan Zona Asal
                </p>

                <p className="mt-2 text-xl font-black">
                  {fmt(originTotals[selectedOrigin], 0)}
                </p>

                <p className="text-[11px] text-slate-500">
                  smp/jam
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Tarikan Zona Tujuan
                </p>

                <p className="mt-2 text-xl font-black">
                  {fmt(destinationTotals[selectedDestination], 0)}
                </p>

                <p className="text-[11px] text-slate-500">
                  smp/jam
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-700">
                  OD {zid(selectedOrigin)} → {zid(selectedDestination)}
                </p>

                <p className="mt-2 text-xl font-black text-red-700">
                  {fmt(selectedOD, 0)}
                </p>

                <p className="text-[11px] text-red-700">
                  smp/jam
                </p>
              </div>
            </div>

            <Explanation title="Apa arti angka OD ini?">
              Pergerakan {zid(selectedOrigin)} ke{" "}
              {zid(selectedDestination)} menyumbang{" "}
              <strong>{pct(selectedShare)}</strong>{" "}
              dari total MAT yang dihitung. Bangkitan
              menjumlahkan seluruh perjalanan yang
              berasal dari suatu zona, sedangkan
              tarikan menjumlahkan seluruh perjalanan
              yang menuju zona tersebut.
            </Explanation>
          </ChartCard>

          {/* HEATMAP INTERAKTIF */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 sm:rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-6">
              <div>
                <h3 className="text-base font-black">
                  Heatmap Matriks Asal Tujuan
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  13 × 13 · smp/jam · klik sel untuk memilih
                </p>
              </div>

              <button
                onClick={() =>
                  setShowMatrixValues((value) => !value)
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50"
              >
                {showMatrixValues
                  ? "Sembunyikan angka"
                  : "Tampilkan angka"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 z-10 border-b bg-slate-50 p-3 text-left">
                      Asal ↓ / Tujuan →
                    </th>

                    {zoneNames.map((_, j) => (
                      <th
                        key={j}
                        className={`border-b px-2 py-3 text-center ${
                          selectedDestination === j
                            ? "text-red-700"
                            : "text-slate-500"
                        }`}
                      >
                        {zid(j)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {mat2026.map((row, i) => (
                    <tr key={i}>
                      <th
                        className={`sticky left-0 z-10 border-b bg-white p-3 text-left ${
                          selectedOrigin === i
                            ? "font-black text-red-700"
                            : "text-slate-600"
                        }`}
                      >
                        {zid(i)}
                      </th>

                      {row.map((raw, j) => {
                        const value = Number(raw || 0);
                        const intensity = Math.sqrt(
                          value / maxCell
                        );

                        const active =
                          selectedOrigin === i &&
                          selectedDestination === j;

                        return (
                          <td
                            key={j}
                            className="border border-white p-[2px]"
                          >
                            <button
                              onClick={() => {
                                setSelectedOrigin(i);
                                setSelectedDestination(j);
                              }}
                              title={`${zid(i)} → ${zid(j)}: ${fmt(value, 0)} smp/jam`}
                              aria-label={`${zid(i)} ke ${zid(j)}, ${fmt(value, 0)} smp per jam`}
                              className={`flex h-10 w-full min-w-[45px] items-center justify-center rounded-sm text-[10px] tabular-nums transition ${
                                active
                                  ? "ring-2 ring-inset ring-slate-900"
                                  : "hover:ring-2 hover:ring-inset hover:ring-red-500"
                              }`}
                              style={{
                                backgroundColor:
                                  `rgba(185,28,28,${0.07 + intensity * 0.86})`,
                                color:
                                  intensity > 0.68
                                    ? "white"
                                    : "#334155",
                              }}
                            >
                              {showMatrixValues
                                ? fmt(value, 0)
                                : active
                                  ? "●"
                                  : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Rendah</span>

                <div className="h-3 w-32 rounded-full bg-gradient-to-r from-red-50 to-red-800" />

                <span>Tinggi</span>
              </div>

              <span className="flex items-center gap-1">
                <MousePointerClick size={14} />
                Pilih sel
              </span>
            </div>
          </div>

          <Explanation>
            Setiap baris adalah zona asal dan setiap
            kolom adalah zona tujuan. Warna menunjukkan
            besar nilai relatif terhadap sel terbesar
            dalam matriks, bukan tingkat kemacetan
            ruas jalan. Matriks juga bukan peta lokasi
            geografis.
          </Explanation>

          {/* TOP OD */}

          <div className="pt-3">
            <h3 className="mb-5 text-xl font-black">
              Enam Pergerakan OD Terbesar
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              {topOD.map((pair, index) => (
                <button
                  key={`${pair.i}-${pair.j}`}
                  onClick={() => {
                    setSelectedOrigin(pair.i);
                    setSelectedDestination(pair.j);
                    document.getElementById("mat")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-red-300 hover:bg-red-50 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400">
                      #{index + 1} · Asal–Tujuan
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-lg font-black">
                      {zid(pair.i)}
                      <ChevronRight size={16} className="text-red-700" />
                      {zid(pair.j)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {zoneNames[pair.i]}
                      {" → "}
                      {zoneNames[pair.j]}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-black text-red-700">
                      {fmt(pair.value, 0)}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      smp/jam
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* KALKULATOR SKENARIO */}

        <section className="space-y-5">
          <SectionTitle
            id="skenario"
            number="07"
            icon={TrendingDown}
            eyebrow="Policy exploration"
            title="Bagaimana Jika TDM Diterapkan?"
            description="Eksperimen sensitivitas untuk menunjukkan kemungkinan perubahan angka emisi apabila aktivitas penghasil emisi berkurang secara proporsional."
          />

          <div className="grid gap-5 rounded-2xl border border-slate-200 p-4 sm:rounded-3xl sm:p-7 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold">
                Asumsi Penurunan Emisi
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Geser parameter di bawah ini.
                Ini bukan hasil pengukuran lapangan,
                tetapi ilustrasi hubungan matematis
                antara perubahan persentase dan
                angka acuan inventarisasi GRK.
              </p>

              <div className="mt-7 flex items-end justify-between">
                <span className="text-xs text-slate-500">
                  Besaran asumsi
                </span>

                <span className="text-4xl font-black text-red-700">
                  {reduction}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={reduction}
                onChange={(e) =>
                  setReduction(Number(e.target.value))
                }
                className="mt-4 w-full accent-red-700"
              />

              <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {[5, 10, 15, 20, 30].map((value) => (
                  <button
                    key={value}
                    onClick={() => setReduction(value)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${
                      reduction === value
                        ? "bg-red-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>

              <Explanation title="Kebijakan yang bisa diuji">
                Manajemen parkir, prioritas bus,
                restrukturisasi trayek, integrasi
                feeder TMD, dan pengaturan jam puncak.
                Pengaruh masing-masing kebijakan
                belum dihitung oleh slider ini.
              </Explanation>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Perbandingan Indeks
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span>Baseline</span>
                    <span>100</span>
                  </div>

                  <div className="h-5 rounded-full bg-slate-200">
                    <div className="h-full w-full rounded-full bg-slate-700" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span>Skenario TDM</span>
                    <span>{100 - reduction}</span>
                  </div>

                  <div className="h-5 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{
                        width: `${100 - reduction}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Angka acuan GRK 2024
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {fmt(grk2024)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Nilai skenario ilustratif
                  </p>

                  <p className="mt-2 text-2xl font-black text-emerald-700">
                    {fmt(scenarioGRK)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-6 text-slate-500">
                Rumus: {fmt(grk2024)} × (1 − {reduction}/100)
                = <strong>{fmt(scenarioGRK)}</strong>.
                Selisihnya{" "}
                <strong>{fmt(grk2024 - scenarioGRK)}</strong>{" "}
                dalam satuan angka tabel sumber.
              </p>
            </div>
          </div>
        </section>

        {/* CATATAN DATA */}

        <section className="rounded-2xl border border-slate-200 p-5 sm:rounded-3xl sm:p-7">
          <div className="flex items-start gap-3">
            <Info
              size={20}
              className="mt-1 shrink-0 text-red-700"
            />

            <div>
              <h3 className="text-base font-bold">
                Tentang Sumber dan Batasan Data
              </h3>

              <p className="mt-3 text-xs leading-7 text-slate-600">
                Dashboard menggabungkan beberapa
                periode dan wilayah: emisi serta
                BBM historis 2019–2024, mode share
                Bali 2024, MAT Denpasar 2026,
                dan penumpang TMD Juni 2026.
                Masing-masing memiliki cakupan
                dan satuan yang berbeda.
              </p>

              <p className="mt-3 text-xs leading-7 text-slate-600">
                Total MAT dinyatakan dalam smp/jam,
                bukan otomatis jumlah kendaraan,
                penumpang, atau kilometer perjalanan.
                Angka emisi belum dikonversi menjadi
                ton CO₂e karena satuan dan label
                beberapa gas masih perlu diverifikasi.
              </p>

              <p className="mt-3 text-xs leading-7 text-slate-600">
                Gambar RTRW dan pola ruang dapat
                digunakan sebagai referensi konteks
                tata ruang, tetapi tidak boleh
                langsung diperlakukan sebagai data
                GIS terukur tanpa georeferensi.
                Hasil slider TDM merupakan skenario
                sensitivitas, bukan prediksi emisi
                yang telah dikalibrasi.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
