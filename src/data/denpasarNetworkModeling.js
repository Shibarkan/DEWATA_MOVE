
/**
 * DEWATAMOVE 2041
 * JARINGAN JALAN KHUSUS MODELING
 *
 * File:
 * src/data/denpasarNetworkModeling.js
 *
 * - Tidak mengubah jaringan HOME.
 * - Menggunakan OSRM dan OpenStreetMap.
 * - Mengambil geometri jalan dengan steps=true.
 * - Menyaring langkah ferry dan non-driving.
 * - Tidak membuat garis lurus antarzona sebagai jalan.
 * - Memiliki cache khusus Modeling.
 *
 * FORMAT:
 *
 * nodes = [
 *   [latitude, longitude],
 *   ...
 * ]
 *
 * edges = [
 *   [
 *     fromNode,
 *     toNode,
 *     lengthMeters,
 *     roadClass,
 *     visualBefore,
 *     visualAfter
 *   ],
 *   ...
 * ]
 *
 * PENTING:
 * Nilai visualBefore hanya bobot ilustrasi.
 * Hasil kebijakan harus berasal dari
 * policyEngine + trafficAssignment.
 */

import {
  mat2026,
  matTotal,
} from "./mobility";

import {
  MODEL_ZONES,
} from "./modelEngine";

// ==========================================
// ZONES
// ==========================================

const ZONES = MODEL_ZONES;

const ZONE_BY_ID = new Map(
  ZONES.map((zone) => [
    zone.id,
    zone,
  ])
);

// ==========================================
// SAMPLE ROAD CORRIDORS
// ==========================================

const ROUTES = [
  [
    "Z09",
    "Z03",
    "Z10",
    "Z11",
    "Z04",
    "Z02",
    "Z09",
  ],
  [
    "Z03",
    "Z02",
    "Z07",
    "Z06",
    "Z05",
    "Z01",
    "Z03",
  ],
  [
    "Z08",
    "Z02",
    "Z07",
    "Z12",
    "Z13",
    "Z08",
  ],
  [
    "Z10",
    "Z11",
    "Z05",
    "Z06",
    "Z07",
    "Z02",
    "Z03",
    "Z10",
  ],
  [
    "Z09",
    "Z02",
    "Z01",
    "Z05",
    "Z06",
    "Z07",
    "Z08",
    "Z09",
  ],
];

// ==========================================
// ROUTING PROVIDERS
// ==========================================

const ROUTERS = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

// ==========================================
// CACHE CONFIGURATION
// ==========================================

const CACHE_NAME = "dewata-modeling-road-v1";

const CACHE_KEY =
  "/__dewata_modeling_road_v1.json";

const CACHE_TTL =
  14 * 24 * 60 * 60 * 1000;

// ==========================================
// DENPASAR AREA BOUNDS
// ==========================================

const BOUNDS = {
  south: -8.84,
  north: -8.53,
  west: 115.06,
  east: 115.46,
};

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

// ==========================================
// VALIDATE COORDINATES
// ==========================================

function validLocation(point) {
  return (
    Array.isArray(point) &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    point[0] > BOUNDS.south &&
    point[0] < BOUNDS.north &&
    point[1] > BOUNDS.west &&
    point[1] < BOUNDS.east
  );
}

// ==========================================
// CALCULATE DISTANCE IN METERS
// ==========================================

function meters(a, b) {
  const lat =
    ((a[0] + b[0]) * Math.PI) / 360;

  return Math.hypot(
    (b[0] - a[0]) * 111320,

    (b[1] - a[1]) *
      111320 *
      Math.cos(lat)
  );
}

// ==========================================
// ILLUSTRATIVE TRAFFIC PRESSURE
// ==========================================

const MAJOR_OD = mat2026
  .flatMap((row, i) =>
    row.map((value, j) => ({
      i,
      j,
      value,
    }))
  )
  .filter((od) => od.i !== od.j)
  .sort((a, b) => b.value - a.value)
  .slice(0, 16);

function distanceToLineKm(point, a, b) {
  const cos = Math.cos(
    (point[0] * Math.PI) / 180
  );

  const x = point[1] * 111.32 * cos;
  const y = point[0] * 111.32;

  const ax = a[1] * 111.32 * cos;
  const ay = a[0] * 111.32;

  const bx = b[1] * 111.32 * cos;
  const by = b[0] * 111.32;

  const dx = bx - ax;
  const dy = by - ay;

  const denominator =
    dx * dx + dy * dy || 1;

  const t = Math.max(
    0,
    Math.min(
      1,
      (
        (x - ax) * dx +
        (y - ay) * dy
      ) / denominator
    )
  );

  return Math.hypot(
    x - ax - t * dx,
    y - ay - t * dy
  );
}

