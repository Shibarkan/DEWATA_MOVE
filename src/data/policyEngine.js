
/**
 * DewataMove 2041 | src/data/policyEngine.js
 * Parameter dan koefisien kebijakan adalah asumsi eksperimen,
 * BUKAN hasil kalibrasi terhadap data Denpasar.
 * MAT dalam smp/jam; tidak sama dengan jumlah orang/ridership.
 */
import { classifyPolicyConstraints } from "./constraintEngine.js";
import { DEFAULT_POLICY, MODEL_ZONES, projectMAT2041 } from "./modelEngine.js";
import { matTotal } from "./mobility.js";

const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
const BASE_HEADWAY = 15; // asumsi pembanding, bukan headway TMD terukur
const HUBS = new Set([1, 2, 8]); // indeks Z02, Z03, Z09
const ORIGINS = new Set([8, 10]); // indeks Z09, Z11
const EXTRAS = { wfhReduction: 0, parkRideShift: 0, bikeShift: 0 };

// "Sumber" menjelaskan relevansi mekanisme/target, bukan validasi angka Denpasar.
export const POLICY_REFERENCES = {
  annualGrowth: {
    preset: "1,5% per tahun",
    why: "Asumsi proyeksi majemuk untuk 2026–2041; belum diturunkan dari seri waktu MAT Denpasar. Uji sensitivitas pada rentang slider 0–5%.",
    status: "Asumsi internal, belum ada rujukan numerik lokal.",
    sources: [],
  },
  parkingIncrease: {
    preset: "+25% tarif parkir",
    why: "Besaran kebijakan uji, bukan tarif resmi. FHWA menunjukkan bahwa harga parkir dapat memengaruhi pilihan moda, tetapi tidak menetapkan angka 25% untuk Denpasar.",
    status: "Besaran 25% adalah nilai uji, bukan tarif resmi; tidak menghasilkan perubahan MAT pada model aktif.",
    sources: [
      { label: "FHWA — kajian elastisitas parkir", url: "https://ops.fhwa.dot.gov/publications/fhwahop23023/ch2.htm" },
      { label: "UU 22/2009 — manajemen kebutuhan lalu lintas", url: "https://peraturan.bpk.go.id/Details/38654/uu-no-22-tahun-2009" },
    ],
  },
  targetHeadway: {
    preset: "10 menit antarbus",
    why: "Target perbaikan frekuensi layanan dari pembanding model 15 menit. Panduan NACTO mendukung transit yang sering dan andal, tetapi tidak menetapkan kewajiban 10 menit untuk TMD.",
    status: "Target operasional usulan; perlu data waktu putar dan kebutuhan armada.",
    sources: [
      { label: "NACTO — Transit Street Design Guide", url: "https://nacto.org/publication/transit-street-design-guide/" },
    ],
  },
  feederAccess: {
    preset: "30% indeks akses feeder",
    why: "Indeks simulasi untuk menguji peningkatan konektivitas first/last mile. Angka 30% bukan cakupan halte atau peningkatan akses yang telah diukur.",
    status: "Asumsi indeks; perlu pemetaan halte, jarak jalan kaki, dan waktu transfer.",
    sources: [
      { label: "FHWA — integrasi pilihan moda & first/last mile", url: "https://ops.fhwa.dot.gov/publications/fhwahop19079/index.htm" },
    ],
  },
  peakShift: {
    preset: "8% pengurangan MAT jam puncak",
    why: "Angka uji dalam rentang pembanding 5–10% penurunan arus mobil jam puncak pada pendekat pusat kerja dalam evaluasi jam kerja alternatif. Ini bukan hasil survei Denpasar; model mengurangi sel MAT dan tidak memindahkan demand ke periode lain.",
    status: "Sensitivitas lintas konteks pada semua sel MAT, bukan redistribusi temporal atau prediksi lokal.",
    sources: [
      { label: "TRB/NCHRP Synthesis 73 — alternative work schedules", url: "https://www.trb.org/Publications/Blurbs/161269.aspx" },
    ],
  },
  busPriority: {
    preset: "Aktif",
    why: "Prioritas bus dapat diteliti melalui prioritas sinyal, pengaturan simpang, dan ruang jalan. Model aktif belum menghitung dampak numerik intervensi ini.",
    status: "Intervensi usulan; perlu data tundaan bus, ATCS, kondisi simpang, dan koefisien perilaku.",
    sources: [
      { label: "NACTO — Transit Street Design Guide", url: "https://nacto.org/publication/transit-street-design-guide/" },
    ],
  },
  wfhReduction: {
    preset: "0% (belum aktif)",
    why: "Kerja jarak jauh dapat menghindari perjalanan komuter. Nilai awal nol agar tidak ada dampak tanpa data karakteristik pekerjaan dan pangsa perjalanan kerja.",
    status: "Jika dinaikkan, nilainya proksi pengurangan kendaraan; bukan persentase pekerja WFH.",
    sources: [
      { label: "FHWA — demand-side framework & telework", url: "https://ops.fhwa.dot.gov/publications/mitig_traf_cong/demand_framework.htm" },
    ],
  },
  parkRideShift: {
    preset: "0% (belum aktif)",
    why: "Park-and-ride dapat menghubungkan perjalanan kendaraan dengan transit. Nilai nol sebelum lokasi, kapasitas parkir, dan konektivitas halte diuji.",
    status: "Proksi hanya untuk OD prioritas dalam model, bukan jumlah pengguna park-and-ride.",
    sources: [
      { label: "FHWA — ATDM dan integrasi park-and-ride", url: "https://ops.fhwa.dot.gov/publications/fhwahop19079/index.htm" },
    ],
  },
  bikeShift: {
    preset: "0% (belum aktif)",
    why: "Peralihan perjalanan dekat ke sepeda perlu fasilitas aman dan konektivitas. Nilai nol sampai data jaringan sepeda dan preferensi pengguna tersedia.",
    status: "Filter ≤5 km memakai jarak lurus pusat zona, bukan jarak rute sepeda.",
    sources: [
      { label: "NACTO — Urban Bikeway Design Guide", url: "https://nacto.org/publication/urban-bikeway-design-guide/" },
    ],
  },
};

