
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ModelMap from "../components/modeling/ModelMap";

import { getDenpasarNetwork } from "../data/denpasarNetworkBrowser";

import { MODEL_ZONES } from "../data/modelEngine";

import {
  POLICY_SCENARIOS,
  createPolicyModel,
  normalizePolicy,
} from "../data/policyEngine";

import { assignTraffic } from "../data/trafficAssignment";

/*
  DEWATAMOVE 2041
  MODELING STUDIO

  Light mode
  Tailwind CSS
  Satu file untuk seluruh halaman modeling

  BEFORE
  PROCESS
  AFTER
  COMPARISON

  Visualisasi:
  - Angka hasil Before dan After
  - Heatmap OD 13 x 13
  - Angka perubahan pada setiap kotak
  - Merah = kenaikan
  - Hijau kebiruan = penurunan
  - Abu-abu = tetap
  - Detail OD interaktif
  - Daftar perubahan terbesar
*/

// ==========================================
// CONFIGURATION
// ==========================================

const RED = "#B91C1C";
const TEAL = "#0F766E";
const STORAGE_KEY = "dewata-2041-policy-v2";

const STAGES = [
  { id: "before", title: "SEBELUM", label: "Sebelum" },
  { id: "process", title: "PROSES", label: "Proses" },
  { id: "after", title: "SESUDAH", label: "Sesudah" },
  {
    id: "comparison",
    title: "PERBANDINGAN",
    label: "Perbandingan",
  },
];

// ==========================================
// NUMBER HELPERS
// ==========================================