function illustrativePressure(a, b) {
  const midpoint = [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];

  let pressure = 0;

  for (const od of MAJOR_OD) {
    const origin = ZONES[od.i];
    const destination = ZONES[od.j];

    const km = distanceToLineKm(
      midpoint,
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    );

    pressure +=
      Math.sqrt(od.value / 192833) *
      Math.exp(
        -0.5 * (km / 1.7) ** 2
      );
  }

  return (
    Math.round(
      (65 + 120 * pressure) * 100
    ) / 100
  );
}

// ==========================================
// BUILD OSRM URL
// ==========================================

function routeURL(base, ids) {
  const coordinates = ids
    .map((id) => {
      const zone = ZONE_BY_ID.get(id);

      if (!zone) {
        throw new Error(
          `Zona tidak ditemukan: ${id}`
        );
      }

      return (
        `${zone.lng.toFixed(6)},` +
        `${zone.lat.toFixed(6)}`
      );
    })
    .join(";");

  return (
    `${base}${coordinates}` +
    "?overview=full" +
    "&geometries=geojson" +
    "&steps=true"
  );
}

// ==========================================
// EXTRACT DRIVING GEOMETRY
// ==========================================

/**
 * OSRM menggunakan koordinat:
 * [longitude, latitude]
 *
 * Leaflet menggunakan:
 * [latitude, longitude]
 *
 * Ambil hanya step driving.
 * Jangan menyambungkan dua step terpisah
 * menggunakan garis lurus.
 */

export function extractDrivingSegments(route) {
  const segments = [];

  for (const leg of route?.legs || []) {
    for (const step of leg?.steps || []) {
      const mode = String(
        step?.mode || ""
      ).toLowerCase();

      if (mode !== "driving") {
        continue;
      }

      const coordinates =
        step?.geometry?.coordinates;

      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) {
        continue;
      }

      const points = coordinates
        .filter(
          (point) =>
            Array.isArray(point) &&
            Number.isFinite(point[0]) &&
            Number.isFinite(point[1])
        )
        .map(([lng, lat]) => [
          lat,
          lng,
        ]);

      if (points.length >= 2) {
        segments.push(points);
      }
    }
  }

  return segments;
}

// ==========================================
// FETCH OSRM ROUTE
// ==========================================

