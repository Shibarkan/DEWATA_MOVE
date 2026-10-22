
/**
 * DENPASAR 2041 — Browser Network Builder
 *
 * Tanpa script Node.js tambahan.
 * Data OSM diambil saat website pertama dibuka.
 * Hasil disimpan di CacheStorage browser.
 *
 * MAT: ToR ITEC-U, 2026, satuan smp/jam.
 * Model: shortest-path assignment ilustratif.
 */

const CACHE_NAME = "denpasar-network-v1";
const CACHE_KEY = "denpasar-road-graph-v1";

const BBOX = [-8.765, 115.155, -8.588, 115.291];

const ZONES = [
  ["Z01", "Dangin Puri & Sumerta", -8.6535, 115.235],
  ["Z02", "Dauh Puri & Pemecutan", -8.6598, 115.203],
  ["Z03", "Ubung & Peguyangan", -8.6250, 115.210],
  ["Z04", "Tonja", -8.6400, 115.226],
  ["Z05", "Kesiman", -8.6550, 115.257],
  ["Z06", "Sanur", -8.6940, 115.264],
  ["Z07", "Renon / Panjer / Sesetan / Pedungan / Pemogan", -8.6920, 115.219],
  ["Z08", "Padangsambian", -8.6690, 115.182],
  ["Z09", "Padangsambian Kaja & Ubung Kaja", -8.6340, 115.187],
  ["Z10", "Peguyangan Kaja & Kangin", -8.6060, 115.229],
  ["Z11", "Penatih", -8.6240, 115.251],
  ["Z12", "Serangan & Pelabuhan Benoa", -8.7420, 115.244],
  ["Z13", "Bandara / Tuban / Kuta", -8.7420, 115.181],
];

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

const ROAD_TYPES = [
  "motorway", "trunk", "primary", "secondary",
  "tertiary", "unclassified", "residential",
  "living_street", "service",
];

const SPEEDS = [65, 55, 40, 34, 29, 23, 22, 15, 12];

function roadType(value) {
  const name = String(value || "").replace(/_link$/, "");
  const index = ROAD_TYPES.indexOf(name);
  return index < 0 ? 6 : index;
}

function distance(a, b) {
  const lat = (a[0] + b[0]) * Math.PI / 360;

  return Math.hypot(
    (a[0] - b[0]) * 111320,
    (a[1] - b[1]) * 111320 * Math.cos(lat)
  );
}

function isBlocked(tags) {
  const denied = new Set([
    "no", "private", "agricultural", "forestry",
  ]);

  return (
    denied.has(tags.access) ||
    denied.has(tags.motor_vehicle) ||
    denied.has(tags.motorcar) ||
    denied.has(tags.vehicle) ||
    tags.area === "yes" ||
    tags.service === "parking_aisle"
  );
}

// Mengambil data jalan OSM di browser.
// Menggunakan dua endpoint sebagai cadangan.
async function fetchRoads() {
  const roadPattern = [
    "motorway", "motorway_link",
    "trunk", "trunk_link",
    "primary", "primary_link",
    "secondary", "secondary_link",
    "tertiary", "tertiary_link",
    "unclassified", "residential",
    "living_street", "service",
  ].join("|");

  const query = `
    [out:json][timeout:120];
    way["highway"~"^(${roadPattern})$"]
    (${BBOX.join(",")});
    out geom;
  `;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let lastError;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        130000
      );

      try {
        const url =
          `${endpoint}?data=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Overpass HTTP ${response.status}`);
        }

        const json = await response.json();

        if (!Array.isArray(json.elements) ||
            json.elements.length === 0) {
          throw new Error("Data jalan kosong");
        }

        return json;
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      lastError = error;
      console.warn("Server OSM gagal:", error.message);
    }
  }

  throw new Error(
    "Gagal mengakses jaringan jalan OSM. " +
    (lastError?.message || "Periksa koneksi internet.")
  );
}