function fmt(value, digits = 0) {
  return Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function signedNumber(value, digits = 0) {
  const n = Number(value) || 0;
  const prefix = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${prefix}${fmt(Math.abs(n), digits)}`;
}

function getChange(before, after) {
  const a = Number(before) || 0;
  const b = Number(after) || 0;

  if (a === 0 && b > 0) {
    return { value: null, status: "increase", newFlow: true };
  }

  if (a === 0 && b === 0) {
    return { value: 0, status: "same", newFlow: false };
  }

  const value = ((b - a) / a) * 100;

  return {
    value,
    status:
      value > 0.001
        ? "increase"
        : value < -0.001
        ? "decrease"
        : "same",
    newFlow: false,
  };
}

function changeText(before, after) {
  const change = getChange(before, after);

  if (change.newFlow) return "BARU";

  return `${signedNumber(change.value, 1)}%`;
}

function zoneId(index) {
  return `Z${String(index + 1).padStart(2, "0")}`;
}

// ==========================================
// COLOR SCALE
// ==========================================

function getHeatStyle(before, after) {
  const change = getChange(before, after);

  if (change.status === "same") {
    return {
      background: "#F1F5F9",
      color: "#64748B",
    };
  }

  if (change.newFlow) {
    return {
      background: "#991B1B",
      color: "#FFFFFF",
    };
  }

  const strength = Math.abs(change.value);

  // KENAIKAN = MERAH
  if (change.status === "increase") {
    if (strength >= 25)
      return { background: "#991B1B", color: "#FFFFFF" };

    if (strength >= 15)
      return { background: "#B91C1C", color: "#FFFFFF" };

    if (strength >= 8)
      return { background: "#F1A3A3", color: "#7F1D1D" };

    if (strength >= 3)
      return { background: "#FBD2D2", color: "#991B1B" };

    return { background: "#FFF1F2", color: "#B91C1C" };
  }

  // PENURUNAN = HIJAU KEBIRUAN
  if (strength >= 25)
    return { background: "#115E59", color: "#FFFFFF" };

  if (strength >= 15)
    return { background: "#0F766E", color: "#FFFFFF" };

  if (strength >= 8)
    return { background: "#8DCDC5", color: "#134E4A" };

  if (strength >= 3)
    return { background: "#C9E9E4", color: "#115E59" };

  return { background: "#EDF8F6", color: "#0F766E" };
}

// ==========================================
// LOAD SAVED POLICY
// ==========================================

function getInitialPolicy() {
  try {
    const saved =
      typeof window !== "undefined"
        ? JSON.parse(
            sessionStorage.getItem(STORAGE_KEY) || "null"
          )
        : null;

    return normalizePolicy(
      saved || POLICY_SCENARIOS.integrated
    );
  } catch {
    return normalizePolicy(POLICY_SCENARIOS.integrated);
  }
}

// ==========================================
// BIG TITLE SLIDE
// ==========================================

function ModelingTitleSlide({ stage }) {
  const current =
    STAGES.find((item) => item.id === stage) || STAGES[0];

  return (
    <section
      className="
        relative flex min-h-[42vh]
        items-center justify-center
        overflow-hidden bg-white
        px-5 pb-16 pt-36
        sm:min-h-[50vh]
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,0.045),transparent_65%)]
        "
      />

      <div className="relative text-center">
        <h1
          key={current.id}
          className="
            break-words
            text-[clamp(2.5rem,9vw,8rem)]
            font-black leading-none
            tracking-[-0.075em]
            text-[#B91C1C]
          "
        >
          {current.title}
        </h1>

        <div className="mx-auto mt-8 h-[3px] w-16 rounded-full bg-[#B91C1C]" />
      </div>
    </section>
  );
}

// ==========================================
// SIMPLE NAVIGATION
// ==========================================

function ModelingTabs({ stage, onNavigate }) {
  return (
    <nav
      aria-label="Tahapan modeling"
      className="
        flex justify-center gap-6
        overflow-x-auto border-b
        border-slate-200 px-4
        sm:gap-12
      "
    >
      {STAGES.map((item) => {
        const active = item.id === stage;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate?.(item.id)}
            aria-current={active ? "page" : undefined}
            className={`
              shrink-0 border-b-2
              px-1 py-4
              text-[13px] font-semibold
              transition-colors duration-150
              ${
                active
                  ? "border-[#B91C1C] text-[#B91C1C]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }
            `}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ==========================================
// POLICY SLIDER
// ==========================================

function PolicySetting({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "%",
  onChange,
}) {
  return (
    <label className="block border-b border-slate-100 py-4">
      <span className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[13px] font-medium text-slate-700">
          {label}
        </span>

        <strong className="shrink-0 text-[13px] tabular-nums text-[#B91C1C]">
          {fmt(value, step < 1 ? 2 : 0)}
          {unit}
        </strong>
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[#B91C1C]"
      />
    </label>
  );
}

// ==========================================
// COMPARISON SUMMARY
// ==========================================

function ComparisonSummary({ model }) {
  const before = model.beforeTotal || 0;
  const after = model.afterTotal || 0;
  const delta = after - before;
  const change = getChange(before, after);

  const resultColor =
    change.status === "increase"
      ? RED
      : change.status === "decrease"
      ? TEAL
      : "#334155";

  return (
    <section className="border-y border-slate-200">
      <div className="grid gap-8 py-9 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div>
          <p className="text-[12px] font-medium text-slate-500">
            Sebelum TDM
          </p>

          <p
            className="
              mt-3 text-[clamp(2.1rem,5vw,4.4rem)]
              font-bold leading-none
              tracking-[-0.065em]
              tabular-nums text-slate-900
            "
          >
            {fmt(before)}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            smp/jam · proyeksi 2041
          </p>
        </div>

        <div className="hidden h-20 w-px bg-slate-200 md:block" />

        <div>
          <p className="text-[12px] font-medium text-slate-500">
            Sesudah TDM
          </p>

          <p
            className="
              mt-3 text-[clamp(2.1rem,5vw,4.4rem)]
              font-bold leading-none
              tracking-[-0.065em]
              tabular-nums
            "
            style={{ color: resultColor }}
          >
            {fmt(after)}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            smp/jam · proyeksi 2041
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-5 border-t border-slate-200 py-7">
        <div>
          <p className="text-[12px] text-slate-500">
            Perubahan permintaan
          </p>

          <p
            className="
              mt-2 text-[clamp(2.3rem,6vw,4.7rem)]
              font-bold leading-none
              tracking-[-0.07em]
              tabular-nums
            "
            style={{ color: resultColor }}
          >
            {changeText(before, after)}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-[12px] text-slate-500">
            Selisih ekuivalen
          </p>

          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {signedNumber(delta)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            smp/jam
          </p>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// HEATMAP LEGEND
// ==========================================

function HeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] text-slate-600">
      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-[3px] bg-[#B91C1C]" />
        Kenaikan
      </span>

      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-[3px] bg-[#F1F5F9] ring-1 ring-slate-200" />
        Tetap
      </span>

      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-[3px] bg-[#0F766E]" />
        Penurunan
      </span>

      <span className="text-slate-400">
        Warna lebih pekat = perubahan lebih besar
      </span>
    </div>
  );
}

// ==========================================
// SINGLE HEATMAP CELL
// ==========================================

function HeatCell({
  before,
  after,
  active,
  origin,
  destination,
  onClick,
}) {
  const style = getHeatStyle(before, after);
  const label = changeText(before, after);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${origin} ke ${destination}, perubahan ${label}`}
      title={`${origin} → ${destination}: ${label}`}
      className={`
        relative flex aspect-square
        min-h-[49px] min-w-0
        items-center justify-center
        rounded-[4px] px-0.5
        text-center text-[10px]
        font-bold tabular-nums
        transition-[transform,box-shadow]
        duration-150
        hover:z-10 hover:scale-105
        focus-visible:z-10
        focus-visible:outline-2
        focus-visible:outline-[#B91C1C]
        ${
          active
            ? "z-10 ring-2 ring-[#B91C1C] ring-offset-2"
            : ""
        }
      `}
      style={{
        backgroundColor: style.background,
        color: style.color,
      }}
    >
      {label}
    </button>
  );
}