async function fetchRoute(ids) {
  let lastError = null;

  for (const base of ROUTERS) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      14000
    );

    try {
      const response = await fetch(
        routeURL(base, ids),
        {
          method: "GET",
          mode: "cors",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const body =
        await response.json();

      if (
        body?.code !== "Ok" ||
        !body.routes?.[0]
      ) {
        throw new Error(
          body?.message ||
            body?.code ||
            "Geometri rute kosong"
        );
      }

      const segments =
        extractDrivingSegments(
          body.routes[0]
        );

      if (!segments.length) {
        throw new Error(
          "Tidak ada geometri driving"
        );
      }

      return segments;
    } catch (error) {
      lastError = error;

      console.warn(
        "[Modeling OSRM] Gagal:",
        error?.message
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw (
    lastError ||
    new Error(
      "Semua server routing gagal"
    )
  );
}

// ==========================================
// BUILD ROAD NETWORK
// ==========================================

function createNetwork(
  segments,
  sampledCorridors
) {
  const nodes = [];
  const edges = [];

  const nodeIndex = new Map();
  const edgeKeys = new Set();

  function addNode(point) {
    const key =
      `${point[0].toFixed(5)},` +
      `${point[1].toFixed(5)}`;

    if (!nodeIndex.has(key)) {
      nodeIndex.set(
        key,
        nodes.length
      );

      nodes.push(point);
    }

    return nodeIndex.get(key);
  }

  segments.forEach(
    (points, segmentIndex) => {
      for (
        let j = 1;
        j < points.length;
        j++
      ) {
        const a = points[j - 1];
        const b = points[j];

        if (
          !validLocation(a) ||
          !validLocation(b)
        ) {
          continue;
        }

        const length = meters(a, b);

        // Hindari koordinat duplikat
        // atau gap yang terlalu panjang.

        if (
          length < 0.7 ||
          length > 1500
        ) {
          continue;
        }

        const from = addNode(a);
        const to = addNode(b);

        if (from === to) {
          continue;
        }

        // Directed edge:
        // jangan membuat arah balik otomatis.

        const key = `${from}:${to}`;

        if (edgeKeys.has(key)) {
          continue;
        }

        edgeKeys.add(key);

        const before =
          illustrativePressure(a, b);

        const roadClass =
          segmentIndex % 3 === 0
            ? 3
            : 4;

        edges.push([
          from,
          to,
          Math.round(length * 10) / 10,
          roadClass,
          before,
          before,
        ]);
      }
    }
  );

  if (edges.length < 50) {
    throw new Error(
      "Jaringan koridor belum cukup. " +
      "Coba lagi ketika OSRM tersedia."
    );
  }

  const sorted = edges
    .map((edge) => edge[4])
    .sort((a, b) => a - b);

  return {
    format: 1,

    nodes,
    edges,

    zones: ZONES,
    mat: mat2026,

    attribution:
      "© OpenStreetMap contributors · Routing: OSRM",

    metadata: {
      matTotal,

      priorityOD: 192833,

      visualP95:
        sorted[
          Math.floor(
            (sorted.length - 1) * 0.95
          )
        ] || 1,

      source:
        "OSRM / OpenStreetMap — " +
        "koridor khusus Modeling",

      sampledCorridors,

      drivingSteps:
        segments.length,

      ferryFiltered: true,

      trafficCalibration:
        "Belum dikalibrasi terhadap " +
        "volume ruas lapangan",

      afterNote:
        "Nilai After berasal dari " +
        "policyEngine + trafficAssignment",

      updatedAt:
        new Date().toISOString(),
    },
  };
}

// ==========================================
// READ CACHE
// ==========================================

async function getCached() {
  if (typeof caches === "undefined") {
    return null;
  }

  try {
    const cache = await caches.open(
      CACHE_NAME
    );

    const response = await cache.match(
      CACHE_KEY
    );

    if (!response) {
      return null;
    }

    const graph =
      await response.json();

    const age =
      Date.now() -
      Date.parse(
        graph?.metadata?.updatedAt || 0
      );

    const valid =
      graph?.format === 1 &&
      graph?.metadata?.ferryFiltered &&
      graph?.edges?.length >= 50 &&
      age >= 0 &&
      age < CACHE_TTL;

    return valid ? graph : null;
  } catch {
    return null;
  }
}

// ==========================================
// SAVE CACHE
// ==========================================

async function saveCached(graph) {
  if (typeof caches === "undefined") {
    return;
  }

  try {
    const cache = await caches.open(
      CACHE_NAME
    );

    await cache.put(
      CACHE_KEY,
      new Response(
        JSON.stringify(graph),
        {
          headers: {
            "content-type":
              "application/json",
          },
        }
      )
    );
  } catch (error) {
    console.warn(
      "[Modeling] Cache tidak tersedia:",
      error?.message
    );
  }
}

// ==========================================
// LOAD NETWORK
// ==========================================

async function loadNetwork() {
  const cached = await getCached();

  if (cached) {
    return cached;
  }

  const segments = [];

  let sampledCorridors = 0;

  for (
    let i = 0;
    i < ROUTES.length;
    i++
  ) {
    // Hindari terlalu banyak request
    // bersamaan ke OSRM publik.

    if (i > 0) {
      await sleep(1100);
    }

    try {
      const driving =
        await fetchRoute(ROUTES[i]);

      segments.push(...driving);

      sampledCorridors++;
    } catch (error) {
      console.warn(
        `[Modeling] Koridor ${i + 1} terlewati:`,
        error?.message
      );
    }
  }

  if (!segments.length) {
    throw new Error(
      "Jaringan jalan Modeling gagal " +
      "dimuat dari OSRM. Periksa " +
      "koneksi, lalu coba lagi."
    );
  }

  const graph = createNetwork(
    segments,
    sampledCorridors
  );

  await saveCached(graph);

  return graph;
}

// ==========================================
// PUBLIC API
// ==========================================

let currentRequest = null;

export function getDenpasarNetwork() {
  if (!currentRequest) {
    currentRequest =
      loadNetwork().catch((error) => {
        currentRequest = null;
        throw error;
      });
  }

  return currentRequest;
}
