
/**
 * DEWATAMOVE 2041 — MODEL ENGINE V1
 * Basis: MAT 2026 (smp/jam) dari file data/mobility.js.
 *
 * Penting:
 *  - Semua koefisien respons adalah ASUMSI SENSITIVITAS, bukan kalibrasi.
 *  - Output adalah permintaan jalan ekuivalen smp/jam pada periode puncak.
 *  - Tidak menghitung ridership (orang) dari smp tanpa data okupansi moda.
 *  - Link assignment bersifat all-or-nothing dan hanya untuk cakupan graf OSRM.
 */
import { mat2026, zoneNames } from "./mobility";

export const ZONE_CENTERS = [
  [-8.6535, 115.2350], [-8.6598, 115.2030], [-8.6250, 115.2100],
  [-8.6400, 115.2260], [-8.6550, 115.2570], [-8.6940, 115.2640],
  [-8.6920, 115.2190], [-8.6690, 115.1820], [-8.6340, 115.1870],
  [-8.6060, 115.2290], [-8.6240, 115.2510], [-8.7420, 115.2440],
  [-8.7420, 115.1810],
];

export const MODEL_ZONES = zoneNames.map((name, i) => ({
  id: `Z${String(i + 1).padStart(2, "0")}`,
  name,
  lat: ZONE_CENTERS[i][0],
  lng: ZONE_CENTERS[i][1],
}));

export const DEFAULT_POLICY = Object.freeze({
  annualGrowth: 1.5,    // asumsi pertumbuhan permintaan per tahun (%)
  parkingIncrease: 25, // perubahan biaya parkir pada zona tujuan prioritas (%)
  targetHeadway: 10,   // waktu antarbus usulan (menit)
  feederAccess: 30,    // perbaikan akses feeder sebagai indeks skenario (%)
  peakShift: 8,        // bagian permintaan yang bergeser keluar jam puncak (%)
  busPriority: true,   // perbaikan daya saing waktu perjalanan angkutan umum
});

export const POLICY_PRESETS = {
  integrated: { ...DEFAULT_POLICY },
  pull: { ...DEFAULT_POLICY, parkingIncrease: 0, peakShift: 0, busPriority: false },
  push: { ...DEFAULT_POLICY, targetHeadway: 15, feederAccess: 0, peakShift: 0, busPriority: false },
  avoid: { ...DEFAULT_POLICY, parkingIncrease: 0, targetHeadway: 15, feederAccess: 0, busPriority: false },
};

const sumMatrix = (matrix) => matrix.reduce(
  (sum, row) => sum + row.reduce((a, b) => a + b, 0), 0
);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function validateInput(matrix = mat2026) {
  if (!Array.isArray(matrix) || matrix.length !== 13 ||
      !matrix.every((r) => Array.isArray(r) && r.length === 13 &&
        r.every((n) => Number.isFinite(n) && n >= 0))) {
    throw new Error("MAT harus berupa matriks 13×13 berisi nilai >= 0.");
  }
  return true;
}

export function projectMAT2041(annualGrowth = DEFAULT_POLICY.annualGrowth) {
  validateInput();
  const g = clamp(Number(annualGrowth) || 0, -5, 10) / 100;
  const factor = Math.pow(1 + g, 2041 - 2026);
  return mat2026.map((row) => row.map((value) => value * factor));
}

function policyReduction(policy, destinationIndex) {
  // Asumsi respons elastisitas sederhana untuk eksperimen tahap awal.
  // BUKAN probabilitas logit dan bukan kalibrasi ke data survei.
  const hubFactor = [1, 2, 8].includes(destinationIndex) ? 1 : 0.6;
  const parkingResponse = clamp(policy.parkingIncrease, 0, 100) * 0.0005 * hubFactor;
  const headwayResponse = Math.max(0, 15 - clamp(policy.targetHeadway, 5, 30)) * 0.0035;
  const feederResponse = clamp(policy.feederAccess, 0, 100) * 0.00065;
  const priorityResponse = policy.busPriority ? 0.008 : 0;
  const roadDemandShift = clamp(
    parkingResponse + headwayResponse + feederResponse + priorityResponse,
    0, 0.35
  );
  const shiftedFromPeak = clamp(policy.peakShift, 0, 30) / 100;
  return 1 - (1 - roadDemandShift) * (1 - shiftedFromPeak);
}

export function runModel(policyInput = DEFAULT_POLICY) {
  const policy = { ...DEFAULT_POLICY, ...policyInput };
  const before = projectMAT2041(policy.annualGrowth);
  const after = before.map((row) => row.map((value, j) =>
    value * (1 - policyReduction(policy, j))
  ));
  const base2026 = sumMatrix(mat2026);
  const beforeTotal = sumMatrix(before);
  const afterTotal = sumMatrix(after);
  const pairs = [];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      if (i === j || before[i][j] <= 0) continue;
      pairs.push({
        origin: MODEL_ZONES[i], destination: MODEL_ZONES[j],
        from: i, to: j, before: before[i][j], after: after[i][j],
      });
    }
  }
  pairs.sort((a, b) => b.before - a.before);
  return {
    year: 2041,
    policy,
    matrixBefore: before,
    matrixAfter: after,
    base2026,
    beforeTotal,
    afterTotal,
    reduction: beforeTotal > 0 ? (beforeTotal - afterTotal) / beforeTotal : 0,
    pairs,
    zones: MODEL_ZONES,
    method: "Proyeksi pertumbuhan majemuk + sensitivitas permintaan jam puncak (asumsi)",
    limitations: "MAT dalam smp/jam; tidak ekuivalen dengan jumlah orang. Respons kebijakan belum terkalibrasi.",
  };
}