// ==========================================
// MATRIX HEATMAP 13 x 13
// ==========================================

function MatrixHeatmap({
  model,
  selected,
  onSelect,
}) {
  const beforeMatrix = model.matrixBefore;
  const afterMatrix = model.matrixAfter;
  const zones = model.zones || MODEL_ZONES;

  const [origin, destination] = selected;

  const selectedBefore =
    beforeMatrix[origin]?.[destination] || 0;

  const selectedAfter =
    afterMatrix[origin]?.[destination] || 0;

  const delta = selectedAfter - selectedBefore;
  const change = getChange(selectedBefore, selectedAfter);

  const changeColor =
    change.status === "increase"
      ? RED
      : change.status === "decrease"
      ? TEAL
      : "#334155";

  const columns = beforeMatrix.length;

  return (
    <section className="border-t border-slate-200 py-10 sm:py-14">
      <div className="mb-7">
        <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
          Peta perubahan perjalanan antarzona
        </h3>

        <p className="mt-3 max-w-3xl text-[13px] leading-7 text-slate-500">
          Setiap kotak mewakili hubungan asal dan tujuan.
          Angka menunjukkan persentase perubahan permintaan
          dari Sebelum ke Sesudah. Klik kotak untuk melihat
          nilai lengkapnya.
        </p>
      </div>

      <HeatLegend />

      {/* MATRIX */}

      <div className="mt-8 overflow-x-auto pb-5">
        <div
          className="w-full"
          style={{
            minWidth: `${70 + columns * 55}px`,
          }}
        >
          {/* DESTINATION LABELS */}

          <div
            className="mb-1 grid gap-1"
            style={{
              gridTemplateColumns:
                `65px repeat(${columns}, minmax(0,1fr))`,
            }}
          >
            <span className="flex items-end text-[10px] font-semibold text-slate-400">
              ASAL
            </span>

            {Array.from({ length: columns }, (_, j) => (
              <span
                key={j}
                className="pb-2 text-center text-[10px] font-semibold text-slate-500"
              >
                {zoneId(j)}
              </span>
            ))}
          </div>

          {/* MATRIX ROWS */}

          {beforeMatrix.map((row, i) => (
            <div
              key={i}
              className="mb-1 grid gap-1"
              style={{
                gridTemplateColumns:
                  `65px repeat(${columns}, minmax(0,1fr))`,
              }}
            >
              <div className="flex items-center text-[11px] font-semibold text-slate-600">
                {zoneId(i)}
              </div>

              {row.map((before, j) => (
                <HeatCell
                  key={`${i}-${j}`}
                  before={before}
                  after={afterMatrix[i]?.[j] || 0}
                  origin={zoneId(i)}
                  destination={zoneId(j)}
                  active={
                    origin === i &&
                    destination === j
                  }
                  onClick={() => onSelect([i, j])}
                />
              ))}
            </div>
          ))}

          <p className="mt-4 pl-[65px] text-center text-[10px] font-semibold tracking-[0.14em] text-slate-400">
            ZONA TUJUAN
          </p>
        </div>
      </div>

      {/* SELECTED OD DETAIL */}

      <div className="mt-7 border-l-[3px] border-[#B91C1C] bg-[#F8FAFC] px-5 py-6 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Hubungan terpilih
        </p>

        <h4 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {zoneId(origin)} → {zoneId(destination)}
        </h4>

        <p className="mt-2 text-[12px] leading-6 text-slate-500">
          {zones[origin]?.name || "Zona asal"} menuju{" "}
          {zones[destination]?.name || "zona tujuan"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">
              Sebelum
            </p>

            <p className="mt-2 text-xl font-bold tabular-nums">
              {fmt(selectedBefore)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Sesudah
            </p>

            <p className="mt-2 text-xl font-bold tabular-nums">
              {fmt(selectedAfter)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Selisih
            </p>

            <p
              className="mt-2 text-xl font-bold tabular-nums"
              style={{ color: changeColor }}
            >
              {signedNumber(delta)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Perubahan
            </p>

            <p
              className="mt-2 text-xl font-bold tabular-nums"
              style={{ color: changeColor }}
            >
              {changeText(selectedBefore, selectedAfter)}
            </p>
          </div>
        </div>

        <p className="mt-5 text-[11px] text-slate-500">
          Nilai Sebelum, Sesudah, dan Selisih dalam smp/jam.
          Persentase dihitung relatif terhadap nilai Sebelum.
        </p>
      </div>
    </section>
  );
}

// ==========================================
// LARGEST OD CHANGES
// ==========================================

function ODChanges({ model, selected, onSelect }) {
  const pairs = useMemo(() => {
    return [...(model.pairs || [])]
      .sort(
        (a, b) =>
          Math.abs(b.after - b.before) -
          Math.abs(a.after - a.before)
      )
      .slice(0, 8);
  }, [model]);

  return (
    <section className="border-t border-slate-200 py-10 sm:py-14">
      <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
        Hubungan dengan perubahan terbesar
      </h3>

      <p className="mt-3 max-w-3xl text-[13px] leading-7 text-slate-500">
        Diurutkan berdasarkan besarnya selisih absolut
        antara Sebelum dan Sesudah, bukan hanya persentasenya.
      </p>

      <div className="mt-7 overflow-x-auto">
        <div className="min-w-[550px]">
          <div className="grid grid-cols-[1fr_130px_130px_110px] gap-4 border-b border-slate-200 pb-3 text-[11px] font-semibold text-slate-500">
            <span>Hubungan OD</span>
            <span className="text-right">Sebelum</span>
            <span className="text-right">Sesudah</span>
            <span className="text-right">Perubahan</span>
          </div>

          {pairs.map((pair) => {
            const change = getChange(pair.before, pair.after);

            const color =
              change.status === "increase"
                ? RED
                : change.status === "decrease"
                ? TEAL
                : "#64748B";

            const active =
              selected[0] === pair.from &&
              selected[1] === pair.to;

            return (
              <button
                key={`${pair.from}-${pair.to}`}
                type="button"
                onClick={() =>
                  onSelect([pair.from, pair.to])
                }
                className={`
                  grid w-full
                  grid-cols-[1fr_130px_130px_110px]
                  items-center gap-4
                  border-b border-slate-100
                  px-2 py-4 text-left
                  text-[12px]
                  transition-colors
                  ${
                    active
                      ? "bg-[#FFF7F7]"
                      : "hover:bg-slate-50"
                  }
                `}
              >
                <span className="font-semibold text-slate-800">
                  {zoneId(pair.from)} → {zoneId(pair.to)}
                </span>

                <span className="text-right tabular-nums text-slate-600">
                  {fmt(pair.before)}
                </span>

                <span className="text-right tabular-nums text-slate-600">
                  {fmt(pair.after)}
                </span>

                <span
                  className="text-right font-bold tabular-nums"
                  style={{ color }}
                >
                  {changeText(pair.before, pair.after)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// COMPLETE COMPARISON SECTION
// ==========================================

function ModelingComparison({ model, assignment }) {
  const [selected, setSelected] = useState([10, 2]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B91C1C]">
          Hasil Pemodelan · 2041
        </p>

        <h2 className="mt-3 max-w-4xl text-[clamp(1.9rem,4vw,3.4rem)] font-bold leading-[1.15] tracking-[-0.055em] text-slate-900">
          Dampak kebijakan terhadap perjalanan.
        </h2>

        <p className="mt-4 max-w-3xl text-[13px] leading-7 text-slate-500">
          Hasil Before dan After dihitung menggunakan dasar
          pertumbuhan yang sama. Perubahan ditampilkan pada
          tingkat seluruh MAT dan setiap hubungan asal–tujuan.
        </p>
      </div>

      <ComparisonSummary model={model} />

      <MatrixHeatmap
        model={model}
        selected={selected}
        onSelect={setSelected}
      />

      <ODChanges
        model={model}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="border-t border-slate-200 py-6">
        <p className="text-[12px] font-semibold text-slate-800">
          Catatan interpretasi
        </p>

        <p className="mt-2 max-w-4xl text-[11px] leading-6 text-slate-500">
          Hasil bersumber dari MAT 2026 yang diproyeksikan
          ke 2041 dan respons kebijakan berbasis asumsi
          sensitivitas. Angka belum dikalibrasi terhadap survei
          lapangan, serta tidak dapat langsung diartikan
          sebagai jumlah penumpang yang berpindah ke TMD.
        </p>

        <p className="mt-2 max-w-4xl text-[11px] leading-6 text-slate-500">
          {assignment
            ? `Cakupan OD antarzona yang berhasil dibebankan pada jaringan sampel: ${fmt(
                assignment.coverage * 100,
                1
              )}%. Ini bukan cakupan seluruh ruas jalan Denpasar.`
            : "Data pembebanan jalan belum tersedia. Heatmap membandingkan nilai matriks OD."}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// SIMULATION STORY
// ==========================================

function SimulationStory({ stage }) {
  const descriptions = {
    before:
      "Kendaraan bergerak dengan permintaan perjalanan sebelum kebijakan diterapkan.",
    process:
      "Kebijakan parkir, feeder, angkutan umum, dan jam sibuk diuji dalam model.",
    after:
      "Permintaan perjalanan diperbarui berdasarkan kebijakan yang diterapkan.",
    comparison:
      "Perbedaan permintaan Sebelum dan Sesudah ditampilkan untuk dievaluasi.",
  };

  const count =
    stage === "before"
      ? 9
      : stage === "process"
      ? 6
      : stage === "after"
      ? 4
      : 7;

  return (
    <section className="mt-12 border-t border-slate-200 pt-9 sm:mt-16">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
        Alur Simulasi
      </h2>

      <p className="mt-3 max-w-3xl text-[13px] leading-7 text-slate-500">
        {descriptions[stage]}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC]">
        <div className="flex min-h-[240px] items-center justify-center px-5 py-8 sm:min-h-[320px]">
          <svg
            viewBox="0 0 700 210"
            className="w-full max-w-[850px]"
            aria-label="Animasi ilustratif kendaraan pada koridor"
            role="img"
          >
            <rect x="10" y="62" width="680" height="37" rx="7" fill="#E2E8F0" />
            <rect x="10" y="115" width="680" height="37" rx="7" fill="#E2E8F0" />

            <path
              d="M20 81 H680"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="16 12"
            />

            <path
              d="M20 133 H680"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="16 12"
            />

            {Array.from({ length: count }, (_, index) => (
              <rect
                key={`${stage}-${index}`}
                x="-40"
                y={index % 2 === 0 ? 71 : 124}
                width={index % 3 === 0 ? 29 : 22}
                height="14"
                rx="4"
                fill={index % 3 === 0 ? "#B91C1C" : "#64748B"}
              >
                <animate
                  attributeName="x"
                  from="-40"
                  to="710"
                  dur={`${5 + (index % 4)}s`}
                  begin={`-${index * 0.8}s`}
                  repeatCount="indefinite"
                />
              </rect>
            ))}

            {(stage === "process" || stage === "after") && (
              <rect
                x="-80"
                y="120"
                width="65"
                height="24"
                rx="5"
                fill="#FFFFFF"
                stroke="#B91C1C"
                strokeWidth="2"
              >
                <animate
                  attributeName="x"
                  from="-80"
                  to="710"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </rect>
            )}

            <path
              d="M40 182 H660"
              stroke="#B91C1C"
              strokeWidth="2"
              strokeDasharray="3 10"
              opacity=".35"
            />
          </svg>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <p className="text-[11px] leading-6 text-slate-500">
            Animasi ilustratif untuk menjelaskan alur,
            bukan posisi kendaraan atau hasil survei real-time.
          </p>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function ModelOverview({
  type = "before",
  onNavigate,
}) {
  const stage = STAGES.some((item) => item.id === type)
    ? type
    : "before";

  const [intro, setIntro] = useState(true);

  const [applied, setApplied] = useState(getInitialPolicy);
  const [draft, setDraft] = useState(getInitialPolicy);

  const [chosenZone, setChosenZone] = useState("Z11");

  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDetails, setShowDetails] = useState(false);

  // ======================================
  // CINEMATIC INTRO
  // ======================================

  useEffect(() => {
    setIntro(true);
  }, [stage]);

  const handleIntroDone = useCallback(() => {
    setIntro(false);
  }, []);

  // ======================================
  // MODEL CALCULATION
  // ======================================

  const model = useMemo(
    () => createPolicyModel(applied),
    [applied]
  );

  const assignment = useMemo(() => {
    if (!graph) return null;

    try {
      return assignTraffic(graph, model);
    } catch (err) {
      console.error("Traffic assignment:", err);
      return null;
    }
  }, [graph, model]);

  const selectedPairs = useMemo(
    () =>
      model.pairs
        .filter((pair) => pair.origin.id === chosenZone)
        .slice(0, 5),
    [model, chosenZone]
  );

  const selectZone = useCallback((id) => {
    setChosenZone(id);
  }, []);

  // ======================================
  // LOAD ROAD NETWORK
  // ======================================

  useEffect(() => {
    let cancelled = false;

    getDenpasarNetwork()
      .then((data) => {
        if (cancelled) return;

        setGraph(data);
        setLoading(false);
      })
      .catch((reason) => {
        if (cancelled) return;

        setError(
          reason?.message ||
          "Jaringan jalan belum tersedia."
        );

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ======================================
  // POLICY CONTROLS
  // ======================================

  function updateDraft(field, value) {
    setDraft((previous) =>
      normalizePolicy({
        ...previous,
        [field]: value,
      })
    );
  }

  function applyPolicy() {
    const next = normalizePolicy(draft);

    setApplied(next);

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // Session storage optional
    }

    onNavigate?.("after");
  }

  function downloadJSON(side) {
    const isBefore = side === "before";

    const payload = {
      study: "DewataMove 2041",
      stage: side,
      year: 2041,
      unit: "smp/jam",
      policy: model.policy,
      matrix: isBefore
        ? model.matrixBefore
        : model.matrixAfter,
      total: isBefore
        ? model.beforeTotal
        : model.afterTotal,
      caveat: model.caveat,
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `DewataMove_${side}_2041.json`;

    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ======================================
  // RENDER
  // ======================================

  return (
    <>

      <div className="min-h-screen bg-white text-slate-900">

        {/* LARGE TITLE SLIDE */}

        <ModelingTitleSlide stage={stage} />

        {/* TABS */}

        <ModelingTabs
          stage={stage}
          onNavigate={onNavigate}
        />

        {/* PAGE BODY */}

        <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-10 sm:px-7 sm:pt-14 lg:px-10">

          {/* =================================
              COMPARISON FIRST
          ================================= */}

          {stage === "comparison" && (
            <ModelingComparison
              model={model}
              assignment={assignment}
            />
          )}

          {/* =================================
              MAP AND CONTROLS
          ================================= */}

          <div
            className="
              grid items-start gap-8
              lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]
            "
          >
            {/* MAP */}

            <section className="min-w-0">
              <h2 className="mb-4 text-xl font-bold tracking-tight">
                {stage === "comparison"
                  ? "Jaringan Jalan"
                  : "Peta Pemodelan"}
              </h2>

              <ModelMap
                stage={stage}
                model={model}
                assignment={assignment}
                selectedZone={chosenZone}
                onSelectZone={selectZone}
              />

              <p className="mt-3 text-[11px] leading-6 text-slate-500">
                {loading
                  ? "Memuat jaringan jalan..."
                  : error
                  ? "Jaringan belum tersedia. Peta dasar dan garis OD tetap dapat ditampilkan."
                  : "Jaringan koridor sampel berbasis OpenStreetMap dan OSRM."}
              </p>

              {/* ZONE SELECTOR */}

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-[15px] font-semibold">
                    Perjalanan Antarzona
                  </h3>

                  <select
                    value={chosenZone}
                    onChange={(e) => setChosenZone(e.target.value)}
                    className="
                      max-w-full rounded-lg
                      border border-slate-200
                      bg-white px-3 py-2
                      text-xs outline-none
                      focus:border-[#B91C1C]
                    "
                  >
                    {MODEL_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.id} · {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  {selectedPairs.map((pair) => {
                    const before = pair.before;
                    const after = pair.after;

                    return (
                      <div
                        key={`${pair.from}-${pair.to}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <span className="text-[12px] font-medium text-slate-600">
                          {pair.origin.id} → {pair.destination.id}
                        </span>

                        <span className="text-[12px] font-semibold tabular-nums">
                          {fmt(
                            stage === "before"
                              ? before
                              : after
                          )}{" "}
                          <span className="font-normal text-slate-500">
                            smp/jam
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SIDEBAR */}

            <aside className="min-w-0 border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">

              {/* BEFORE */}

              {stage === "before" && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Kondisi Awal
                  </h2>

                  <p className="mt-4 text-[13px] leading-7 text-slate-500">
                    Proyeksi lalu lintas Denpasar pada 2041
                    sebelum penerapan kebijakan Transport
                    Demand Management.
                  </p>

                  <button
                    type="button"
                    onClick={() => onNavigate?.("process")}
                    className="mt-7 rounded-full bg-[#B91C1C] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#991B1B]"
                  >
                    Lanjut ke Proses
                  </button>
                </>
              )}

              {/* PROCESS */}

              {stage === "process" && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Kebijakan TDM
                  </h2>

                  <p className="mt-3 text-[13px] leading-7 text-slate-500">
                    Sesuaikan kebijakan, lalu jalankan
                    simulasi untuk menghitung kondisi
                    setelah intervensi.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {Object.entries(POLICY_SCENARIOS).map(
                      ([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setDraft(normalizePolicy(preset))
                          }
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-[#B91C1C] hover:text-[#B91C1C]"
                        >
                          {key === "integrated"
                            ? "Terintegrasi"
                            : key === "pull"
                            ? "TMD + Feeder"
                            : key === "push"
                            ? "Parkir"
                            : "Jam Sibuk"}
                        </button>
                      )
                    )}
                  </div>

                  <div className="mt-5">
                    <PolicySetting
                      label="Pertumbuhan tahunan"
                      value={draft.annualGrowth}
                      min={0}
                      max={5}
                      step={0.25}
                      onChange={(v) =>
                        updateDraft("annualGrowth", v)
                      }
                    />

                    <PolicySetting
                      label="Kenaikan tarif parkir"
                      value={draft.parkingIncrease}
                      min={0}
                      max={100}
                      step={5}
                      onChange={(v) =>
                        updateDraft("parkingIncrease", v)
                      }
                    />

                    <PolicySetting
                      label="Headway TMD"
                      value={draft.targetHeadway}
                      unit=" menit"
                      min={5}
                      max={30}
                      onChange={(v) =>
                        updateDraft("targetHeadway", v)
                      }
                    />

                    <PolicySetting
                      label="Akses feeder"
                      value={draft.feederAccess}
                      min={0}
                      max={100}
                      step={5}
                      onChange={(v) =>
                        updateDraft("feederAccess", v)
                      }
                    />

                    <PolicySetting
                      label="Pergeseran jam sibuk"
                      value={draft.peakShift}
                      min={0}
                      max={30}
                      onChange={(v) =>
                        updateDraft("peakShift", v)
                      }
                    />

                    <label className="flex items-center justify-between gap-4 py-4 text-[13px] font-medium text-slate-700">
                      Prioritas bus

                      <input
                        type="checkbox"
                        checked={draft.busPriority}
                        onChange={(e) =>
                          updateDraft(
                            "busPriority",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 accent-[#B91C1C]"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={applyPolicy}
                    className="mt-6 w-full rounded-xl bg-[#B91C1C] px-5 py-3.5 text-[13px] font-semibold text-white hover:bg-[#991B1B]"
                  >
                    Jalankan Simulasi
                  </button>
                </>
              )}

              {/* AFTER */}

              {stage === "after" && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Kondisi Setelah TDM
                  </h2>

                  <p className="mt-4 text-[13px] leading-7 text-slate-500">
                    Proyeksi kondisi lalu lintas setelah
                    pengaturan kebijakan diterapkan
                    pada model perjalanan.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.("comparison")
                    }
                    className="mt-7 rounded-full bg-[#B91C1C] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#991B1B]"
                  >
                    Lihat Hasil Perbandingan
                  </button>
                </>
              )}

              {/* COMPARISON */}

              {stage === "comparison" && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Evaluasi Jaringan
                  </h2>

                  <p className="mt-4 text-[13px] leading-7 text-slate-500">
                    Heatmap di atas membandingkan permintaan
                    perjalanan antarzona. Peta ini membantu
                    melihat distribusi pembebanan pada
                    jaringan koridor sampel.
                  </p>

                  <button
                    type="button"
                    onClick={() => onNavigate?.("process")}
                    className="mt-7 rounded-full border border-[#B91C1C] px-6 py-3 text-[13px] font-semibold text-[#B91C1C] hover:bg-red-50"
                  >
                    Uji Kebijakan Lain
                  </button>
                </>
              )}

              {/* DETAILS */}

              <div className="mt-8 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowDetails((value) => !value)
                  }
                  aria-expanded={showDetails}
                  className="text-[13px] font-semibold text-slate-600 hover:text-[#B91C1C]"
                >
                  {showDetails
                    ? "Tutup detail perhitungan"
                    : "Lihat detail perhitungan"}
                </button>

                {showDetails && (
                  <div className="mt-5 space-y-4 text-[13px]">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Sebelum
                      </span>
                      <strong>{fmt(model.beforeTotal)}</strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Sesudah
                      </span>
                      <strong>{fmt(model.afterTotal)}</strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Perubahan
                      </span>
                      <strong
                        style={{
                          color:
                            model.afterTotal > model.beforeTotal
                              ? RED
                              : TEAL,
                        }}
                      >
                        {changeText(
                          model.beforeTotal,
                          model.afterTotal
                        )}
                      </strong>
                    </div>

                    <p className="text-[11px] leading-6 text-slate-500">
                      Hasil merupakan proyeksi skenario
                      dan belum dikalibrasi dengan
                      survei lalu lintas.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadJSON("before")
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                      >
                        Ekspor Before
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadJSON("after")
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                      >
                        Ekspor After
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* ANIMATION STORY */}

          <SimulationStory stage={stage} />

          <p className="mt-8 max-w-4xl text-[11px] leading-6 text-slate-400">
            DewataMove 2041 menggunakan proyeksi MAT dan
            koefisien kebijakan eksploratif. Nilai yang
            divisualisasikan bukan hasil survei lapangan
            atau pemodelan jaringan terkalibrasi.
          </p>
        </div>
      </div>
    </>
  );
}