export const POLICY_SCENARIOS = {
  integrated: { label: "Terintegrasi", ...DEFAULT_POLICY, ...EXTRAS },
  pull: { label: "Pull · TMD + Feeder", ...DEFAULT_POLICY, ...EXTRAS, parkingIncrease: 0, peakShift: 0 },
  push: { label: "Push · Parkir", ...DEFAULT_POLICY, ...EXTRAS, parkingIncrease: 35, targetHeadway: 15, feederAccess: 0, peakShift: 0, busPriority: false },
  avoid: { label: "Avoid · Jam Puncak", ...DEFAULT_POLICY, ...EXTRAS, parkingIncrease: 0, targetHeadway: 15, feederAccess: 0, peakShift: 8, busPriority: false },
};

export function normalizePolicy(input = {}) {
  const p = { ...DEFAULT_POLICY, ...EXTRAS, ...input };
  return {
    annualGrowth: clamp(p.annualGrowth, 0, 5),
    parkingIncrease: clamp(p.parkingIncrease, 0, 100),
    targetHeadway: clamp(p.targetHeadway, 5, 30),
    feederAccess: clamp(p.feederAccess, 0, 100),
    peakShift: clamp(p.peakShift, 0, 30),
    busPriority: Boolean(p.busPriority),
    wfhReduction: clamp(p.wfhReduction, 0, 20),
    parkRideShift: clamp(p.parkRideShift, 0, 25),
    bikeShift: clamp(p.bikeShift, 0, 25),
  };
}

export function activePolicies(input) {
  const p = normalizePolicy(input);
  return [
    { id: "parking", title: "Smart parking", active: p.parkingIncrease > 0 },
    { id: "transit", title: "TMD & feeder", active: p.targetHeadway < BASE_HEADWAY || p.feederAccess > 0 },
    { id: "peak", title: "Jam puncak", active: p.peakShift > 0 },
    { id: "priority", title: "Prioritas bus", active: p.busPriority },
    { id: "wfh", title: "WFH", active: p.wfhReduction > 0 },
    { id: "parkRide", title: "Park-and-ride", active: p.parkRideShift > 0 },
    { id: "cycling", title: "Sepeda", active: p.bikeShift > 0 },
  ];
}