// Mengubah jalan OSM menjadi graf berarah.
function makeGraph(osm) {
  const nodeIds = new Map();
  const nodes = [];
  const edges = [];

  function nodeIndex(id, geometry) {
    if (nodeIds.has(id)) return nodeIds.get(id);

    const index = nodes.length;

    nodes.push([geometry.lat, geometry.lon]);
    nodeIds.set(id, index);

    return index;
  }

  for (const way of osm.elements) {
    if (
      way.type !== "way" ||
      !Array.isArray(way.nodes) ||
      !Array.isArray(way.geometry)
    ) continue;

    const tags = way.tags || {};

    if (isBlocked(tags)) continue;

    const type = roadType(tags.highway);
    const oneway = String(tags.oneway || "").toLowerCase();

    const reverseOnly = oneway === "-1";

    const forwardOnly =
      reverseOnly ||
      ["yes", "true", "1"].includes(oneway) ||
      (
        oneway !== "no" &&
        (
          tags.junction === "roundabout" ||
          ["motorway", "motorway_link"].includes(tags.highway)
        )
      );

    for (let i = 1; i < way.nodes.length; i++) {
      if (!way.geometry[i] || !way.geometry[i - 1]) {
        continue;
      }

      const a = nodeIndex(
        way.nodes[i - 1],
        way.geometry[i - 1]
      );

      const b = nodeIndex(
        way.nodes[i],
        way.geometry[i]
      );

      const len = distance(nodes[a], nodes[b]);

      if (a === b || len < 0.4 || len > 4000) {
        continue;
      }

      if (!reverseOnly) {
        edges.push({
          a, b, len, type,
          before: 0, after: 0,
        });
      }

      if (!forwardOnly || reverseOnly) {
        edges.push({
          a: b, b: a, len, type,
          before: 0, after: 0,
        });
      }
    }
  }

  if (!nodes.length || !edges.length) {
    throw new Error("Tidak ada jalan yang bisa diproses");
  }

  const adjacency = Array.from(
    { length: nodes.length },
    () => []
  );

  edges.forEach((edge, i) => {
    adjacency[edge.a].push(i);
  });

  return { nodes, edges, adjacency };
}

// Priority queue untuk perhitungan shortest path.
class MinHeap {
  constructor() {
    this.items = [];
  }

  push(value) {
    const heap = this.items;
    let i = heap.length;

    heap.push(value);

    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= value[0]) break;

      heap[i] = heap[parent];
      i = parent;
    }

    heap[i] = value;
  }

  pop() {
    const heap = this.items;

    if (!heap.length) return null;

    const top = heap[0];
    const last = heap.pop();

    if (!heap.length) return top;

    let i = 0;

    while (2 * i + 1 < heap.length) {
      let child = 2 * i + 1;

      if (
        child + 1 < heap.length &&
        heap[child + 1][0] < heap[child][0]
      ) {
        child++;
      }

      if (heap[child][0] >= last[0]) break;

      heap[i] = heap[child];
      i = child;
    }

    heap[i] = last;
    return top;
  }

  get size() {
    return this.items.length;
  }
}

function dijkstra(graph, start) {
  const { nodes, edges, adjacency } = graph;

  const dist = new Float64Array(nodes.length);
  const previous = new Int32Array(nodes.length);

  dist.fill(Infinity);
  previous.fill(-1);

  const queue = new MinHeap();

  dist[start] = 0;
  queue.push([0, start]);

  while (queue.size) {
    const item = queue.pop();
    if (!item) break;

    const [travelTime, current] = item;

    if (travelTime > dist[current]) continue;

    for (const index of adjacency[current]) {
      const edge = edges[index];

      const speed =
        SPEEDS[edge.type] * 1000 / 3600;

      const cost = edge.len / speed;
      const nextTime = travelTime + cost;

      if (nextTime < dist[edge.b]) {
        dist[edge.b] = nextTime;
        previous[edge.b] = index;

        queue.push([nextTime, edge.b]);
      }
    }
  }

  return previous;
}

function nearestNode(graph, lat, lng) {
  const point = [lat, lng];
  let best = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < graph.nodes.length; i++) {
    if (!graph.adjacency[i].length) continue;

    const d = distance(point, graph.nodes[i]);

    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }

  return best;
}

function traceRoute(graph, previous, origin, target) {
  const route = [];
  let node = target;
  let safety = 0;

  while (
    node !== origin &&
    safety++ < graph.nodes.length
  ) {
    const edgeIndex = previous[node];

    if (edgeIndex < 0) return null;

    route.push(edgeIndex);
    node = graph.edges[edgeIndex].a;
  }

  return node === origin ? route : null;
}

