
/**
 * DEWATAMOVE 2041
 * REAL ROAD CORRIDOR NETWORK
 *
 * React + Vite + Leaflet
 *
 * - Tanpa Overpass API
 * - Tanpa generator terminal
 * - Tanpa file JSON tambahan
 * - Mengambil rute jalan Denpasar dari OSRM
 * - Menyimpan hasil dalam cache browser
 *
 * PENTING:
 * Geometri berasal dari rute jalan OSM.
 * Cakupan masih koridor sampel, bukan seluruh jalan.
 * Kepadatan lalu lintas masih estimasi visual.
 */

const ZONE_ROWS = [
  ["Z01", "Dangin Puri & Sumerta", -8.6535, 115.2350],
  ["Z02", "Dauh Puri & Pemecutan", -8.6598, 115.2030],
  ["Z03", "Ubung & Peguyangan", -8.6250, 115.2100],
  ["Z04", "Tonja", -8.6400, 115.2260],
  ["Z05", "Kesiman", -8.6550, 115.2570],
  ["Z06", "Sanur Kaja & Sanur Kauh", -8.6940, 115.2640],
  ["Z07", "Renon / Panjer / Sesetan / Pedungan / Pemogan", -8.6920, 115.2190],
  ["Z08", "Padangsambian", -8.6690, 115.1820],
  ["Z09", "Padangsambian Kaja & Ubung Kaja", -8.6340, 115.1870],
  ["Z10", "Peguyangan Kaja & Kangin", -8.6060, 115.2290],
  ["Z11", "Penatih & Penatih Dangin Puri", -8.6240, 115.2510],
  ["Z12", "Serangan & Pelabuhan Benoa", -8.7420, 115.2440],
  ["Z13", "Bandara / Tuban / Kuta", -8.7420, 115.1810],
];

const ZONES = ZONE_ROWS.map(
  ([id, name, lat, lng]) => ({
    id,
    name,
    lat,
    lng,
  })
);

const ZONE_LOOKUP = Object.fromEntries(
  ZONES.map((zone) => [zone.id, zone])
);

// MAT 2026 - DATA TOR

const MAT = [
  [1014,3349,5676,146,434,573,495,188,1236,396,149,90,414],
  [4368,26719,33564,733,1945,2539,2830,1484,8394,2243,685,513,2887],
  [4682,21225,52500,1110,2585,2704,2430,1348,11296,3482,992,434,2295],
  [842,3262,7810,303,606,553,411,201,1908,796,269,75,360],
  [2004,6890,14480,482,1671,1503,998,398,3205,1273,572,190,818],
  [2546,8656,14576,424,1446,3103,1637,481,3140,1112,536,361,1278],
  [6958,30550,41487,998,3040,5182,6898,1767,9649,2777,1042,1230,5384],
  [1400,8513,12226,259,643,809,940,747,3686,880,234,178,1108],
  [9734,50690,107868,2589,5462,5561,5398,3879,54440,11812,2341,973,5782],
  [2987,12982,31877,1036,2080,1888,1489,888,11324,7097,1137,267,1404],
  [23846,84150,192833,7411,19841,19322,11870,4999,47676,24151,15321,2300,9731],
  [997,4360,5825,143,455,899,969,263,1370,392,159,409,1016],
  [2180,11662,14661,327,933,1514,2015,780,3868,980,320,483,3254],
];

const MAT_TOTAL = MAT.flat().reduce(
  (sum, value) => sum + value,
  0
);

// KORIDOR PERJALANAN

// Urutan berikut menjadi waypoint OSRM.
// Waypoint terakhir kembali ke titik awal.
//
// OSRM menghitung lintasan jalan yang
// dapat dilalui kendaraan berdasarkan
// jaringan OpenStreetMap.

const ROUTE_LOOPS = [
  [
    "Z09", "Z03", "Z10",
    "Z11", "Z04", "Z02", "Z09"
  ],

  [
    "Z03", "Z02", "Z07",
    "Z06", "Z05", "Z01", "Z03"
  ],

  [
    "Z08", "Z02", "Z07",
    "Z12", "Z13", "Z08"
  ],

  [
    "Z10", "Z11", "Z05",
    "Z06", "Z07", "Z02",
    "Z03", "Z10"
  ],

  [
    "Z09", "Z02", "Z01",
    "Z05", "Z06", "Z07",
    "Z08", "Z09"
  ],
];

// ROUTING SERVICES

const API = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

