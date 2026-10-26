

import { mat2026, matTotal } from "./mobility";
import { MODEL_ZONES } from "./modelEngine";

const VERSION = 4;

const CACHE_NAME = "dewata-modeling-roads-v4";
const CACHE_URL = "/__dewata-modeling-roads-v4.json";
const CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

const ZONES = MODEL_ZONES;

const BY_ID = new Map(
  ZONES.map((zone) => [zone.id, zone])
);

// Koridor sampel daratan.
// Z12 dan Z13 tetap ada pada model MAT dan marker peta,
// tetapi tidak dijadikan waypoint OSRM untuk sementara.
// Tujuannya mencegah routing ke ferry dari sekitar pelabuhan.
const CORRIDORS = [
  ["Z09", "Z03", "Z10", "Z11", "Z04", "Z02"],
  ["Z03", "Z02", "Z07", "Z06", "Z05", "Z01"],
  ["Z08", "Z02", "Z07", "Z06", "Z05"],
  ["Z10", "Z11", "Z05", "Z01", "Z02", "Z03"],
  ["Z09", "Z02", "Z01", "Z05", "Z06", "Z07", "Z08"],
];

const PROVIDERS = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function distanceMeters(a, b) {
  const lat = ((a[0] + b[0]) / 2) * Math.PI / 180;

  return Math.hypot(
    (b[0] - a[0]) * 111320,
    (b[1] - a[1]) * 111320 * Math.cos(lat)
  );
}

/**
 * Batas konservatif area visual Modeling.
 * BUKAN peta coastline resmi.
 *
 * Prioritas:
 * jangan mengizinkan kendaraan muncul di
 * offshore timur Sanur seperti screenshot.
 *
 * Ruas jalan tol/bridge yang melintasi air dapat
 * memerlukan data geometri dan whitelist tersendiri.
 */
function permittedLocation(point) {
  const [lat, lng] = point || [];

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  if (
    lat < -8.82 ||
    lat > -8.53 ||
    lng < 115.07 ||
    lng > 115.45
  ) {
    return false;
  }

  // Perairan timur Denpasar dan Sanur.
  if (lat >= -8.63 && lng > 115.278) return false;
  if (lat < -8.63 && lat >= -8.72 && lng > 115.274) return false;
  if (lat < -8.72 && lng > 115.265) return false;

  return true;
}

function permittedSegment(a, b) {
  if (!permittedLocation(a) || !permittedLocation(b)) {
    return false;
  }

  const distance = distanceMeters(a, b);

  // Menghindari gap lurus yang bukan ruas geometri.
  return distance >= 1 && distance <= 220;
}

function isDrivingStep(step) {
  const mode = String(step?.mode || "").toLowerCase();
  const name = String(step?.name || "").toLowerCase();

  const excluded = [
    "ferry",
    "boat",
    "penyeberangan",
    "kapal",
    "pelabuhan penyeberangan",
  ];

  if (mode !== "driving") return false;
  if (excluded.some((term) => mode.includes(term))) return false;
  if (excluded.some((term) => name.includes(term))) return false;

  return true;
}

function extractDrivingSegments(route) {
  const result = [];

  for (const leg of route?.legs || []) {
    for (const step of leg?.steps || []) {
      if (!isDrivingStep(step)) continue;

      const coordinates = step?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        continue;
      }

      // OSRM GeoJSON: [longitude, latitude]
      // Leaflet: [latitude, longitude]
      const points = coordinates
        .filter(
          (point) =>
            Array.isArray(point) &&
            Number.isFinite(point[0]) &&
            Number.isFinite(point[1])
        )
        .map(([lng, lat]) => [lat, lng]);

      if (points.length >= 2) {
        result.push(points);
      }
    }
  }

  return result;
}

function makeRouteURL(provider, ids) {
  const points = ids
    .map((id) => {
      const zone = BY_ID.get(id);

      if (!zone) {
        throw new Error(`Zona tidak ditemukan: ${id}`);
      }

      return `${zone.lng},${zone.lat}`;
    })
    .join(";");

  return (
    provider +
    points +
    "?overview=full&geometries=geojson&steps=true"
  );
}

