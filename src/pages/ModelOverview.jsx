import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Toaster, toast } from "sonner";
import ModelMap from "../components/modeling/ModelMap";
import { getDenpasarNetwork } from "../data/denpasarNetworkModeling";
import { MODEL_ZONES } from "../data/modelEngine";
import { POLICY_SCENARIOS, createPolicyModel, normalizePolicy } from "../data/policyEngine";
import { assignTraffic } from "../data/trafficAssignment";



/**
 * DEWATAMOVE 2041 — Modeling Studio / Traffic Maps
 * Light mode, Tailwind CSS, satu file ModelOverview.
 * - Before: peta kondisi baseline
 * - Proses: slider terhubung ke dua peta (baseline & pratinjau)
 * - After: peta dari kebijakan tersimpan
 * - Perbandingan: ringkasan hasil dan heatmap OD (tanpa peta ganda)
 * - Tidak memakai grafik batang template, ikon dekoratif, atau stylesheet baru.
 * - MAT / hasil kebijakan = data model. Animasi mobil = ilustrasi gerak relatif.
 */
const STAGES = [
  { id: "before", label: "Sebelum", title: "SEBELUM" },
  { id: "process", label: "Proses", title: "PROSES" },
  { id: "after", label: "Sesudah", title: "SESUDAH" },
  { id: "comparison", label: "Perbandingan", title: "PERBANDINGAN" },
];
const STORAGE_KEY = "dewata-2041-policy-v2";
const APPLIED_RUN_KEY = "dewata-2041-applied-run-v3";
const format = (n, digits = 0) => Number(n || 0).toLocaleString("id-ID", {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
});
const sign = (n, digits = 0) => {
  const v = Number(n) || 0;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${format(Math.abs(v), digits)}`;
};
const percent = (before, after) => before > 0 ? ((after - before) / before) * 100 : null;
const pctLabel = (before, after) => {
  const p = percent(before, after);
  return p === null ? (after > 0 ? "BARU" : "0,0%") : `${sign(p, 1)}%`;
};
const zoneCode = (i) => `Z${String(i + 1).padStart(2, "0")}`;
function initialPolicy() {
  try {
    const saved = typeof window !== "undefined"
      ? JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null") : null;
    return normalizePolicy(saved || POLICY_SCENARIOS.integrated);
  } catch {
    return normalizePolicy(POLICY_SCENARIOS.integrated);
  }
}
function IntroLoading({ onComplete }) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId;
    const start = performance.now();
    const duration = reduceMotion ? 420 : 1450;
    const tick = (now) => {
      const ratio = Math.min(1, (now - start) / duration);
      setProgress(Math.round(ratio * 100));
      if (ratio < 1) frameId = requestAnimationFrame(tick);
      else onComplete();
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete, reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? {} : { opacity: 0, transition: { duration: 0.22 } }}
      className="fixed inset-0 z-[7500] grid place-items-center bg-[#FFFEFD] px-5"
      role="status" aria-label="Memuat halaman modeling"
    >
      <div className="w-full max-w-3xl text-center">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20, letterSpacing: "-0.10em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "-0.065em" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="select-none text-[clamp(3.2rem,11vw,8.5rem)] font-black leading-none text-[#B91C1C]"
        >
          MODELING
        </motion.h2>
        <div className="mx-auto mt-9 h-[3px] w-full max-w-[290px] overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-[#B91C1C]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.08, ease: "linear" }}
          />
        </div>
        <p className="mt-3 text-[11px] font-semibold tracking-[0.14em] tabular-nums text-slate-400">{progress}%</p>
        <button type="button" onClick={onComplete}
          className="mt-6 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-[#B91C1C] focus-visible:outline-2 focus-visible:outline-[#B91C1C]">
          Skip
        </button>
      </div>
    </motion.div>
  );
}

function Headline({ stage }) {
  const title = STAGES.find((x) => x.id === stage)?.title || "SEBELUM";
  return (
    <section className="flex min-h-[270px] items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,.04),transparent_65%)] px-4 pb-12 pt-32 sm:min-h-[380px] sm:pt-40">
      <div className="text-center">
        <h1 className="break-words text-[clamp(2.5rem,9.2vw,7.7rem)] font-black leading-none tracking-[-0.07em] text-[#B91C1C]">{title}</h1>
        <div className="mx-auto mt-7 h-[3px] w-16 rounded-full bg-[#B91C1C]" />
      </div>
    </section>
  );
}
function Tabs({ stage, onNavigate }) {
  return (
    <nav aria-label="Tahap modeling" className="flex justify-center gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:gap-12">
      {STAGES.map((x) => (
        <button key={x.id} type="button" aria-current={stage === x.id ? "page" : undefined} onClick={() => onNavigate?.(x.id)}
          className={`shrink-0 border-b-2 px-1 py-4 text-[13px] font-semibold transition-colors ${stage === x.id ? "border-[#B91C1C] text-[#B91C1C]" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
          {x.label}
        </button>
      ))}
    </nav>
  );
}
function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "%" }) {
  return (
    <label className="block border-b border-slate-100 py-3.5 last:border-0">
      <span className="mb-2 flex items-center justify-between gap-3 text-[12px] font-medium text-slate-700">
        <span>{label}</span><strong className="shrink-0 font-semibold tabular-nums text-[#B91C1C]">{format(value, step < 1 ? 2 : 0)}{unit}</strong>
      </span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))}
        className="block h-1.5 w-full cursor-pointer accent-[#B91C1C]" />
    </label>
  );
}
function SectionHeading({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-[-0.035em] text-slate-900 sm:text-[26px]">{title}</h2>
      {description && <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">{description}</p>}
    </div>
  );
}
function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
      <span className="font-medium text-slate-600">Tekanan arus relatif</span>
      {[["#0F766E", "Rendah"], ["#D3AC4A", "Sedang"], ["#E48C36", "Tinggi"], ["#B91C1C", "Sangat tinggi"]].map(([color, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
      ))}
    </div>
  );
}
function MapPair({ model, assignment, graph, labelAfter, selectedZone, onSelectZone, view, onViewChange }) {
  const change = percent(model.beforeTotal, model.afterTotal);
  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Sebelum TDM</h3>
            <span className="text-xs tabular-nums text-slate-500">{format(model.beforeTotal)} smp/jam</span>
          </div>
          <ModelMap compact stage="before" label="SEBELUM" graph={graph} model={model} assignment={assignment} selectedZone={selectedZone} onSelectZone={onSelectZone} syncView={view} onViewChange={onViewChange} />
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">{labelAfter}</h3>
            <span className="text-xs tabular-nums text-slate-500">{format(model.afterTotal)} smp/jam</span>
          </div>
          <ModelMap compact stage="after" label="SESUDAH" graph={graph} model={model} assignment={assignment} selectedZone={selectedZone} onSelectZone={onSelectZone} syncView={view} onViewChange={onViewChange} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <MapLegend />
        <p className={`text-[12px] font-semibold tabular-nums ${change > 0 ? "text-[#B91C1C]" : "text-[#0F766E]"}`}>
          {change === null ? "Perubahan belum terdefinisi" : `${sign(change, 1)}% permintaan jam puncak`}
        </p>
      </div>
      <p className="mt-3 text-[11px] leading-6 text-slate-500">Geser atau zoom salah satu peta: peta lainnya mengikuti posisi yang sama. Kendaraan dan warna ruas merupakan representasi relatif dari model, bukan pengukuran kemacetan/V/C aktual.</p>
    </div>
  );
}
function ComparisonSummary({ model }) {
  const change = percent(model.beforeTotal, model.afterTotal);
  const color = change > 0 ? "text-[#B91C1C]" : change < 0 ? "text-[#0F766E]" : "text-slate-700";
  return (
    <div className="mb-10 border-y border-slate-200">
      <div className="grid gap-6 py-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-500">Sebelum TDM</p>
          <p className="mt-2 break-words text-[clamp(2rem,5vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums">{format(model.beforeTotal)}</p>
          <p className="mt-2 text-[11px] text-slate-500">smp/jam · horizon 2041</p>
        </div>
        <div className="sm:border-l sm:border-slate-200 sm:pl-9">
          <p className="text-xs font-medium text-slate-500">Sesudah TDM</p>
          <p className={`mt-2 break-words text-[clamp(2rem,5vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums ${color}`}>{format(model.afterTotal)}</p>
          <p className="mt-2 text-[11px] text-slate-500">smp/jam · horizon 2041</p>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 py-6">
        <div><p className="text-xs text-slate-500">Perubahan permintaan</p><p className={`mt-1 text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.06em] tabular-nums ${color}`}>{pctLabel(model.beforeTotal, model.afterTotal)}</p></div>
        <div className="sm:text-right"><p className="text-xs text-slate-500">Selisih ekuivalen</p><p className="mt-1 text-xl font-semibold tabular-nums">{sign(model.afterTotal - model.beforeTotal)} smp/jam</p></div>
      </div>
    </div>
  );
}
function heatClass(before, after) {
  const value = percent(before, after);
  if (value === null) return after > 0 ? "bg-[#991B1B] text-white" : "bg-slate-100 text-slate-500";
  if (Math.abs(value) < 0.05) return "bg-slate-100 text-slate-500";
  const magnitude = Math.abs(value);
  if (value > 0) {
    if (magnitude >= 20) return "bg-[#991B1B] text-white";
    if (magnitude >= 10) return "bg-[#B91C1C] text-white";
    if (magnitude >= 4) return "bg-[#F3B2B2] text-[#7F1D1D]";
    return "bg-[#FFF1F2] text-[#B91C1C]";
  }
  if (magnitude >= 20) return "bg-[#115E59] text-white";
  if (magnitude >= 10) return "bg-[#0F766E] text-white";
  if (magnitude >= 4) return "bg-[#BDE6E0] text-[#115E59]";
  return "bg-[#EDF8F6] text-[#0F766E]";
}
function ODHeatmap({ model }) {
  const [selected, setSelected] = useState([10, 2]);
  const [from, to] = selected;
  const before = model.matrixBefore[from]?.[to] || 0;
  const after = model.matrixAfter[from]?.[to] || 0;
  const changes = useMemo(() => (model.pairs || []).slice()
    .sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before)).slice(0, 6), [model]);
  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <SectionHeading title="Perubahan perjalanan antarzona" description="Angka dalam setiap kotak adalah persentase perubahan OD. Merah berarti kenaikan, hijau kebiruan berarti penurunan, dan abu-abu berarti tetap. Pilih kotak untuk membaca volume detail." />
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-600">
        {[["bg-[#B91C1C]", "Kenaikan"], ["bg-slate-100 border border-slate-200", "Tetap"], ["bg-[#0F766E]", "Penurunan"]].map(([cls, txt]) => (
          <span key={txt} className="inline-flex items-center gap-2"><span className={`h-3 w-3 rounded-[2px] ${cls}`} />{txt}</span>
        ))}
      </div>
      <div className="max-w-full overflow-x-auto pb-4">
        <div className="min-w-[840px]">
          <div className="grid grid-cols-[60px_repeat(13,minmax(0,1fr))] gap-1 pb-1">
            <span className="self-end text-[10px] font-semibold text-slate-500">ASAL</span>
            {Array.from({ length: 13 }, (_, j) => <span key={j} className="pb-2 text-center text-[10px] font-semibold text-slate-500">{zoneCode(j)}</span>)}
          </div>
          {model.matrixBefore.map((row, i) => (
            <div key={i} className="mb-1 grid grid-cols-[60px_repeat(13,minmax(0,1fr))] gap-1">
              <span className="self-center text-[11px] font-semibold text-slate-600">{zoneCode(i)}</span>
              {row.map((v, j) => (
                <button key={j} type="button" aria-label={`${zoneCode(i)} ke ${zoneCode(j)} perubahan ${pctLabel(v, model.matrixAfter[i]?.[j] || 0)}`} aria-pressed={selected[0] === i && selected[1] === j}
                  onClick={() => setSelected([i, j])}
                  className={`flex aspect-square min-h-[50px] items-center justify-center rounded-[4px] px-0.5 text-[10px] font-bold tabular-nums outline-offset-2 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#B91C1C] ${heatClass(v, model.matrixAfter[i]?.[j] || 0)} ${selected[0] === i && selected[1] === j ? "z-10 ring-2 ring-[#B91C1C] ring-offset-2" : ""}`}>
                  {pctLabel(v, model.matrixAfter[i]?.[j] || 0)}
                </button>
              ))}
            </div>
          ))}
          <p className="mt-2 pl-[60px] text-center text-[10px] font-semibold tracking-widest text-slate-400">ZONA TUJUAN</p>
        </div>
      </div>
      <div className="mt-5 border-l-[3px] border-[#B91C1C] bg-[#F8FAFC] px-5 py-5 sm:px-7">
        <p className="text-[11px] font-semibold text-slate-500">Hubungan terpilih</p>
        <h3 className="mt-1 text-lg font-bold">{zoneCode(from)} → {zoneCode(to)}</h3>
        <p className="mt-1 text-[12px] leading-5 text-slate-500">{MODEL_ZONES[from]?.name} menuju {MODEL_ZONES[to]?.name}</p>
        <div className="mt-5 grid grid-cols-2 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-4">
          {[["Sebelum", format(before)], ["Sesudah", format(after)], ["Selisih", sign(after - before)], ["Perubahan", pctLabel(before, after)]].map(([label, value], i) => (
            <div key={label}><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-bold tabular-nums ${i >= 2 ? (after > before ? "text-[#B91C1C]" : after < before ? "text-[#0F766E]" : "text-slate-700") : "text-slate-900"}`}>{value}</p></div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-500">Volume Before, After dan selisih dalam smp/jam; persentase relatif terhadap Before.</p>
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-bold tracking-tight">Hubungan dengan perubahan absolut terbesar</h3>
        <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
          {changes.map((p) => <button type="button" key={`${p.from}-${p.to}`} onClick={() => setSelected([p.from, p.to])}
            className="grid w-full grid-cols-[1fr_90px_100px] items-center gap-3 py-3 text-left text-xs hover:bg-slate-50 sm:grid-cols-[1fr_140px_140px_110px]">
            <span className="font-semibold text-slate-800">{zoneCode(p.from)} → {zoneCode(p.to)}</span>
            <span className="text-right tabular-nums text-slate-500">{format(p.before)}</span>
            <span className="text-right tabular-nums text-slate-500">{format(p.after)}</span>
            <span className={`hidden text-right font-bold tabular-nums sm:block ${p.after > p.before ? "text-[#B91C1C]" : "text-[#0F766E]"}`}>{pctLabel(p.before, p.after)}</span>
          </button>)}
        </div>
      </div>
    </section>
  );
}
function Explanation({ stage }) {
  const steps = {
    before: ["MAT 2026", "Proyeksi 2041", "Pembebanan ruas", "Baseline"],
    process: ["Parkir", "TMD & feeder", "Jam puncak", "Pembebanan ulang"],
    after: ["Kebijakan terpilih", "Permintaan baru", "Peta sesudah", "Evaluasi"],
    comparison: ["Horizon sama", "Ringkasan", "Perubahan OD", "Evaluasi"],
  };
  const description = {
    before: "Data asal–tujuan diproyeksikan dan dibebankan pada koridor yang tersambung di jaringan sampel.",
    process: "Slider kebijakan mengubah permintaan pada pratinjau secara langsung. Tekan Terapkan untuk menyimpan hasil After.",
    after: "Model menghitung ulang permintaan, lalu peta menggambarkan perubahan tekanan arus dan gerak kendaraan.",
    comparison: "Ringkasan Before–After dan heatmap OD menyajikan dampak kebijakan dalam angka yang mudah dibandingkan.",
  };
  return (
    <section className="mt-12 border-t border-slate-200 pt-8">
      <SectionHeading title="Alur simulasi" description={description[stage]} />
      <div className="grid gap-3 sm:grid-cols-4">
        {steps[stage].map((s, i) => (
          <div key={s} className="border-t-2 border-[#B91C1C] bg-[#F8FAFC] px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-800">{s}</p>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#B91C1C]/70 motion-safe:animate-pulse" style={{ width: `${25 + i * 23}%` }}/></div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-6 text-slate-500">Ilustrasi interaktif di peta memperlihatkan tekanan arus relatif; tidak menunjukkan posisi kendaraan, kemacetan, atau kecepatan hasil pengukuran lapangan.</p>
    </section>
  );
}
function exportJSON(model, assignment, stage) {
  const before = stage === "before";
  const content = {
    project: "DewataMove 2041", scenario: stage, year: 2041, unit: "smp/jam",
    policy: model.policy,
    total: before ? model.beforeTotal : model.afterTotal,
    mat: before ? model.matrixBefore : model.matrixAfter,
    roads: assignment?.roads.map((r) => ({ id: r.id, before: r.before, after: r.after })) || null,
    coverage: assignment?.coverage ?? null,
    limitations: [model.caveat, assignment?.caveat],
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `DewataMove_${stage}_2041.json`; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/** Bukti hasil tersimpan HANYA ditulis setelah tombol Terapkan selesai. */
function readCompletedRun() {
  try {
    if (typeof window === "undefined") return null;
    const result = JSON.parse(window.sessionStorage.getItem(APPLIED_RUN_KEY) || "null");
    if (result?.completed === true && result.policy) {
      return {
        completed: true,
        policy: normalizePolicy(result.policy),
        savedAt: result.savedAt || null,
        networkAssigned: Boolean(result.networkAssigned),
      };
    }
  } catch { /* optional storage */ }
  return null;
}

const ANALYSIS_STEPS = [
  { title: "Memuat data dasar", detail: "Menyiapkan MAT 2026 dan parameter proyeksi." },
  { title: "Menghitung dampak kebijakan", detail: "Menghitung matriks Before dan After pada horizon 2041." },
  { title: "Mensimulasikan arus perjalanan", detail: "Membebankan OD pada koridor sampel, jika jaringan tersedia." },
  { title: "Mengkaji hasil simulasi", detail: "Memeriksa konsistensi total dan menyiapkan hasil." },
];

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function waitPaint() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

/** Modal modern memakai Motion; teks fase bergerak halus, bukan panel langkah bertumpuk. */
function ProcessingModal({ phase, graphAvailable }) {
  const dialogRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const phases = ANALYSIS_STEPS.map((step, index) =>
    index === 2 && !graphAvailable
      ? { ...step, detail: "Matriks siap; jaringan jalan sampel belum tersedia." }
      : step
  );
  const index = Math.max(0, Math.min(phase, phases.length - 1));
  const current = phases[index];
  const progress = ((index + 1) / phases.length) * 100;

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  return (
    <motion.div
      key="model-processing-overlay"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[8400] flex items-center justify-center bg-slate-950/15 px-4 py-5 backdrop-blur-[3px]"
    >
      <motion.section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-process-title"
        aria-describedby="dm-process-desc"
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            dialogRef.current?.focus();
          }
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? {} : { opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 29 }}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white px-6 pb-7 pt-8 shadow-[0_24px_100px_rgba(15,23,42,.13)] outline-none sm:px-9 sm:pb-9 sm:pt-10"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B91C1C]">DEWATAMOVE 2041</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {phases.map((_, i) => (
              <motion.span key={i}
                animate={{ backgroundColor: i <= index ? "#B91C1C" : "#E2E8F0", width: i === index ? 22 : 6 }}
                transition={{ duration: 0.32 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="relative mb-8 flex h-20 items-center justify-center" aria-hidden="true">
          <motion.div
            className="absolute h-[74px] w-[74px] rounded-full border border-[#B91C1C]/15"
            animate={reduceMotion ? {} : { scale: [0.95, 1.16, 0.95], opacity: [0.7, 0.25, 0.7] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-[48px] w-[48px] rounded-full border-[3px] border-[#FCE8E8] border-t-[#B91C1C]"
            animate={reduceMotion ? {} : { rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <h2 id="dm-process-title" className="text-center text-[23px] font-bold tracking-[-0.045em] text-slate-900 sm:text-[28px]">
          Memproses skenario
        </h2>
        <div className="mt-4 min-h-[86px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? {} : { opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="text-center"
              aria-live="polite"
            >
              <p id="dm-process-desc" className="text-[14px] font-semibold text-slate-800">{current.title}</p>
              <p className="mt-1.5 text-[12px] leading-6 text-slate-500">{current.detail}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100" aria-label="Progres perhitungan">
          <motion.div
            className="h-full rounded-full bg-[#B91C1C]"
            initial={{ width: "6%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 105, damping: 21 }}
          />
        </div>
        <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">Model MAT dan pembebanan jaringan sampel</p>
      </motion.section>
    </motion.div>
  );
}

/** Empty state yang SELALU terlihat ketika belum ada kebijakan diterapkan. */
function EmptyResults({ stage, onNavigate }) {
  const reduceMotion = useReducedMotion();
  const after = stage === "after";
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex min-h-[420px] max-w-[760px] flex-col items-center justify-center py-16 text-center sm:min-h-[510px]"
      aria-labelledby="dm-empty-title"
    >
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[11px] font-semibold text-amber-800">Hasil belum tersedia</span>
      <h2 id="dm-empty-title" className="mt-6 max-w-[600px] text-[clamp(1.65rem,4.5vw,2.65rem)] font-bold leading-tight tracking-[-0.05em] text-slate-900">
        Kebijakan belum diterapkan.
      </h2>
      <p className="mt-4 max-w-lg text-[13px] leading-7 text-slate-500 sm:text-[14px]">
        {after
          ? "Untuk melihat kondisi Sesudah, atur parameter kebijakan TDM terlebih dahulu dan jalankan skenarionya pada halaman Proses."
          : "Belum ada hasil yang dapat dibandingkan. Jalankan skenario melalui halaman Proses untuk menampilkan analisis Sebelum dan Sesudah."}
      </p>
      <motion.button
        type="button"
        whileHover={reduceMotion ? {} : { y: -2 }}
        whileTap={reduceMotion ? {} : { scale: 0.98 }}
        onClick={() => onNavigate?.("process")}
        className="mt-7 rounded-full bg-[#B91C1C] px-7 py-3.5 text-[13px] font-bold text-white shadow-[0_7px_19px_rgba(185,28,28,.13)] transition-colors hover:bg-[#991B1B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B91C1C]"
      >
        Atur kebijakan
      </motion.button>
      <p className="mt-5 text-[11px] text-slate-400">Hasil akan tampil setelah perhitungan berhasil.</p>
    </motion.section>
  );
}

export default function ModelOverview({ type = "before", onNavigate }) {
  const stage = STAGES.some((x) => x.id === type) ? type : "before";

  // Opening hanya saat komponen Modeling dipasang dari luar, bukan tiap ganti tab.
  const [intro, setIntro] = useState(true);
  const closeIntro = useCallback(() => setIntro(false), []);
  const [runInfo, setRunInfo] = useState(readCompletedRun);
  const ready = Boolean(runInfo?.completed);
  const [applied, setApplied] = useState(() => readCompletedRun()?.policy || normalizePolicy(POLICY_SCENARIOS.integrated));
  const [draft, setDraft] = useState(() => readCompletedRun()?.policy || initialPolicy());
  const [runPhase, setRunPhase] = useState(null);
  const runningRef = useRef(false);

  const deferredDraft = useDeferredValue(draft);
  const [selectedZone, setSelectedZone] = useState("Z11");
  const [view, setView] = useState({ lat: -8.667, lng: 115.218, zoom: 12 });
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(false);

  // Notifikasi memakai Sonner, tidak ada lagi banner/alert custom.
  useEffect(() => {
    if (intro) return;
    if ((stage === "after" || stage === "comparison") && !ready) {
      toast.warning("Kebijakan belum diterapkan", {
        id: "dm-no-scenario", duration: 4500,
        description: "Atur kebijakan di halaman Proses terlebih dahulu.",
        action: { label: "Atur kebijakan", onClick: () => onNavigate?.("process") },
        actionButtonStyle: { backgroundColor: "#B91C1C", color: "#FFFFFF" },
      });
    } else {
      toast.dismiss("dm-no-scenario");
    }
  }, [stage, intro, ready]);

  const updateView = useCallback((next) => setView((prev) => (
    Math.abs(prev.lat - next.lat) < 0.000008 && Math.abs(prev.lng - next.lng) < 0.000008 && Math.abs(prev.zoom - next.zoom) < 0.05 ? prev : next
  )), []);
  const updateDraft = (key, value) => setDraft((prev) => normalizePolicy({ ...prev, [key]: value }));

  // Baseline dapat dihitung sebelum ada run, tetapi UI After tetap dikunci.
  const model = useMemo(() => createPolicyModel(applied), [applied]);
  const previewModel = useMemo(() => createPolicyModel(deferredDraft), [deferredDraft]);
  const assignment = useMemo(() => graph ? assignTraffic(graph, model) : null, [graph, model]);
  const previewAssignment = useMemo(() => graph ? assignTraffic(graph, previewModel) : null, [graph, previewModel]);

  useEffect(() => {
    let canceled = false;
    getDenpasarNetwork().then((data) => {
      if (canceled) return;
      setGraph(data); setError(""); setLoading(false);
    }).catch((err) => {
      if (canceled) return;
      setError(err?.message || "Jaringan jalan tidak bisa dimuat"); setLoading(false);
    });
    return () => { canceled = true; };
  }, []);

  async function apply() {
    if (runningRef.current) return;
    runningRef.current = true;
    toast.dismiss("dm-no-scenario");
    setRunPhase(0);
    const next = normalizePolicy(draft);
    try {
      await waitPaint();
      await wait(490);

      setRunPhase(1);
      await waitPaint();
      const computed = createPolicyModel(next);
      await wait(520);

      setRunPhase(2);
      await waitPaint();
      // Menghitung assignment nyata pada jaringan yang tersedia;
      // tidak menggagalkan perhitungan matriks OD saat jaringan offline.
      let assigned = false;
      if (graph) {
        const traffic = assignTraffic(graph, computed);
        assigned = Boolean(traffic && traffic.coverage > 0);
      }
      await wait(550);

      setRunPhase(3);
      await waitPaint();
      const sum = (matrix) => matrix.reduce((a, row) => a + row.reduce((b, x) => b + x, 0), 0);
      const deltaBefore = Math.abs(sum(computed.matrixBefore) - computed.beforeTotal);
      const deltaAfter = Math.abs(sum(computed.matrixAfter) - computed.afterTotal);
      if (!Number.isFinite(computed.beforeTotal) || !Number.isFinite(computed.afterTotal)
          || computed.beforeTotal <= 0 || computed.afterTotal < 0 || deltaBefore > 0.01 || deltaAfter > 0.01) {
        throw new Error("Validasi hasil model tidak berhasil. Periksa data MAT dan parameter.");
      }
      await wait(520);

      const completed = { completed: true, policy: next, savedAt: new Date().toISOString(), networkAssigned: assigned };
      try {
        window.sessionStorage.setItem(APPLIED_RUN_KEY, JSON.stringify(completed));
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* sessionStorage optional */ }

      setApplied(next);
      setRunInfo(completed);
      setRunPhase(null);
      onNavigate?.("after");
      toast.success("Skenario berhasil diterapkan", {
        id: "dm-applied-success",
        description: "Hasil Sesudah telah tersedia.",
        duration: 6500,
        action: { label: "Lihat perbandingan", onClick: () => onNavigate?.("comparison") },
        actionButtonStyle: { backgroundColor: "#B91C1C", color: "#FFFFFF" },
      });
    } catch (cause) {
      setRunPhase(null);
      toast.error("Skenario gagal diterapkan", {
        description: cause?.message || "Perhitungan gagal. Silakan coba lagi.",
        duration: 6500,
      });
    } finally {
      runningRef.current = false;
    }
  }

  return (
    <>
      <Toaster
        theme="light"
        position="top-right"
        closeButton
        richColors={false}
        visibleToasts={2}
        offset={{ top: "94px", right: "16px" }}
        mobileOffset={{ top: "80px", right: "12px", left: "12px" }}
        toastOptions={{
          className: "!rounded-2xl !border !border-slate-200 !bg-white !text-slate-900 !shadow-[0_18px_45px_rgba(15,23,42,.12)]",
        }}
      />
      <AnimatePresence>
        {intro && <IntroLoading key="dm-intro" onComplete={closeIntro} />}
      </AnimatePresence>
      <AnimatePresence>
        {runPhase !== null && <ProcessingModal key="dm-process" phase={runPhase} graphAvailable={Boolean(graph)} />}
      </AnimatePresence>

      <main className="min-h-screen bg-white text-slate-900">
        <Headline stage={stage} />
        <Tabs stage={stage} onNavigate={onNavigate} />

        <div className="mx-auto max-w-[1460px] px-4 pb-20 pt-9 sm:px-7 sm:pt-12 lg:px-10">
          {(stage === "after" || stage === "comparison") && !ready ? (
            <EmptyResults stage={stage} onNavigate={onNavigate} />
          ) : (
            <>
              {stage === "comparison" && (
                <section>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <SectionHeading title="Hasil perbandingan skenario" description="Dua skenario pada tahun yang sama. Angka ringkasan dan heatmap OD menunjukkan dampak kebijakan yang sudah diterapkan, tanpa dua peta berdampingan." />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => exportJSON(model, assignment, "before")} className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:border-[#B91C1C] hover:text-[#B91C1C]">Ekspor Before</button>
                      <button type="button" onClick={() => exportJSON(model, assignment, "after")} className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:border-[#B91C1C] hover:text-[#B91C1C]">Ekspor After</button>
                    </div>
                  </div>
                  <ComparisonSummary model={model} />
                  <ODHeatmap model={model} />
                  <button type="button" onClick={() => onNavigate?.("process")} className="mt-5 rounded-full border border-[#B91C1C] px-5 py-2.5 text-[12px] font-semibold text-[#B91C1C] hover:bg-[#FFF1F2]">Uji kebijakan lain</button>
                </section>
              )}

              {stage === "process" && (
                <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                  <aside className="min-w-0 border-t border-slate-200 pt-5">
                    <h2 className="text-xl font-bold tracking-tight">Atur kebijakan TDM</h2>
                    <p className="mt-2 text-[12px] leading-6 text-slate-500">Geser parameter untuk melihat pratinjau. Perubahan belum menjadi hasil Sesudah sebelum tombol Terapkan skenario ditekan.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(POLICY_SCENARIOS).map(([id, preset]) => (
                        <button key={id} type="button" onClick={() => setDraft(normalizePolicy(preset))}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${JSON.stringify(draft) === JSON.stringify(normalizePolicy(preset)) ? "border-[#B91C1C] bg-[#FFF1F2] text-[#B91C1C]" : "border-slate-200 text-slate-600 hover:border-[#B91C1C]"}`}>
                          {id === "integrated" ? "Terintegrasi" : id === "pull" ? "TMD + Feeder" : id === "push" ? "Parkir" : "Jam Sibuk"}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Slider label="Pertumbuhan tahunan" min={0} max={5} step={0.25} value={draft.annualGrowth} onChange={(v) => updateDraft("annualGrowth", v)} />
                      <Slider label="Kenaikan tarif parkir" min={0} max={100} step={5} value={draft.parkingIncrease} onChange={(v) => updateDraft("parkingIncrease", v)} />
                      <Slider label="Headway TMD" unit=" menit" min={5} max={30} value={draft.targetHeadway} onChange={(v) => updateDraft("targetHeadway", v)} />
                      <Slider label="Akses feeder" min={0} max={100} step={5} value={draft.feederAccess} onChange={(v) => updateDraft("feederAccess", v)} />
                      <Slider label="Pergeseran jam puncak" min={0} max={30} value={draft.peakShift} onChange={(v) => updateDraft("peakShift", v)} />
                      <label className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 text-xs font-medium text-slate-700">Prioritas bus<input type="checkbox" checked={draft.busPriority} onChange={(e) => updateDraft("busPriority", e.target.checked)} className="h-4 w-4 accent-[#B91C1C]" /></label>
                    </div>
                    <button type="button" onClick={apply} disabled={runPhase !== null} className="mt-5 w-full rounded-xl bg-[#B91C1C] px-5 py-3.5 text-[13px] font-bold text-white hover:bg-[#991B1B] disabled:cursor-wait disabled:opacity-50">Terapkan skenario</button>
                    <p className="mt-3 text-[11px] leading-5 text-slate-500">Pratinjau adalah hasil eksplorasi. Hasil akhir disimpan setelah validasi dasar perhitungan selesai.</p>
                  </aside>
                  <section className="min-w-0">
                    <SectionHeading title="Sebelum dan pratinjau sesudah" description="Dua peta untuk menguji parameter selama Proses, bukan halaman Perbandingan. Peta tetap bisa digeser, di-zoom, dan melihat animasi kendaraan." />
                    <MapPair model={previewModel} assignment={previewAssignment} graph={graph} labelAfter="Pratinjau sesudah" selectedZone={selectedZone} onSelectZone={setSelectedZone} view={view} onViewChange={updateView} />
                    {loading && <p className="mt-3 text-xs text-slate-500">Memuat jaringan koridor OSRM...</p>}
                    {error && <p className="mt-3 text-xs text-amber-700">Jaringan OSRM gagal dimuat: {error}</p>}
                  </section>
                </div>
              )}

              {(stage === "before" || stage === "after") && (
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
                  <section className="min-w-0">
                    <SectionHeading title={stage === "before" ? "Jaringan jalan sebelum TDM" : "Jaringan jalan setelah TDM"} description="Gerak kendaraan dan tekanan arus digambarkan berdasarkan koridor jaringan sampel, bukan lalu lintas aktual." />
                    <ModelMap stage={stage} model={model} assignment={assignment} graph={graph} selectedZone={selectedZone} onSelectZone={setSelectedZone} syncView={view} onViewChange={updateView} />
                    <div className="mt-4"><MapLegend /></div>
                    {loading && <p className="mt-3 text-xs text-slate-500">Memuat jaringan koridor OSRM...</p>}
                    {error && <p className="mt-3 text-xs text-amber-700">Jaringan OSRM gagal dimuat: {error}</p>}
                  </section>
                  <aside className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                    <h2 className="text-2xl font-bold tracking-tight">{stage === "before" ? "Kondisi awal" : "Setelah kebijakan"}</h2>
                    <p className="mt-3 text-[13px] leading-7 text-slate-500">{stage === "before" ? "Proyeksi MAT 2041 tanpa tambahan intervensi TDM. Menjadi dasar pembanding seluruh paket kebijakan." : "Model dengan parameter TDM terakhir yang sudah diterapkan. Angka dan peta Sesudah baru tampil setelah skenario berhasil diproses."}</p>
                    <div className="mt-6 border-y border-slate-200 py-5">
                      <p className="text-xs text-slate-500">Permintaan ekuivalen jam puncak</p>
                      <p className="mt-2 break-words text-[clamp(1.8rem,3vw,2.8rem)] font-bold leading-none tracking-tight tabular-nums">{format(stage === "before" ? model.beforeTotal : model.afterTotal)}</p>
                      <p className="mt-2 text-xs text-slate-500">smp/jam · proyeksi 2041</p>
                      {stage === "after" && <p className="mt-4 text-[15px] font-bold tabular-nums text-[#0F766E]">{pctLabel(model.beforeTotal, model.afterTotal)} dari Before</p>}
                    </div>
                    <button type="button" onClick={() => onNavigate?.(stage === "before" ? "process" : "comparison")}
                      className="mt-6 rounded-full bg-[#B91C1C] px-6 py-3 text-[12px] font-bold text-white hover:bg-[#991B1B]">{stage === "before" ? "Atur kebijakan TDM" : "Lihat perbandingan"}</button>
                    <div className="mt-8 border-t border-slate-200 pt-5">
                      <label className="mb-2 block text-xs font-semibold text-slate-600">Pilih zona asal</label>
                      <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#B91C1C] focus:outline-none">
                        {MODEL_ZONES.map((z) => <option key={z.id} value={z.id}>{z.id} · {z.name}</option>)}
                      </select>
                      <div className="mt-3 divide-y divide-slate-100">
                        {model.pairs.filter((p) => p.origin.id === selectedZone).slice(0, 4).map((p) => (
                          <div key={`${p.from}-${p.to}`} className="flex justify-between gap-3 py-2.5 text-xs"><span className="font-medium text-slate-600">{p.origin.id} → {p.destination.id}</span><span className="font-semibold tabular-nums">{format(stage === "before" ? p.before : p.after)} smp/jam</span></div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              <Explanation stage={stage} />
              <div className="mt-8 border-t border-slate-200 pt-6">
                <button type="button" onClick={() => setDetails((x) => !x)} className="text-xs font-semibold text-slate-600 hover:text-[#B91C1C]">{details ? "Tutup metode dan batasan" : "Metode dan batasan perhitungan"}</button>
                {details && <div className="mt-5 max-w-4xl space-y-3 text-[12px] leading-7 text-slate-500">
                  <p>MAT 2026 diproyeksikan sampai 2041 memakai pertumbuhan majemuk. Kebijakan TDM memengaruhi permintaan menurut koefisien sensitivitas asumsi, bukan hasil kalibrasi survei.</p>
                  <p>Pembebanan jaringan menggunakan rute terpendek all-or-nothing pada koridor OSRM sampel. Ketika data ruas belum cukup, tampilan kendaraan memakai proksi tekanan arus dari penyedia jaringan.</p>
                  <p>Tanpa data kapasitas ruas, warna dan kecepatan kendaraan adalah ilustrasi relatif, bukan kemacetan faktual, V/C, atau kecepatan aktual. {assignment ? `Cakupan OD yang dibebankan pada jaringan sampel: ${format(assignment.coverage * 100, 1)}%.` : "Pembebanan koridor belum tersedia."}</p>
                </div>}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