// Cache baru, tidak menggunakan
// hasil jaringan grid sebelumnya.

const CACHE_NAME = "dewata-real-streets-v1";
const CACHE_KEY = "/__dewata_real_streets_v1.json";

const TIME_TO_LIVE_MS =
  30 * 24 * 60 * 60 * 1000;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// GEOMETRY HELPERS

function meters(a, b) {
  const lat =
    ((a[0] + b[0]) / 2) *
    Math.PI / 180;

  return Math.hypot(
    (a[0] - b[0]) * 111320,
    (a[1] - b[1]) *
      111320 *
      Math.cos(lat)
  );
}

function distancePointToLineKm(
  point,
  from,
  to
) {
  const cos = Math.cos(
    point[0] * Math.PI / 180
  );

  const x = point[1] * cos * 111.32;
  const y = point[0] * 111.32;

  const ax = from[1] * cos * 111.32;
  const ay = from[0] * 111.32;

  const bx = to[1] * cos * 111.32;
  const by = to[0] * 111.32;

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

// PRIORITAS OD TOR

const HEAVY_OD = [];

for (let i = 0; i < 13; i++) {
  for (let j = 0; j < 13; j++) {
    if (i === j) continue;

    HEAVY_OD.push({
      from: [
        ZONES[i].lat,
        ZONES[i].lng
      ],

      to: [
        ZONES[j].lat,
        ZONES[j].lng
      ],

      weight: MAT[i][j],
    });
  }
}

HEAVY_OD.sort(
  (a, b) => b.weight - a.weight
);

const TOP_OD = HEAVY_OD.slice(0, 16);

// ILUSTRATIVE TRAFFIC PRESSURE

// Memberikan bobot visual berdasarkan
// kedekatan ruas dengan hubungan OD besar.
//
// Bukan hasil traffic assignment
// yang sudah terkalibrasi.

function estimatedPressure(a, b) {
  const midpoint = [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2
  ];

  let pressure = 0;

  for (const od of TOP_OD) {
    const distance =
      distancePointToLineKm(
        midpoint,
        od.from,
        od.to
      );

    pressure +=
      Math.sqrt(
        od.weight / 192833
      ) *
      Math.exp(
        -0.5 *
        (distance / 1.7) ** 2
      );
  }

  return (
    Math.round(
      (65 + 120 * pressure) * 100
    ) / 100
  );
}

// MEMBUAT URL OSRM

function routeUrl(base, zoneIds) {
  const locations = zoneIds.map(
    (id) => {
      const zone = ZONE_LOOKUP[id];

      return (
        `${zone.lng.toFixed(6)},` +
        `${zone.lat.toFixed(6)}`
      );
    }
  ).join(";");

  return (
    `${base}${locations}` +
    "?overview=full" +
    "&geometries=geojson" +
    "&steps=false"
  );
}

// MENGAMBIL SATU RUTE

async function fetchOneRoute(zoneIds) {
  let lastError;

  for (const base of API) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      13000
    );

    try {
      const response = await fetch(
        routeUrl(base, zoneIds),
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

      const data = await response.json();

      const coordinates =
        data?.routes?.[0]
          ?.geometry?.coordinates;

      if (
        data.code !== "Ok" ||
        !Array.isArray(coordinates) ||
        coordinates.length < 3
      ) {
        throw new Error(
          `OSRM: ${
            data?.code || "geometri kosong"
          }`
        );
      }

      return coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

    } catch (error) {
      lastError = error;

      console.warn(
        "[DewataMove] Rute OSRM gagal:",
        error?.message
      );

    } finally {
      clearTimeout(timeout);
    }
  }

  throw (
    lastError ||
    new Error(
      "Layanan routing tidak tersedia"
    )
  );
}

// MEMBENTUK ROAD NETWORK