function haversine(a, b) {
  const rad = Math.PI / 180;
  const dlat = (b[0] - a[0]) * rad;
  const dlng = (b[1] - a[1]) * rad;
  const lat1 = a[0] * rad, lat2 = b[0] * rad;
  const v = Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(v)));
}

// Min heap agar pencarian jalur tidak melambat ketika graf berisi ribuan ruas.
function makeHeap() {
  const heap = [];
  return {
    push(item) {
      heap.push(item);
      let i = heap.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (heap[p][0] <= item[0]) break;
        heap[i] = heap[p]; i = p;
      }
      heap[i] = item;
    },
    pop() {
      if (!heap.length) return null;
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        let i = 0;
        while (2 * i + 1 < heap.length) {
          let child = 2 * i + 1;
          if (child + 1 < heap.length && heap[child + 1][0] < heap[child][0]) child++;
          if (last[0] <= heap[child][0]) break;
          heap[i] = heap[child]; i = child;
        }
        heap[i] = last;
      }
      return top;
    },
    get size() { return heap.length; },
  };
}

/**
 * AON assignment on *available sampled OSRM graph*, not a calibrated network model.
 * Unreachable OD flows are explicitly counted as unassigned instead of fabricated.
 * A graph edge has [fromNode, toNode, lengthMeters, class, beforeFlow, afterFlow].
 */
export function assignToRoads(graph, result) {
  if (!graph?.nodes?.length || !graph?.edges?.length) return null;
  const nodes = graph.nodes;
  const edges = graph.edges;
  const adjacency = Array.from({ length: nodes.length }, () => []);
  for (let e = 0; e < edges.length; e++) {
    const [a, b, length] = edges[e];
    if (Number.isInteger(a) && Number.isInteger(b) && nodes[a] && nodes[b]) {
      adjacency[a].push([b, e, Math.max(0.1, Number(length) || haversine(nodes[a], nodes[b]))]);
    }
  }
  const zoneNode = MODEL_ZONES.map((z) => {
    const target = [z.lat, z.lng];
    let closest = 0, best = Infinity;
    nodes.forEach((n, i) => {
      const d = haversine(target, n);
      if (d < best) { best = d; closest = i; }
    });
    return { id: closest, distance: best };
  });
  const linkBefore = new Float64Array(edges.length);
  const linkAfter = new Float64Array(edges.length);
  let assigned = 0, unassigned = 0;
  for (let origin = 0; origin < 13; origin++) {
    const dist = new Float64Array(nodes.length).fill(Infinity);
    const prevNode = new Int32Array(nodes.length).fill(-1);
    const prevEdge = new Int32Array(nodes.length).fill(-1);
    const heap = makeHeap();
    dist[zoneNode[origin].id] = 0;
    heap.push([0, zoneNode[origin].id]);
    while (heap.size) {
      const [cost, node] = heap.pop();
      if (cost > dist[node]) continue;
      for (const [next, edge, length] of adjacency[node]) {
        const candidate = cost + length;
        if (candidate < dist[next]) {
          dist[next] = candidate;
          prevNode[next] = node;
          prevEdge[next] = edge;
          heap.push([candidate, next]);
        }
      }
    }
    for (let dest = 0; dest < 13; dest++) {
      if (origin === dest) continue;
      const valueBefore = result.matrixBefore[origin][dest];
      const valueAfter = result.matrixAfter[origin][dest];
      const target = zoneNode[dest].id;
      // Jika node zonanya sama, permintaan ini tidak menjadi volume ruas antar-node.
      if (target === zoneNode[origin].id || !Number.isFinite(dist[target])) {
        unassigned += valueBefore;
        continue;
      }
      const path = [];
      let current = target;
      while (current !== zoneNode[origin].id && prevEdge[current] !== -1) {
        path.push(prevEdge[current]);
        current = prevNode[current];
      }
      if (current !== zoneNode[origin].id) {
        unassigned += valueBefore;
        continue;
      }
      assigned += valueBefore;
      for (const e of path) {
        linkBefore[e] += valueBefore;
        linkAfter[e] += valueAfter;
      }
    }
  }
  const ranked = edges.map((edge, i) => ({
    i, a: nodes[edge[0]], b: nodes[edge[1]],
    before: linkBefore[i], after: linkAfter[i],
  })).filter((e) => e.before > 0);
  const max = ranked.reduce((largest, r) => Math.max(largest, r.before), 1);
  return {
    roads: ranked,
    maxFlow: max,
    assigned,
    unassigned,
    coverage: assigned + unassigned > 0 ? assigned / (assigned + unassigned) : 0,
    networkSource: graph.metadata?.source || "Sample jaringan jalan",
    caveat: "Pembebanan terpendek all-or-nothing pada koridor OSRM sampel; belum V/C, kapasitas, atau assignment ekuilibrium.",
  };
}

export const formatModelNumber = (v, decimals = 0) =>
  Number(v || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
