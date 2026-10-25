import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import ModelMap from "../components/modeling/ModelMap";
import { getDenpasarNetwork } from "../data/denpasarNetworkBrowser";
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
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const ratio = Math.min(1, (now - start) / 1400);
      setProgress(Math.round(ratio * 100));
      if (ratio < 1) raf = requestAnimationFrame(tick);
      else onComplete();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);
  return (
    <div className="fixed inset-0 z-[7000] grid place-items-center bg-[#FCFBF9] px-5" role="status" aria-label="Memuat halaman modeling">
      <div className="w-full max-w-[720px] text-center">
        <h2 className="select-none text-[clamp(3.1rem,11vw,8rem)] font-black leading-none tracking-[-0.07em] text-[#B91C1C] motion-safe:animate-pulse">
          MODELING
        </h2>
        <div className="mx-auto mt-9 h-[3px] w-full max-w-[290px] overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#B91C1C]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-[11px] font-semibold tracking-[0.2em] tabular-nums text-slate-400">{progress}%</p>
        <button type="button" onClick={onComplete} className="mt-6 text-xs font-medium text-slate-400 underline-offset-4 hover:text-[#B91C1C] hover:underline">Lewati</button>
      </div>
    </div>
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

function ProcessingScreen({ phase, graphAvailable }) {
  const dialogRef = useRef(null);
  const phases = ANALYSIS_STEPS.map((step, index) =>
    index === 2 && !graphAvailable
      ? { ...step, detail: "Menyiapkan hasil MAT; jaringan koridor belum tersedia." }
      : step
  );
  const currentIndex = Math.max(0, Math.min(phase, phases.length - 1));
  const current = phases[currentIndex];

  useEffect(() => {
    // Modal proses tidak bisa ditutup sebelum kalkulasi selesai.
    // Kunci scroll, dan tempatkan fokus keyboard pada dialog.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, []);

  return (
    <div className="fixed inset-0 z-[8200] flex items-center justify-center bg-slate-400/20 px-4 py-6 backdrop-blur-[2px]">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-process-title"
        aria-describedby="dm-process-description"
        className="max-h-[calc(100dvh-48px)] w-full max-w-[450px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_25px_75px_rgba(15,23,42,0.18)] outline-none sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B91C1C]">DEWATAMOVE 2041</span>
          <span className="text-[11px] font-semibold tabular-nums text-slate-400">{currentIndex + 1} / {phases.length}</span>
        </div>
        <h2 id="dm-process-title" className="mt-3 text-[23px] font-bold tracking-tight text-slate-900 sm:text-[27px]">Memproses skenario</h2>
        <p id="dm-process-description" className="mt-2 text-[12px] leading-6 text-slate-500">Perhitungan berlangsung. Hasil akan ditampilkan otomatis setelah selesai.</p>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#B91C1C] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((currentIndex + 1) / phases.length) * 100}%` }} />
        </div>

        <div className="mt-6 space-y-1" aria-live="polite" aria-atomic="true">
          {phases.map((step, index) => {
            const finished = index < currentIndex;
            const active = index === currentIndex;
            return (
              <div key={step.title} className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-[12px] transition-colors ${active ? "bg-[#FFF4F4] text-[#991B1B]" : finished ? "text-slate-600" : "text-slate-400"}`}>
                <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${finished ? "border-[#0F766E] bg-[#0F766E] text-white" : active ? "border-[#B91C1C] text-[#B91C1C]" : "border-slate-200"}`}>
                  {finished ? "✓" : active ? <span className="h-2 w-2 rounded-full bg-[#B91C1C] motion-safe:animate-pulse" /> : null}
                </span>
                <span className={active ? "font-semibold" : "font-medium"}>{step.title}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-slate-500">{current.detail}</p>
      </div>
    </div>
  );
}

function ToastNotice({ notice, onDismiss, onNavigate }) {
  if (!notice) return null;
  const isSuccess = notice.type === "success";
  const isWarning = notice.type === "warning";
  const accent = isSuccess ? "border-l-[#0F766E]" : isWarning ? "border-l-[#D97706]" : "border-l-[#B91C1C]";
  const textColor = isSuccess ? "text-[#0F766E]" : isWarning ? "text-[#92400E]" : "text-[#B91C1C]";
  return (
    <div className="pointer-events-none fixed inset-x-3 top-20 z-[9000] flex justify-end sm:inset-x-auto sm:right-5 sm:top-24" aria-live="polite">
      <div role={isSuccess ? "status" : "alert"} className={`pointer-events-auto w-full max-w-[390px] rounded-xl border border-l-[4px] border-slate-200 bg-white px-4 py-3.5 shadow-[0_12px_36px_rgba(15,23,42,0.13)] ${accent}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[13px] font-bold leading-5 ${textColor}`}>{notice.title}</p>
            {notice.message && <p className="mt-1 text-[12px] leading-5 text-slate-600">{notice.message}</p>}
          </div>
          <button type="button" aria-label="Tutup notifikasi" onClick={onDismiss} className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
        </div>
        {notice.actionPage && (
          <button type="button" onClick={() => { onDismiss(); onNavigate?.(notice.actionPage); }} className={`mt-2.5 text-[12px] font-semibold underline-offset-4 hover:underline ${textColor}`}>
            {notice.actionLabel || "Lanjut"} →
          </button>
        )}
      </div>
    </div>
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
  const [notice, setNotice] = useState(null);
  const runningRef = useRef(false);

  const deferredDraft = useDeferredValue(draft);
  const [selectedZone, setSelectedZone] = useState("Z11");
  const [view, setView] = useState({ lat: -8.667, lng: 115.218, zoom: 12 });
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(false);

  const notify = useCallback((payload) => setNotice({ ...payload }), []);

  // Toast hilang otomatis. Pergantian notifikasi me-reset waktunya.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice((current) => current === notice ? null : current), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Saat halaman Sesudah/Perbandingan dibuka sebelum ada run,
  // tampilkan alert kecil, bukan panel kosong permanen.
  useEffect(() => {
    if (intro) return;
    if ((stage === "after" || stage === "comparison") && !ready) {
      notify({
        type: "warning",
        title: "Skenario belum diterapkan",
        message: "Jalankan skenario pada halaman Proses untuk melihat hasil.",
        actionPage: "process",
        actionLabel: "Atur kebijakan",
      });
    } else if (stage === "before" || stage === "process") {
      setNotice((current) => current?.type === "warning" ? null : current);
    }
  }, [stage, intro, ready, notify]);

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
    setNotice(null);
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
      notify({
        type: "success",
        title: "Skenario berhasil diterapkan",
        message: "Hasil Sesudah sudah tersedia.",
        actionPage: "comparison",
        actionLabel: "Lihat perbandingan",
      });
      onNavigate?.("after");
    } catch (cause) {
      setRunPhase(null);
      notify({
        type: "error",
        title: "Skenario gagal diterapkan",
        message: cause?.message || "Perhitungan gagal. Silakan coba lagi.",
      });
    } finally {
      runningRef.current = false;
    }
  }

  return (
    <>
      {intro && <IntroLoading onComplete={closeIntro} />}
      {runPhase !== null && <ProcessingScreen phase={runPhase} graphAvailable={Boolean(graph)} />}
      {runPhase === null && <ToastNotice notice={notice} onDismiss={() => setNotice(null)} onNavigate={onNavigate} />}

      <main className="min-h-screen bg-white text-slate-900">
        <Headline stage={stage} />
        <Tabs stage={stage} onNavigate={onNavigate} />

        <div className="mx-auto max-w-[1460px] px-4 pb-20 pt-9 sm:px-7 sm:pt-12 lg:px-10">
          {(stage === "after" || stage === "comparison") && !ready ? (
            <div className="min-h-[320px]" aria-label="Hasil simulasi belum tersedia" />
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