export function auditPolicyConstraints(policy = {}) {
  return classifyPolicyConstraints({
    constraints: ["time", "cost", "spatial"],
    requiredInputs: [
      "parkingDuration",
      "vehicleType",
      "parkingZone",
      "parkingTariff",
    ],
    inputData: policy.inputData || policy,
    modelStatus: policy.modelStatus || "assumption-dependent",
    reason: policy.reason,
  });
}

export const policyConstraintAudit = auditPolicyConstraints();

// Jarak garis lurus antarpusat zona (km), bukan jarak jaringan jalan.
function distanceKm(i, j) {
  const a = MODEL_ZONES[i], b = MODEL_ZONES[j];
  if (!a || !b || i === j) return Infinity;
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r;
  const y = (b.lat - a.lat) * r;
  const h = Math.sin(y / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(x / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Mengurangi volume secara berurutan, bukan menjumlah persentase mentah. */
export function evaluateODResponse(value, i, j, input) {
  const p = normalizePolicy(input);
  // Tarif dan perubahan layanan tidak mengubah MAT tanpa model perilaku terkalibrasi.
  const parkingRate = 0;
  const transitRate = 0;
  const peakRate = p.peakShift / 100;
  // Parameter baru adalah proksi eksperimen, tidak mewakili persentase orang.
  const wfhRate = p.wfhReduction / 100;
  const parkRideRate = ORIGINS.has(i) && HUBS.has(j) ? p.parkRideShift / 100 : 0;
  const bikeRate = distanceKm(i, j) <= 5 ? p.bikeShift / 100 : 0;
  const a = value * (1 - parkingRate);
  const b = a * (1 - transitRate);
  const c = b * (1 - peakRate);
  const d = c * (1 - wfhRate);
  const e = d * (1 - parkRideRate);
  const f = e * (1 - bikeRate);
  return {
    after: f,
    effects: { parking: value - a, transit: a - b, peak: b - c, wfh: c - d, parkRide: d - e, cycling: e - f },
  };
}

const matrixSum = (mat) => mat.reduce((a, row) => a + row.reduce((b, v) => b + v, 0), 0);

export function createPolicyModel(input = DEFAULT_POLICY) {
  const policy = normalizePolicy(input);
  const matrixBefore = projectMAT2041(policy.annualGrowth);
  const effects = { parking: 0, transit: 0, peak: 0, wfh: 0, parkRide: 0, cycling: 0 };
  const matrixAfter = matrixBefore.map((row, i) => row.map((v, j) => {
    const result = evaluateODResponse(v, i, j, policy);
    for (const k of Object.keys(effects)) effects[k] += result.effects[k];
    return result.after;
  }));
  const beforeTotal = matrixSum(matrixBefore);
  const afterTotal = matrixSum(matrixAfter);
  const pairs = [];
  matrixBefore.forEach((row, i) => row.forEach((v, j) => {
    if (i === j || v <= 0) return;
    pairs.push({ from: i, to: j, origin: MODEL_ZONES[i], destination: MODEL_ZONES[j], before: v, after: matrixAfter[i][j] });
  }));
  pairs.sort((a, b) => b.before - a.before);
  return {
    year: 2041, policy, zones: MODEL_ZONES, matrixBefore, matrixAfter,
    base2026: matTotal, beforeTotal, afterTotal,
    reduction: beforeTotal ? (beforeTotal - afterTotal) / beforeTotal : 0,
    effects, pairs,
    method: "Proyeksi MAT 2041 dan sensitivitas perubahan jam puncak/perjalanan yang diinput langsung",
    caveat: "Perubahan tarif parkir, headway, feeder, dan prioritas bus belum mengubah MAT karena belum ada model pilihan moda terkalibrasi. Persentase jam puncak/WFH/park-and-ride/sepeda adalah sensitivitas eksplisit, bukan prediksi respons. MAT smp/jam bukan jumlah orang.",
  };
}