async function fetchCorridor(ids) {
  let lastError;

  for (const provider of PROVIDERS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        makeRouteURL(provider, ids),
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`OSRM HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error(data.message || "Rute tidak tersedia");
      }

      const segments = extractDrivingSegments(data.routes[0]);

      if (!segments.length) {
        throw new Error("Tidak ada driving geometry");
      }

      return segments;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Semua server OSRM gagal");
}

function roadPressure(a, b) {
  // Hanya bobot visual untuk jaringan sampel.
  // Nilai assignment hasil MAT dihitung secara terpisah.
  const lat = (a[0] + b[0]) / 2;
  const lng = (a[1] + b[1]) / 2;

  const coreDistance = Math.hypot(
    (lat + 8.66) * 111,
    (lng - 115.216) * 110
  );

  const hotspotDistance = Math.hypot(
    (lat + 8.63) * 111,
    (lng - 115.235) * 110
  );

  const pressure =
    55 +
    190 * Math.exp(-coreDistance / 4) +
    120 * Math.exp(-hotspotDistance / 3);

  return Math.round(pressure);
}

function createGraph(segments, corridorCount) {
  const nodes = [];
  const edges = [];

  const nodeIndex = new Map();
  const edgeIndex = new Set();

  function addNode(point) {
    const key = `${point[0].toFixed(5)},${point[1].toFixed(5)}`;

    if (!nodeIndex.has(key)) {
      nodeIndex.set(key, nodes.length);
      nodes.push(point);
    }

    return nodeIndex.get(key);
  }

  for (const points of segments) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];

      if (!permittedSegment(a, b)) continue;

      const from = addNode(a);
      const to = addNode(b);

      if (from === to) continue;

      const key = `${from}:${to}`;
      if (edgeIndex.has(key)) continue;

      edgeIndex.add(key);

      const length = distanceMeters(a, b);
      const pressure = roadPressure(a, b);

      edges.push([
        from,
        to,
        length,
        4,
        pressure,
        pressure,
      ]);
    }
  }

  if (edges.length < 50) {
    throw new Error(
      "Jaringan jalan tidak cukup setelah penyaringan. " +
      "Coba lagi ketika layanan OSRM tersedia."
    );
  }

  return {
    format: VERSION,
    nodes,
    edges,
    zones: ZONES,
    mat: mat2026,
    metadata: {
      source: "OSRM / OpenStreetMap",
      ferryFiltered: true,
      coastalSafetyFilter: true,
      drivingOnly: true,
      sampledCorridors: corridorCount,
      matTotal,
      trafficCalibration: "Belum dikalibrasi",
      updatedAt: new Date().toISOString(),
    },
  };
}

async function readCache() {
  if (typeof caches === "undefined") return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(CACHE_URL);

    if (!response) return null;

    const graph = await response.json();

    const age =
      Date.now() -
      Date.parse(graph?.metadata?.updatedAt || "");

    if (
      graph?.format !== VERSION ||
      graph?.metadata?.coastalSafetyFilter !== true ||
      !Array.isArray(graph.edges) ||
      graph.edges.length < 50 ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > CACHE_AGE
    ) {
      return null;
    }

    return graph;
  } catch {
    return null;
  }
}

async function writeCache(graph) {
  if (typeof caches === "undefined") return;

  try {
    const cache = await caches.open(CACHE_NAME);

    await cache.put(
      CACHE_URL,
      new Response(JSON.stringify(graph), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (error) {
    console.warn("[Modeling] Cache tidak tersimpan:", error);
  }
}

async function buildNetwork() {
  const cached = await readCache();
  if (cached) return cached;

  const allSegments = [];
  let successCount = 0;

  for (let i = 0; i < CORRIDORS.length; i++) {
    if (i > 0) await sleep(650);

    try {
      const segments = await fetchCorridor(CORRIDORS[i]);
      allSegments.push(...segments);
      successCount++;
    } catch (error) {
      console.warn(
        `[Modeling] Koridor ${i + 1} gagal:`,
        error?.message
      );
    }
  }

  if (!successCount) {
    throw new Error(
      "Jaringan OSRM tidak dapat dimuat. " +
      "Periksa koneksi dan coba refresh."
    );
  }

  const graph = createGraph(allSegments, successCount);
  await writeCache(graph);
  return graph;
}

let networkPromise = null;

export function getDenpasarNetwork() {
  if (!networkPromise) {
    networkPromise = buildNetwork().catch((error) => {
      networkPromise = null;
      throw error;
    });
  }

  return networkPromise;
}
