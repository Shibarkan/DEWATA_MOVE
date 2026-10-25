
/**
 * DewataMove 2041 | Policy Engine
 * Mengubah MAT projected 2041 pada jam puncak dengan kebijakan TDM.
 * Respons = asumsi sensitivitas untuk eksperimen, BUKAN hasil survei.
 * smp/jam bukan perjalanan orang ataupun penumpang TMD.
 *
 * Engine ini memakai proyeksi dari modelEngine.js dan TIDAK memakai
 * runModel() lama agar pengurangan kebijakan tidak terhitung dua kali.
 */
import {
  DEFAULT_POLICY, MODEL_ZONES, projectMAT2041,
} from "./modelEngine";
import { matTotal } from "./mobility";

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, Number(value) || 0));

const BASE_HEADWAY = 15; // referensi eksploratif, bukan waktu tunggu survei
const HUB_DESTINATIONS = new Set([1, 2, 8]); // Z02, Z03, Z09
const FOCUS_ORIGINS = new Set([8, 10]); // Z09 dan Z11

export const POLICY_SCENARIOS = {
  integrated: { label: "Terintegrasi", ...DEFAULT_POLICY },
  pull: {
    label: "Pull · TMD + Feeder", ...DEFAULT_POLICY,
    parkingIncrease: 0, peakShift: 0,
  },
  push: {
    label: "Push · Parkir", ...DEFAULT_POLICY,
    parkingIncrease: 35, targetHeadway: BASE_HEADWAY,
    feederAccess: 0, peakShift: 0, busPriority: false,
  },
  avoid: {
    label: "Avoid · Jam Puncak", ...DEFAULT_POLICY,
    parkingIncrease: 0, targetHeadway: BASE_HEADWAY,
    feederAccess: 0, peakShift: 12, busPriority: false,
  },
};

export function normalizePolicy(input = {}) {
  const p = { ...DEFAULT_POLICY, ...input };
  return {
    annualGrowth: clamp(p.annualGrowth, 0, 5),
    parkingIncrease: clamp(p.parkingIncrease, 0, 100),
    targetHeadway: clamp(p.targetHeadway, 5, 30),
    feederAccess: clamp(p.feederAccess, 0, 100),
    peakShift: clamp(p.peakShift, 0, 30),
    busPriority: Boolean(p.busPriority),
  };
}

/** Kebijakan aktif untuk label visual. */
export function activePolicies(p) {
  const policy = normalizePolicy(p);
  return [
    { id: "parking", title: "Smart parking", active: policy.parkingIncrease > 0 },
    { id: "transit", title: "TMD & feeder", active: policy.targetHeadway < BASE_HEADWAY || policy.feederAccess > 0 },
    { id: "peak", title: "Jam puncak", active: policy.peakShift > 0 },
    { id: "priority", title: "Prioritas bus", active: policy.busPriority },
  ];
}

/**
 * Menghitung pengaruh TDM berurutan untuk satu sel OD.
 * Tidak boleh menafsirkan 'modalEquivalent' sebagai jumlah orang pindah moda.
 * Parkir hanya lebih kuat pada zona tujuan prioritas, sementara perbaikan
 * angkutan umum diasumsikan lebih efektif pada OD koridor prioritas.
 */
export function evaluateODResponse(value, i, j, policyInput) {
  const p = normalizePolicy(policyInput);
  const destinationWeight = HUB_DESTINATIONS.has(j) ? 1 : 0.45;
  const transitWeight =
    (FOCUS_ORIGINS.has(i) && HUB_DESTINATIONS.has(j)) ? 1 : 0.55;

  // Elastisitas sederhana (skenario), tidak menggunakan model logit terkalibrasi.
  const parkingRate = clamp(p.parkingIncrease * 0.0005 * destinationWeight, 0, 0.08);
  const transitRate = clamp((
    Math.max(0, BASE_HEADWAY - p.targetHeadway) * 0.0035 +
    p.feederAccess * 0.00065 +
    (p.busPriority ? 0.008 : 0)
  ) * transitWeight, 0, 0.14);
  const peakRate = p.peakShift / 100;

  const afterParking = value * (1 - parkingRate);
  const afterTransit = afterParking * (1 - transitRate);
  const afterPeak = afterTransit * (1 - peakRate);

  return {
    after: afterPeak,
    effects: {
      parking: value - afterParking,
      transit: afterParking - afterTransit,
      peak: afterTransit - afterPeak,
    },
  };
}

const matrixSum = (matrix) => matrix.reduce(
  (sum, row) => sum + row.reduce((a, b) => a + b, 0), 0
);

/**
 * Satu hasil untuk Before, Process, dan After.
 * Saat pengaturan growth berubah, Before dan After mendapat baseline sama.
 */
export function createPolicyModel(input = DEFAULT_POLICY) {
  const policy = normalizePolicy(input);
  const matrixBefore = projectMAT2041(policy.annualGrowth);
  const effects = { parking: 0, transit: 0, peak: 0 };
  const matrixAfter = matrixBefore.map((row, i) => row.map((volume, j) => {
    // Pergerakan dalam zona tidak dibebankan ke ruas antarzona, namun tetap
    // ikut di total MAT; model sensitivitas menerapkan kebijakan pada semua sel.
    const result = evaluateODResponse(volume, i, j, policy);
    for (const key of Object.keys(effects)) effects[key] += result.effects[key];
    return result.after;
  }));

  const beforeTotal = matrixSum(matrixBefore);
  const afterTotal = matrixSum(matrixAfter);
  const pairs = [];
  matrixBefore.forEach((row, i) => row.forEach((volume, j) => {
    if (i === j || volume <= 0) return;
    pairs.push({
      from: i, to: j,
      origin: MODEL_ZONES[i], destination: MODEL_ZONES[j],
      before: volume, after: matrixAfter[i][j],
    });
  }));
  pairs.sort((a, b) => b.before - a.before);

  return {
    year: 2041,
    policy,
    zones: MODEL_ZONES,
    matrixBefore,
    matrixAfter,
    base2026: matTotal,
    beforeTotal,
    afterTotal,
    reduction: beforeTotal ? (beforeTotal - afterTotal) / beforeTotal : 0,
    effects,
    pairs,
    method: "Pertumbuhan majemuk 2026–2041 dan respons TDM sensitivitas asumsi",
    caveat: "Belum dikalibrasi. Hasil adalah perubahan permintaan ekuivalen smp/jam pada periode jam puncak, bukan bukti ridership TMD, volume ruas terukur, atau emisi.",
  };
}