function networkFromRoutes(routes) {
  const nodes = [];
  const edges = [];

  const ids = new Map();
  const seenDirectedEdges = new Set();

  function addNode(point) {
    const [lat, lng] = point;

    const key =
      `${lat.toFixed(5)}:` +
      `${lng.toFixed(5)}`;

    let id = ids.get(key);

    if (id === undefined) {
      id = nodes.length;

      ids.set(key, id);
      nodes.push([lat, lng]);
    }

    return id;
  }

  // OSRM menghasilkan urutan titik
  // sesuai arah perjalanan yang diizinkan.
  //
  // Kita tidak otomatis menambahkan
  // ruas balik agar tidak membuat
  // arah terlarang pada jalan satu arah.

  routes.forEach(
    (points, routeIndex) => {
      for (
        let i = 1;
        i < points.length;
        i++
      ) {
        const a = addNode(
          points[i - 1]
        );

        const b = addNode(
          points[i]
        );

        if (a === b) continue;

        const key = `${a}:${b}`;

        if (
          seenDirectedEdges.has(key)
        ) {
          continue;
        }

        seenDirectedEdges.add(key);

        const distance = meters(
          nodes[a],
          nodes[b]
        );

        if (
          distance < 0.5 ||
          distance > 2000
        ) {
          continue;
        }

        const before =
          estimatedPressure(
            nodes[a],
            nodes[b]
          );

        const roadClass =
          routeIndex % 3 === 0
            ? 3
            : 4;

        // Faktor 0.88 hanya ilustrasi.
        // Belum hasil kebijakan TDM.

        const after =
          Math.round(
            before * 0.88 * 100
          ) / 100;

        edges.push([
          a,
          b,
          Math.round(
            distance * 10
          ) / 10,
          roadClass,
          before,
          after,
        ]);
      }
    }
  );

  if (edges.length < 50) {
    throw new Error(
      "Geometri jalan nyata belum mencukupi"
    );
  }

  const flows = edges
    .map((edge) => edge[4])
    .sort((a, b) => a - b);

  const visualP95 =
    flows[
      Math.floor(
        0.95 * (flows.length - 1)
      )
    ] || 1;

  return {
    format: 1,

    nodes,
    edges,
    zones: ZONES,
    mat: MAT,

    attribution:
      "© OpenStreetMap contributors · Routing: OSRM",

    metadata: {
      matTotal: MAT_TOTAL,

      priorityOD: 192833,

      visualP95,

      source:
        "Geometri jalan OSRM / OpenStreetMap",

      sampledCorridors: routes.length,

      trafficCalibration:
        "Belum dikalibrasi dengan volume ruas",

      afterNote:
        "After TDM masih asumsi visual",

      updatedAt:
        new Date().toISOString(),
    },
  };
}

// BROWSER CACHE

async function readCache() {
  if (
    typeof caches === "undefined"
  ) {
    return null;
  }

  try {
    const cache = await caches.open(
      CACHE_NAME
    );

    const result =
      await cache.match(CACHE_KEY);

    if (!result) return null;

    const data = await result.json();

    const age =
      Date.now() -
      Date.parse(
        data?.metadata?.updatedAt || 0
      );

    if (
      data?.format === 1 &&
      data.nodes?.length > 50 &&
      age < TIME_TO_LIVE_MS
    ) {
      return data;
    }

    return null;

  } catch {
    return null;
  }
}

// SAVE CACHE

async function writeCache(graph) {
  if (
    typeof caches === "undefined"
  ) {
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
              "application/json"
          },
        }
      )
    );

  } catch (error) {
    console.warn(
      "[DewataMove] Cache gagal:",
      error?.message
    );
  }
}

// LOAD REAL STREET NETWORK

async function createRealNetwork() {
  const cached = await readCache();

  if (cached) {
    console.info(
      "[DewataMove] Jaringan dari cache"
    );

    return cached;
  }

  const routes = [];

  // Batasi permintaan untuk menghormati
  // kapasitas layanan routing publik.

  for (
    let i = 0;
    i < ROUTE_LOOPS.length;
    i++
  ) {
    if (i > 0) {
      await sleep(1100);
    }

    try {
      const points =
        await fetchOneRoute(
          ROUTE_LOOPS[i]
        );

      routes.push(points);

    } catch (error) {
      console.warn(
        `[DewataMove] Koridor ${i + 1} gagal:`,
        error?.message
      );
    }
  }

  if (routes.length === 0) {
    throw new Error(
      "Gagal mengambil rute jalan Denpasar " +
      "dari layanan OSRM. " +
      "Periksa koneksi atau coba lagi nanti."
    );
  }

  const graph =
    networkFromRoutes(routes);

  await writeCache(graph);

  console.info(
    "[DewataMove] Jaringan siap",
    {
      nodes: graph.nodes.length,

      edges: graph.edges.length,

      corridors: routes.length,
    }
  );

  return graph;
}

// MAIN EXPORT

let currentLoad = null;

export function getDenpasarNetwork() {
  if (!currentLoad) {
    currentLoad =
      createRealNetwork().catch(
        (error) => {
          currentLoad = null;
          throw error;
        }
      );
  }

  return currentLoad;
}