// Menempatkan bobot MAT pada jaringan jalan.
function assignTraffic(graph) {
  const offsets = [
    [0.0035, 0.003],
    [-0.0035, -0.003],
  ];

  const accessPoints = ZONES.map(zone =>
    offsets.map(([dy, dx]) =>
      nearestNode(
        graph,
        zone[2] + dy,
        zone[3] + dx
      )
    )
  );

  let successfulRoutes = 0;
  let failedRoutes = 0;

  for (let origin = 0; origin < 13; origin++) {
    for (let sample = 0; sample < 2; sample++) {
      const start = accessPoints[origin][sample];

      if (start < 0) continue;

      const previous = dijkstra(graph, start);

      for (let destination = 0; destination < 13; destination++) {
        const demand = MAT[origin][destination];

        if (demand <= 0) continue;

        // Parameter kebijakan masih ilustratif.
        const reduction =
          origin === 10 && destination === 2
            ? 0.30
            : 0.12;

        const afterDemand = demand * (1 - reduction);

        // Perjalanan intrazona memakai titik akses lain.
        const samples =
          origin === destination
            ? [1 - sample]
            : [0, 1];

        const divisor = 2 * samples.length;

        for (const destSample of samples) {
          const end =
            accessPoints[destination][destSample];

          const path = traceRoute(
            graph, previous, start, end
          );

          if (!path?.length) {
            failedRoutes++;
            continue;
          }

          successfulRoutes++;

          for (const edgeIndex of path) {
            graph.edges[edgeIndex].before +=
              demand / divisor;

            graph.edges[edgeIndex].after +=
              afterDemand / divisor;
          }
        }
      }
    }
  }

  return { successfulRoutes, failedRoutes };
}

function calculateP95(graph) {
  const values = graph.edges
    .map(e => e.before)
    .filter(value => value > 0)
    .sort((a, b) => a - b);

  if (!values.length) return 1;

  return Math.max(
    1,
    values[Math.floor((values.length - 1) * 0.95)]
  );
}

function makeNetwork(osm) {
  const graph = makeGraph(osm);
  const assignment = assignTraffic(graph);

  return {
    format: 1,
    attribution: "© OpenStreetMap contributors",
    metadata: {
      name: "Denpasar 2041 Traffic Preview",
      matTotal: 1316578,
      priorityOD: 192833,
      visualP95: Math.round(calculateP95(graph)),
      routedPaths: assignment.successfulRoutes,
      unresolvedPaths: assignment.failedRoutes,
      snapshot: osm.osm3s?.timestamp_osm_base ?? null,
    },
    zones: ZONES.map(z => ({
      id: z[0],
      name: z[1],
      lat: z[2],
      lng: z[3],
    })),
    mat: MAT,
    nodes: graph.nodes,
    edges: graph.edges.map(e => [
      e.a,
      e.b,
      Math.round(e.len * 10) / 10,
      e.type,
      Math.round(e.before),
      Math.round(e.after),
    ]),
  };
}

// Cache agar tidak selalu memanggil server OSM.
async function readCache() {
  if (typeof caches === "undefined") return null;

  try {
    const store = await caches.open(CACHE_NAME);
    const response = await store.match(
      new URL(`/${CACHE_KEY}.json`, location.origin).href
    );

    if (!response) return null;

    const graph = await response.json();

    return graph?.format === 1 ? graph : null;
  } catch {
    return null;
  }
}

async function writeCache(graph) {
  if (typeof caches === "undefined") return;

  try {
    const store = await caches.open(CACHE_NAME);
    const key = new URL(
      `/${CACHE_KEY}.json`,
      location.origin
    ).href;

    await store.put(
      key,
      new Response(JSON.stringify(graph), {
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  } catch (error) {
    console.warn("Cache tidak tersimpan:", error);
  }
}

let currentLoad = null;

export async function getDenpasarNetwork() {
  if (currentLoad) return currentLoad;

  currentLoad = (async () => {
    const cached = await readCache();

    if (cached) {
      console.info("Jaringan Denpasar dari cache browser");
      return cached;
    }

    console.info("Mengambil jaringan OSM Denpasar...");

    const osm = await fetchRoads();

    // Beri kesempatan browser menggambar status loading.
    await new Promise(resolve => setTimeout(resolve, 0));

    const graph = makeNetwork(osm);

    await writeCache(graph);

    console.info("Jaringan Denpasar siap:", {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      routes: graph.metadata.routedPaths,
      failed: graph.metadata.unresolvedPaths,
    });

    return graph;
  })().catch(error => {
    currentLoad = null;
    throw error;
  });

  return currentLoad;
}
