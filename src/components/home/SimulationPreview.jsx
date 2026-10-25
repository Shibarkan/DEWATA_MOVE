import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Map as MapIcon,
  CarFront,
  Network,
  RotateCcw,
  Play,
  Pause,
  Plus,
  Minus,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { getDenpasarNetwork } from "../../data/denpasarNetworkBrowser";
/*
 * DENPASAR 2041 - SMOOTH TRAFFIC PREVIEW
 *
 * Khusus halaman Beranda.
 *
 * - Kendaraan mengecil saat zoom out
 * - Tidak membuat ulang kendaraan saat zoom
 * - Tidak teleport ke ruas acak
 * - Zoom lebih kecil per klik
 * - Kecepatan animasi tetap pada semua zoom
 * - Lalu lintas kiri Indonesia
 * - Tampilan responsif HP dan desktop
 *
 * Data kendaraan tetap visualisasi ilustratif.
 * Hotspot MAT 2026 dihitung dari graph.mat; bukan peta kemacetan aktual.
 */
const CITY = [-8.673, 115.216];
const MAX_VEHICLES = 2100;
const DEFAULT_DENSITY = 0.85;
const MAX_DENSITY = 1.6;
const SIMULATION_SPEED = 3.1;
const ROAD_SPEEDS = [
  50, 45, 38, 32, 28, 23, 18, 12, 8,
];
// Faktor kelas jalan hanya penyesuaian visual kecil.
// Intensitas utama ditentukan nilai arus edge[4] dari penyedia jaringan.
const ROAD_CLASS_FACTOR = [1.15, 1.1, 1.05, 1, 0.94, 0.88, 0.82, 0.76, 0.7];
const COLORS = [
  "#ffffff",
  "#e2e8f0",
  "#475569",
  "#334155",
  "#b91c1c",
  "#2563eb",
  "#0f766e",
  "#d9a024",
];
const clamp = (n, min, max) =>
  Math.min(max, Math.max(min, n));
const formatNumber = (n) =>
  Math.round(n || 0).toLocaleString("id-ID");
/**
 * MAT 2026 dari ToR, diambil dari graph.mat yang di-load oleh
 * denpasarNetworkBrowser. Analisis ini mengukur bangkitan dan tarikan
 * perjalanan, BUKAN tingkat kemacetan/V/C ruas jalan.
 * Urutan baris dan kolom mengikuti indeks Z01..Z13.
 */
function getZoneMatInsights(graph) {
  if (!graph || !Array.isArray(graph.mat) || !Array.isArray(graph.zones)) return null;
  const matrix = graph.mat;
  const zones = graph.zones;
  const rankedZones = zones.map((zone, fallbackIndex) => {
    const indexFromId = Number(String(zone.id).replace(/[^0-9]/g, "")) - 1;
    const index = Number.isInteger(indexFromId) && indexFromId >= 0 && indexFromId < matrix.length
      ? indexFromId
      : fallbackIndex;
    const out = (matrix[index] || []).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const incoming = matrix.reduce((sum, row) => sum + (Number(row?.[index]) || 0), 0);
    const internal = Number(matrix[index]?.[index]) || 0;
    return { ...zone, index, out, incoming, internal, activity: out + incoming - internal };
  });
  const byOrigin = [...rankedZones].sort((a, b) => b.out - a.out);
  const byDestination = [...rankedZones].sort((a, b) => b.incoming - a.incoming);
  const byActivity = [...rankedZones].sort((a, b) => b.activity - a.activity);
  const zoneByIndex = new Map(rankedZones.map((zone) => [zone.index, zone]));
  const odPairs = [];
  matrix.forEach((row, i) => {
    if (!Array.isArray(row)) return;
    row.forEach((raw, j) => {
      const value = Number(raw) || 0;
      if (i !== j && value > 0 && zoneByIndex.has(i) && zoneByIndex.has(j)) {
        odPairs.push({ origin: zoneByIndex.get(i), destination: zoneByIndex.get(j), value });
      }
    });
  });
  odPairs.sort((a, b) => b.value - a.value);
  const total = matrix.reduce((sum, row) =>
    sum + (Array.isArray(row) ? row.reduce((acc, v) => acc + (Number(v) || 0), 0) : 0), 0);
  return { byOrigin, byDestination, byActivity, odPairs, total };
}
function hash(n) {
  let x = Math.floor(n) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
/*
 * UKURAN KENDARAAN BERDASARKAN ZOOM
 *
 * Zoom jauh: simbol kecil.
 * Zoom dekat: mobil terlihat jelas.
 */
function getVehicleScale(zoom) {
  if (zoom <= 11) return 0.14;
  if (zoom <= 12) return 0.18;
  if (zoom <= 13) return 0.25;
  if (zoom <= 14) return 0.38;
  if (zoom <= 15) return 0.55;
  if (zoom <= 16) return 0.75;
  if (zoom <= 17) return 0.95;
  return 1.12;
}
function getLaneGap(zoom) {
  if (zoom <= 13) return 0;
  if (zoom <= 14) return 0.5;
  if (zoom <= 15) return 1.3;
  if (zoom <= 16) return 2.8;
  if (zoom <= 17) return 4.5;
  return 6;
}
function createZoneIcon(id, active) {
  return L.divIcon({
    className: "dt-zone-icon",
    html: `
      <span class="${active ? "active" : ""}">
        ${id}
      </span>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}
/*
 * GAMBAR KENDARAAN
 */
function drawVehicle(ctx, car, scale) {
  const s = scale;
  if (car.type === "motor") {
    ctx.fillStyle = "#17202e";
    ctx.fillRect(-5 * s, -1.5 * s, 10 * s, 3 * s);
    ctx.fillStyle = car.color;
    ctx.fillRect(-2 * s, -1.8 * s, 4 * s, 3.6 * s);
    return;
  }
  if (car.type === "bus") {
    ctx.fillStyle = "#243244";
    ctx.fillRect(-11 * s, -4 * s, 22 * s, 8 * s);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-10 * s, -3.2 * s, 20 * s, 6.4 * s);
    ctx.fillStyle = "#334155";
    ctx.fillRect(-6 * s, -2.3 * s, 12 * s, 3.8 * s);
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(-9 * s, 2 * s, 18 * s, 1 * s);
    return;
  }
  // Mobil
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-7 * s, -3.2 * s, 14 * s, 6.4 * s);
  ctx.fillStyle = car.color;
  ctx.fillRect(-6.3 * s, -2.7 * s, 12.6 * s, 5.4 * s);
  ctx.fillStyle = "#9bc5d8";
  ctx.fillRect(1.6 * s, -2.1 * s, 2.5 * s, 4.2 * s);
}
/*
 * MEMBUAT KENDARAAN
 */
function createCar(edgeIndex, index, count, edge) {
  const seed = edgeIndex * 997 + index * 73;
  const roadClass = clamp(edge[3] | 0, 0, 8);
  const roll = hash(seed);
  const type =
    roll < 0.67
      ? "motor"
      : roll < (roadClass <= 4 ? 0.96 : 1)
        ? "car"
        : "bus";
  const modeFactor =
    type === "motor"
      ? 1.07
      : type === "bus"
        ? 0.8
        : 1;
  const desiredSpeed =
    (ROAD_SPEEDS[roadClass] / 3.6) *
    (0.82 + hash(seed + 13) * 0.35) *
    modeFactor;
  return {
    edge: edgeIndex,
    t: (index + 0.5) / count,
    type,
    color: COLORS[
      Math.floor(hash(seed + 3) * COLORS.length)
    ],
    length:
      type === "motor"
        ? 2
        : type === "bus"
          ? 10
          : 4.5,
    desiredSpeed,
    speed: desiredSpeed * 0.84,
    headway: 1 + hash(seed + 27) * 0.7,
    minGap: 2 + hash(seed + 38) * 2,
    visibility: hash(seed + 823),
    seed,
    status: "moving",
    opacity: 1,
  };
}
/*
 * ARAH RUAS JALAN
 */
function roadAngle(graph, edge) {
  const a = graph.nodes[edge[0]];
  const b = graph.nodes[edge[1]];
  const cosLat = Math.cos(
    ((a[0] + b[0]) * Math.PI) / 360
  );
  return Math.atan2(
    b[0] - a[0],
    (b[1] - a[1]) * cosLat
  );
}
/*
 * MEMILIH JALAN BERIKUTNYA
 *
 * Hanya memilih jalan yang benar-benar
 * tersambung dengan ruas sekarang.
 */
function chooseNext(car, edge, graph, adjacency, flowIndex) {
  const outgoing = adjacency[edge[1]] || [];
  if (!outgoing.length) return null;
  const noUTurn = outgoing.filter(
    (i) => graph.edges[i][1] !== edge[0]
  );
  const choices = noUTurn.length ? noUTurn : outgoing;
  const previousAngle = roadAngle(graph, edge);
  const p95 = Math.max(
    1,
    graph.metadata?.visualP95 || 1
  );
  let total = 0;
  const weighted = choices.map((index) => {
    const next = graph.edges[index];
    const angle = roadAngle(graph, next);
    const difference = Math.abs(
      Math.atan2(
        Math.sin(angle - previousAngle),
        Math.cos(angle - previousAngle)
      )
    );
    const turnWeight =
      difference < 0.45
        ? 3
        : difference < 1.3
          ? 1.5
          : 0.65;
    const flow = Math.max(0, next[flowIndex] || 0);
    total +=
      turnWeight *
      (0.8 + Math.min(1, Math.sqrt(flow / p95) * 0.6));
    return [index, total];
  });
  car.seed += 37;
  const roll = hash(car.seed) * total;
  return (
    weighted.find((item) => roll <= item[1])?.[0] ??
    weighted[weighted.length - 1][0]
  );
}
export default function SimulationPreview({
  initialScenario = "before",
  showScenarioControls = false,
}) {
  const mapElement = useRef(null);
  const canvasElement = useRef(null);
  const mapRef = useRef(null);
  const sceneRef = useRef({
    graph: null,
    cars: [],
    adjacency: [],
    heatCanvas: null,
  });
  const markersRef = useRef({});
  const hotspotsRef = useRef(null);
  const odLineRef = useRef(null);
  const redrawHeatRef = useRef(() => {});
  const settingsRef = useRef({});
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scenario, setScenario] = useState(initialScenario);
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [playing, setPlaying] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showOD, setShowOD] = useState(true);
  const [mode, setMode] = useState("zones");
  const [origin, setOrigin] = useState("Z11");
  const [destination, setDestination] = useState("Z03");
  const [visibleCount, setVisibleCount] = useState(0);
  settingsRef.current = {
    scenario,
    density,
    playing,
    showHeat,
    showHotspots,
  };
  useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let disposed = false;
    let frameId = null;
    let observer = null;
    let lastFrame = null;
    let lastCounter = 0;
    /*
     * ZOOM TANPA ANIMASI TRANSFORM CSS.
     *
     * Ini menghindari ketidaksinkronan
     * antara tile Leaflet dan Canvas eksternal.
     */
    const map = L.map(mapElement.current, {
      center: CITY,
      zoom: 12,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });
    mapRef.current = map;
    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);
    /*
     * RESIZE CANVAS HANYA JIKA UKURAN BERUBAH
     */
    function resizeCanvas() {
      const canvas = canvasElement.current;
      if (!canvas) return;
      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      const width = Math.max(1, Math.round(size.x * dpr));
      const height = Math.max(1, Math.round(size.y * dpr));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }
    /*
     * HEATMAP
     *
     * Boleh digambar ulang saat zoom.
     * Kendaraan tidak dibuat ulang.
     */
    function paintHeat() {
      const sc = sceneRef.current;
      const graph = sc.graph;
      if (!graph || !settingsRef.current.showHeat) {
        sc.heatCanvas = null;
        return;
      }
      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      const off = document.createElement("canvas");
      off.width = Math.round(size.x * dpr);
      off.height = Math.round(size.y * dpr);
      const ctx = off.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bounds = map.getBounds().pad(0.08);
      const flowIndex =
        settingsRef.current.scenario === "after" ? 5 : 4;
      const p95 = Math.max(
        1,
        graph.metadata?.visualP95 || 1
      );
      for (const edge of graph.edges) {
        const a = graph.nodes[edge[0]];
        const b = graph.nodes[edge[1]];
        if (
          Math.max(a[0], b[0]) < bounds.getSouth() ||
          Math.min(a[0], b[0]) > bounds.getNorth() ||
          Math.max(a[1], b[1]) < bounds.getWest() ||
          Math.min(a[1], b[1]) > bounds.getEast()
        ) {
          continue;
        }
        const flow = Math.max(0, edge[flowIndex] || 0);
        if (!flow) continue;
        const p = map.latLngToContainerPoint(a);
        const q = map.latLngToContainerPoint(b);
        const strength = Math.sqrt(clamp(flow / p95, 0, 3));
        ctx.strokeStyle =
          strength > 1
            ? "rgba(185,28,28,.52)"
            : strength > 0.45
              ? "rgba(234,117,31,.38)"
              : "rgba(234,179,8,.23)";
        ctx.lineWidth = clamp(1 + strength * 2.3, 1, 5);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      sc.heatCanvas = off;
    }
    redrawHeatRef.current = paintHeat;
    /*
     * KENDARAAN DIBUAT SEKALI
     */
    function initializeCars(graph) {
      const p95 = Math.max(
        1,
        graph.metadata?.visualP95 || 1
      );
      const plans = [];
      let totalExpected = 0;
      for (let i = 0; i < graph.edges.length; i++) {
        const edge = graph.edges[i];
        if (edge[2] < 7) continue;
        const roadClass = clamp(edge[3] | 0, 0, 8);
        const flow = Math.max(0, edge[4] || 0);
        // Lebih banyak kendaraan visual pada ruas dengan arus model tinggi.
        // ROAD_CLASS_FACTOR hanya koreksi ringan, bukan sumber utama kepadatan.
        const relativeFlow = Math.pow(clamp(flow / p95, 0, 3), 0.82);
        const demand = (edge[2] / 1000) *
          ROAD_CLASS_FACTOR[roadClass] *
          (0.05 + 16.5 * relativeFlow) *
          MAX_DENSITY;
        const capacity = Math.max(
          1,
          Math.floor(
            edge[2] / (roadClass <= 3 ? 16 : 23)
          )
        );
        const expected = Math.min(demand, capacity);
        if (expected > 0) {
          plans.push([i, expected]);
          totalExpected += expected;
        }
      }
      const factor = Math.min(
        1,
        MAX_VEHICLES / Math.max(1, totalExpected)
      );
      const cars = [];
      for (const [index, expected] of plans) {
        const amount = expected * factor;
        const count =
          Math.floor(amount) +
          (hash(index * 31 + 9) < amount % 1 ? 1 : 0);
        for (let n = 0; n < count; n++) {
          cars.push(
            createCar(
              index,
              n,
              count,
              graph.edges[index]
            )
          );
        }
      }
      sceneRef.current.cars =
        cars.length <= MAX_VEHICLES
          ? cars
          : Array.from(
              { length: MAX_VEHICLES },
              (_, i) =>
                cars[
                  Math.floor(i * cars.length / MAX_VEHICLES)
                ]
            );
    }
    /*
     * GERAK KENDARAAN
     *
     * Tidak tergantung pada zoom.
     * Tidak memindahkan kendaraan ke jalan acak.
     */
    function simulate(dt) {
      const sc = sceneRef.current;
      const graph = sc.graph;
      if (!graph || dt <= 0) return;
      const flowIndex =
        settingsRef.current.scenario === "after" ? 5 : 4;
      const occupied = new Map();
      for (const car of sc.cars) {
        if (car.status !== "moving") continue;
        if (!occupied.has(car.edge)) {
          occupied.set(car.edge, []);
        }
        occupied.get(car.edge).push({
          car,
          position: car.t,
        });
      }
      for (const group of occupied.values()) {
        group.sort((a, b) => b.position - a.position);
      }
      for (const group of occupied.values()) {
        for (let i = 0; i < group.length; i++) {
          const car = group[i].car;
          let edge = graph.edges[car.edge];
          if (!edge) continue;
          const length = Math.max(edge[2], 0.5);
          let targetSpeed = car.desiredSpeed;
          // Jarak aman sederhana.
          if (i > 0) {
            const leader = group[i - 1];
            const gap =
              (leader.position - group[i].position) *
              length -
              leader.car.length -
              car.minGap;
            const safeSpeed = Math.sqrt(
              Math.max(0, 2 * 2.5 * gap)
            );
            targetSpeed = Math.min(
              targetSpeed,
              safeSpeed
            );
          }
          // Perlambatan ringan di persimpangan.
          const distanceToEnd = (1 - car.t) * length;
          const exits = sc.adjacency[edge[1]] || [];
          if (exits.length > 2 && distanceToEnd < 18) {
            targetSpeed = Math.min(
              targetSpeed,
              7 + (distanceToEnd / 18) * 5
            );
          }
          const acceleration = clamp(
            (targetSpeed - car.speed) * 1.8,
            -4,
            2.4
          );
          car.speed = clamp(
            car.speed + acceleration * dt,
            0,
            car.desiredSpeed
          );
          let travel = car.speed * dt;
          /*
           * Lanjutkan melewati ruas yang
           * saling tersambung secara geografis.
           */
          for (
            let hops = 0;
            travel > 0.0001 && hops < 16;
            hops++
          ) {
            const roadLength = Math.max(edge[2], 0.5);
            const remaining = (1 - car.t) * roadLength;
            if (travel < remaining) {
              car.t += travel / roadLength;
              travel = 0;
              break;
            }
            travel -= remaining;
            const next = chooseNext(
              car,
              edge,
              graph,
              sc.adjacency,
              flowIndex
            );
            if (next == null) {
              /*
               * Perjalanan selesai.
               *
               * Mobil memudar di ujung jalan.
               * Tidak muncul kembali di tempat lain.
               */
              car.t = 0.9999;
              car.speed = 0;
              car.status = "exiting";
              travel = 0;
              break;
            }
            car.edge = next;
            car.t = 0;
            edge = graph.edges[next];
          }
          car.t = clamp(car.t, 0, 0.9999);
        }
      }
      /*
       * Kendaraan yang selesai memudar,
       * tanpa respawn ke lokasi acak.
       */
      for (const car of sc.cars) {
        if (car.status === "exiting") {
          car.opacity = Math.max(
            0,
            car.opacity - dt * 1.2
          );
          if (car.opacity <= 0) {
            car.status = "finished";
          }
        }
      }
    }
    /*
     * GAMBAR FRAME
     *
     * Saat zoom jauh, mobil berubah menjadi
     * titik-titik kecil agar tidak bergetar.
     */
    function draw() {
      const sc = sceneRef.current;
      const graph = sc.graph;
      const canvas = canvasElement.current;
      if (!graph || !canvas) return 0;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;
      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);
      if (settingsRef.current.showHeat && sc.heatCanvas) {
        ctx.drawImage(
          sc.heatCanvas,
          0,
          0,
          size.x,
          size.y
        );
      }
      const zoom = map.getZoom();
      const scale = getVehicleScale(zoom);
      const laneGap = getLaneGap(zoom);
      const threshold =
        settingsRef.current.density / MAX_DENSITY;
      const projectCache = new Map();
      let count = 0;
      for (const car of sc.cars) {
        if (
          car.status === "finished" ||
          car.visibility > threshold ||
          car.opacity <= 0
        ) {
          continue;
        }
        let points = projectCache.get(car.edge);
        if (!points) {
          const edge = graph.edges[car.edge];
          if (!edge) continue;
          const a = map.latLngToContainerPoint(
            graph.nodes[edge[0]]
          );
          const b = map.latLngToContainerPoint(
            graph.nodes[edge[1]]
          );
          points = [a.x, a.y, b.x, b.y];
          projectCache.set(car.edge, points);
        }
        const dx = points[2] - points[0];
        const dy = points[3] - points[1];
        const length = Math.hypot(dx, dy);
        if (length < 0.01) continue;
        // Posisi kendaraan di sisi kiri.
        const x =
          points[0] +
          dx * car.t +
          (dy / length) * laneGap;
        const y =
          points[1] +
          dy * car.t -
          (dx / length) * laneGap;
        if (
          x < -20 ||
          y < -20 ||
          x > size.x + 20 ||
          y > size.y + 20
        ) {
          continue;
        }
        ctx.save();
        ctx.globalAlpha = car.opacity;
        if (zoom <= 13) {
          /*
           * ZOOM OUT:
           * Mobil digambar sebagai titik kecil.
           * Tidak memakai sprite besar.
           */
          const radius =
            zoom <= 11 ? 0.8 :
            zoom <= 12 ? 1.05 : 1.35;
          ctx.fillStyle = car.color;
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 0.35;
          ctx.beginPath();
          ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        } else {
          /*
           * ZOOM DEKAT:
           * Gambar mobil sesuai arah jalan.
           */
          ctx.translate(x, y);
          ctx.rotate(Math.atan2(dy, dx));
          drawVehicle(ctx, car, scale);
        }
        ctx.restore();
        count++;
      }
      return count;
    }
    /*
     * LOOP ANIMASI
     *
     * TIME SCALE TETAP.
     * Zoom tidak mempercepat kendaraan.
     */
    function frame(now) {
      if (disposed) return;
      const dt =
        lastFrame == null
          ? 0
          : clamp(
              (now - lastFrame) / 1000,
              0,
              0.06
            );
      lastFrame = now;
      if (
        settingsRef.current.playing &&
        sceneRef.current.graph
      ) {
        let remaining = dt * SIMULATION_SPEED;
        while (remaining > 0.0001) {
          const step = Math.min(
            remaining,
            0.065
          );
          simulate(step);
          remaining -= step;
        }
      }
      const count = draw();
      if (now - lastCounter > 800) {
        lastCounter = now;
        setVisibleCount(count);
      }
      frameId = requestAnimationFrame(frame);
    }
    /*
     * ZOOM / PAN
     *
     * Jangan membuat ulang kendaraan.
     * Gambar ulang langsung sesuai zoom baru.
     */
    function viewportChanged() {
      resizeCanvas();
      paintHeat();
      draw();
    }
    map.on("zoomend moveend", viewportChanged);
    // Mendukung pembaruan saat interaksi zoom HP.
    map.on("zoom", draw);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        if (disposed) return;
        map.invalidateSize({ pan: false });
        viewportChanged();
      });
      observer.observe(mapElement.current);
    }
    resizeCanvas();
    /*
     * LOAD JARINGAN OSM
     *
     * Tetap otomatis, tidak perlu
     * menjalankan script Node khusus.
     */
    (async () => {
      try {
        const graph = await getDenpasarNetwork();
        if (disposed) return;
        if (
          graph?.format !== 1 ||
          !graph.nodes?.length ||
          !graph.edges?.length
        ) {
          throw new Error(
            "Format jaringan jalan tidak valid."
          );
        }
        const adjacency = Array.from(
          { length: graph.nodes.length },
          () => []
        );
        graph.edges.forEach((edge, i) => {
          adjacency[edge[0]].push(i);
        });
        sceneRef.current.graph = graph;
        sceneRef.current.adjacency = adjacency;
        // Kendaraan mengikuti bobot arus pada tiap ruas dalam graph.
        initializeCars(graph);
        // Zona berwarna menurut aktivitas perjalanan MAT. JANGAN dibaca sebagai
        // peta kemacetan aktual, sebab butuh kapasitas dan V/C per ruas.
        const insights = getZoneMatInsights(graph);
        if (insights) {
          const maxActivity = Math.max(1, insights.byActivity[0]?.activity || 1);
          const topOrigins = new Set(insights.byOrigin.slice(0, 2).map((z) => z.id));
          const topDestinations = new Set(insights.byDestination.slice(0, 2).map((z) => z.id));
          const group = L.layerGroup();
          insights.byActivity.forEach((z) => {
            const priorityOrigin = topOrigins.has(z.id);
            const priorityDestination = topDestinations.has(z.id);
            const color = priorityDestination ? "#2563eb" : priorityOrigin ? "#dc2626" : "#f59e0b";
            const radius = 9 + 20 * Math.sqrt(z.activity / maxActivity);
            L.circleMarker([z.lat, z.lng], {
              radius,
              color,
              weight: priorityOrigin || priorityDestination ? 2 : 1,
              opacity: 0.8,
              fillColor: color,
              fillOpacity: priorityOrigin || priorityDestination ? 0.15 : 0.07,
              interactive: true,
            })
              .bindTooltip(
                `<b>${z.id} · ${z.name}</b><br/>Bangkitan: ${formatNumber(z.out)} smp/jam` +
                `<br/>Tarikan: ${formatNumber(z.incoming)} smp/jam` +
                `<br/><small>Aktivitas MAT, bukan tingkat macet ruas</small>`,
                { sticky: true, opacity: 0.95 }
              )
              .addTo(group);
          });
          hotspotsRef.current = group;
          if (settingsRef.current.showHotspots) group.addTo(map);
        }
        for (const zone of graph.zones || []) {
          const marker = L.marker(
            [zone.lat, zone.lng],
            {
              icon: createZoneIcon(zone.id, false),
              title: `${zone.id} - ${zone.name}`,
            }
          ).addTo(map);
          marker.bindTooltip(
            `${zone.id} - ${zone.name}`
          );
          marker.on("click", () => {
            setOrigin(zone.id);
          });
          markersRef.current[zone.id] = marker;
        }
        setNetwork(graph);
        setLoading(false);
        setError("");
        map.fitBounds(
          graph.zones.map((z) => [z.lat, z.lng]),
          {
            padding: [35, 35],
            maxZoom: 12,
            animate: false,
          }
        );
        viewportChanged();
      } catch (err) {
        if (disposed) return;
        console.error("[Denpasar]", err);
        setError(
          "Jaringan jalan gagal dimuat: " +
          err.message
        );
        setLoading(false);
      }
    })();
    frameId = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }
      observer?.disconnect();
      map.off("zoomend moveend", viewportChanged);
      map.off("zoom", draw);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      hotspotsRef.current = null;
      odLineRef.current = null;
      redrawHeatRef.current = () => {};
      sceneRef.current = {
        graph: null,
        cars: [],
        adjacency: [],
        heatCanvas: null,
      };
    };
  }, []);
  /*
   * UPDATE HEATMAP TANPA RESET MOBIL
   */
  useEffect(() => {
    redrawHeatRef.current();
  }, [showHeat, scenario]);
  // Menampilkan/menyembunyikan indikator tekanan perjalanan per zona MAT.
  useEffect(() => {
    const map = mapRef.current;
    const circles = hotspotsRef.current;
    if (!map || !circles) return;
    if (showHotspots && !map.hasLayer(circles)) circles.addTo(map);
    if (!showHotspots && map.hasLayer(circles)) map.removeLayer(circles);
  }, [showHotspots, network]);
  /*
   * GARIS KEINGINAN PERJALANAN (DESIRE LINES), BUKAN RUTE JALAN.
   * Relasi terkuat ditarik dari MAT, tidak dipilih acak.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !network) return;
    if (odLineRef.current) {
      map.removeLayer(odLineRef.current);
      odLineRef.current = null;
    }
    for (const zone of network.zones) {
      markersRef.current[zone.id]?.setIcon(createZoneIcon(
        zone.id, zone.id === origin || zone.id === destination
      ));
    }
    if (!showOD) return;
    const group = L.layerGroup();
    const insights = getZoneMatInsights(network);
    const strongestPairs = insights?.odPairs.slice(0, 5) || [];
    const biggestOD = Math.max(1, strongestPairs[0]?.value || 1);
    for (const pair of strongestPairs) {
      const selected = pair.origin.id === origin && pair.destination.id === destination;
      L.polyline(
        [[pair.origin.lat, pair.origin.lng], [pair.destination.lat, pair.destination.lng]],
        {
          color: selected ? "#b91c1c" : "#f97316",
          weight: 1.5 + 4 * Math.sqrt(pair.value / biggestOD),
          opacity: selected ? 0.72 : 0.28,
          dashArray: selected ? "" : "5 10",
          interactive: true,
        }
      )
      .bindTooltip(`${pair.origin.id} → ${pair.destination.id}: ${formatNumber(pair.value)} smp/jam (MAT)`,
        { sticky: true })
      .addTo(group);
    }
    const a = network.zones.find((z) => z.id === origin);
    const b = network.zones.find((z) => z.id === destination);
    if (a && b) {
      L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
        color: "#b91c1c", weight: 3.5, opacity: 0.92,
        dashArray: "8 6", interactive: false,
      }).addTo(group);
    }
    group.addTo(map);
    odLineRef.current = group;
  }, [origin, destination, showOD, network]);
  /*
   * TOMBOL PETA
   */
  function showAllZones() {
    const map = mapRef.current;
    setMode("zones");
    if (!map || !network?.zones?.length) return;
    map.fitBounds(
      network.zones.map((z) => [z.lat, z.lng]),
      {
        padding: [35, 35],
        maxZoom: 12,
        animate: false,
      }
    );
  }
  function focusStreet() {
    setMode("street");
    mapRef.current?.setView(
      [-8.670, 115.216],
      16,
      { animate: false }
    );
  }
  function reset() {
    setDensity(DEFAULT_DENSITY);
    setScenario(initialScenario);
    setPlaying(true);
    setShowHeat(true);
    setShowHotspots(true);
    setShowOD(true);
    setOrigin("Z11");
    setDestination("Z03");
    showAllZones();
  }
  /*
   * DATA MAT
   */
  const zones = network?.zones || [];
  const insights = useMemo(() => getZoneMatInsights(network), [network]);
  const oi = zones.findIndex(
    (z) => z.id === origin
  );
  const di = zones.findIndex(
    (z) => z.id === destination
  );
  const od =
    oi >= 0 && di >= 0
      ? network.mat[oi][di]
      : null;
  const reduction =
    origin === "Z11" && destination === "Z03"
      ? 0.3
      : 0.12;
  const shownOD =
    od == null
      ? null
      : scenario === "after"
        ? od * (1 - reduction)
        : od;
  const afterTotal = network?.mat.reduce(
    (total, row, i) =>
      total +
      row.reduce(
        (sum, value, j) =>
          sum +
          value *
          (1 - (i === 10 && j === 2 ? 0.3 : 0.12)),
        0
      ),
    0
  );
  return (
    <div className="mx-auto w-full max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:rounded-3xl sm:p-3">
      <style>{`
        .dt-map {
          width: 100%;
          height: 100%;
          background: #edf1f4;
        }
        .dt-map .leaflet-control-attribution {
          font-size: 9px;
        }
        .dt-zone-icon {
          background: transparent !important;
          border: none !important;
        }
        .dt-zone-icon span {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #94a3b8;
          background: white;
          color: #334155;
          font-size: 9px;
          font-weight: 900;
          box-shadow: 0 2px 8px #0003;
        }
        .dt-zone-icon span.active {
          background: #b91c1c;
          color: white;
          border-color: white;
        }
        .dt-range {
          accent-color: #b91c1c;
        }
        @media (max-width: 639px) {
          .dt-zone-icon span {
            width: 27px;
            height: 27px;
            font-size: 8px;
          }
        }
      `}</style>
      {/* PETA */}
      <div className="relative h-[430px] overflow-hidden rounded-xl bg-slate-100 sm:h-[570px] sm:rounded-2xl lg:h-[660px]">
        <div
          ref={mapElement}
          className="dt-map absolute inset-0 z-0"
          aria-label="Peta mobilitas Denpasar"
        />
        <canvas
          ref={canvasElement}
          className="pointer-events-none absolute inset-0 z-[450]"
          aria-hidden="true"
        />
        {/* TOOLBAR */}
        <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center gap-1.5 rounded-xl bg-slate-900/95 p-1.5 text-white shadow-lg sm:left-4 sm:right-auto sm:top-4 sm:p-2">
          <button
            onClick={showAllZones}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold sm:flex-none sm:px-3 sm:text-xs ${
              mode === "zones"
                ? "bg-red-700"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <MapIcon size={14} />
            13 Zona
          </button>
          <button
            onClick={focusStreet}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold sm:flex-none sm:px-3 sm:text-xs ${
              mode === "street"
                ? "bg-red-700"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <CarFront size={14} />
            Fokus Jalan
          </button>
          <button
            onClick={() => setPlaying((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700"
            aria-label={playing ? "Jeda" : "Jalankan"}
          >
            {playing
              ? <Pause size={16} />
              : <Play size={16} />
            }
          </button>
          <button
            onClick={reset}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700"
            aria-label="Reset pengaturan"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        {/* ZOOM */}
        <div className="absolute right-2 top-[65px] z-[1000] flex flex-col gap-1.5 sm:right-4 sm:top-20">
          <button
            onClick={() =>
              mapRef.current?.zoomIn(0.5, {
                animate: false,
              })
            }
            className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-900 shadow-md"
            aria-label="Zoom in"
          >
            <Plus size={19} />
          </button>
          <button
            onClick={() =>
              mapRef.current?.zoomOut(0.5, {
                animate: false,
              })
            }
            className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-900 shadow-md"
            aria-label="Zoom out"
          >
            <Minus size={19} />
          </button>
        </div>
        {/* LOADING */}
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-[1100] grid place-items-center bg-slate-100/75 px-4">
            <div className="rounded-xl bg-white px-5 py-4 text-center text-sm font-semibold text-slate-800 shadow-lg">
              Memuat jaringan jalan Denpasar...
            </div>
          </div>
        )}
        {/* ERROR */}
        {error && (
          <div className="absolute bottom-14 left-2 right-2 z-[1100] rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-900 shadow sm:left-4 sm:right-auto sm:max-w-lg">
            <Info size={14} className="mr-1 inline" />
            {error}
          </div>
        )}
        {/* INFO KENDARAAN */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-[900] rounded-lg bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-800 shadow sm:bottom-4 sm:left-4 sm:text-xs">
          {formatNumber(visibleCount)} kendaraan terlihat
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-[900] hidden rounded-lg bg-white/95 px-3 py-2 text-[10px] font-semibold text-slate-700 shadow sm:block">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600"/> Asal dominan (MAT)</div>
          <div className="mt-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600"/> Tujuan dominan (MAT)</div>
          <div className="mt-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"/> Zona lainnya</div>
        </div>
      </div>
      {/* PANEL RESPONSIVE */}
      <div className="grid gap-5 p-3 sm:p-5 lg:grid-cols-3">
        {/* PENGATURAN */}
        <section className="min-w-0 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <SlidersHorizontal size={17} />
            Pengaturan Lalu Lintas
          </h3>
          {showScenarioControls && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScenario("before")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  scenario === "before"
                    ? "bg-red-700 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Before TDM
              </button>
              <button
                onClick={() => setScenario("after")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  scenario === "after"
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                After TDM
              </button>
            </div>
          )}
          <label className="block text-xs font-semibold text-slate-700">
            Kepadatan visual: {density.toFixed(2)}×
            <input
              type="range"
              min="0.4"
              max="1.6"
              step="0.05"
              value={density}
              onChange={(e) =>
                setDensity(Number(e.target.value))
              }
              className="dt-range mt-2 block w-full"
            />
          </label>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHeat}
                onChange={(e) =>
                  setShowHeat(e.target.checked)
                }
              />
              Intensitas Ruas (Model)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOD}
                onChange={(e) =>
                  setShowOD(e.target.checked)
                }
              />
              Garis OD Terbesar
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
              />
              Tekanan MAT per Zona
            </label>
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            Warna dan kepadatan kendaraan menggambarkan <b>indikasi arus model</b>.
            Titik besar menunjukkan besarnya aktivitas perjalanan (MAT), bukan
            kemacetan terukur atau V/C jalan.
          </p>
        </section>
        {/* ZONA */}
        <section className="min-w-0 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Network size={17} />
            Matriks Asal Tujuan
          </h3>
          <label className="block text-xs font-medium text-slate-700">
            Zona Asal
            <select
              value={origin}
              onChange={(e) =>
                setOrigin(e.target.value)
              }
              className="mt-1 block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id} - {z.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Zona Tujuan
            <select
              value={destination}
              onChange={(e) =>
                setDestination(e.target.value)
              }
              className="mt-1 block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id} - {z.name}
                </option>
              ))}
            </select>
          </label>
        </section>
        {/* SOROTAN MAT — RINGKAS, TANPA KARTU RANKING */}
        {insights && insights.byOrigin.length > 0 && insights.byDestination.length > 0 && insights.odPairs.length > 0 && (
          <section className="min-w-0 border-y border-slate-200 py-4 lg:col-span-3 sm:py-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Sorotan pergerakan · MAT 2026
              </h3>
              <span className="text-[11px] text-slate-500">smp/jam · berdasarkan ToR</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 sm:gap-0">
              <button
                type="button"
                onClick={() => {
                  const z = insights.byOrigin[0];
                  setOrigin(z.id);
                  setShowOD(true);
                  mapRef.current?.setView([z.lat, z.lng], 13.5, { animate: false });
                }}
                className="group min-w-0 text-left sm:border-r sm:border-slate-200 sm:pr-5"
                title="Fokus zona asal terbesar pada peta"
              >
                <span className="block text-[11px] text-slate-500">Asal terbesar</span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <strong className="text-xl font-bold tabular-nums tracking-tight text-slate-900 group-hover:text-[#B91C1C]">
                    {insights.byOrigin[0].id}
                  </strong>
                  <span className="text-xs text-slate-600">{formatNumber(insights.byOrigin[0].out)} smp/jam</span>
                </span>
                <span className="mt-1 block truncate text-[11px] text-slate-500">
                  {insights.byOrigin[0].name}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const z = insights.byDestination[0];
                  setDestination(z.id);
                  setShowOD(true);
                  mapRef.current?.setView([z.lat, z.lng], 13.5, { animate: false });
                }}
                className="group min-w-0 text-left sm:border-r sm:border-slate-200 sm:px-5"
                title="Fokus zona tujuan terbesar pada peta"
              >
                <span className="block text-[11px] text-slate-500">Tujuan terbesar</span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <strong className="text-xl font-bold tabular-nums tracking-tight text-slate-900 group-hover:text-[#B91C1C]">
                    {insights.byDestination[0].id}
                  </strong>
                  <span className="text-xs text-slate-600">{formatNumber(insights.byDestination[0].incoming)} smp/jam</span>
                </span>
                <span className="mt-1 block truncate text-[11px] text-slate-500">
                  {insights.byDestination[0].name}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pair = insights.odPairs[0];
                  setOrigin(pair.origin.id);
                  setDestination(pair.destination.id);
                  setShowOD(true);
                  mapRef.current?.fitBounds([
                    [pair.origin.lat, pair.origin.lng],
                    [pair.destination.lat, pair.destination.lng],
                  ], { padding: [60, 60], maxZoom: 13, animate: false });
                }}
                className="group min-w-0 text-left sm:pl-5"
                title="Sorot hubungan OD terkuat pada peta"
              >
                <span className="block text-[11px] text-slate-500">Hubungan OD utama</span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <strong className="text-xl font-bold tabular-nums tracking-tight text-slate-900 group-hover:text-[#B91C1C]">
                    {insights.odPairs[0].origin.id} → {insights.odPairs[0].destination.id}
                  </strong>
                  <span className="text-xs text-slate-600">{formatNumber(insights.odPairs[0].value)} smp/jam</span>
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  Klik untuk menyorot hubungan perjalanan
                </span>
              </button>
            </div>

            <p className="mt-4 text-[11px] leading-5 text-slate-500">
              Angka menunjukkan bangkitan, tarikan, dan hubungan perjalanan MAT; bukan tingkat kemacetan ruas jalan.
            </p>
          </section>
        )}
        {/* STATISTIK */}
        <section className="min-w-0 rounded-xl bg-slate-50 p-4 sm:rounded-2xl sm:p-5">
          <p className="text-xs font-bold text-slate-600">
            {scenario === "after"
              ? "MAT SETELAH TDM - ASUMSI"
              : "TOTAL MAT 2026 (INPUT TOR)"}
          </p>
          <p className="mt-2 break-words text-2xl font-black text-slate-900">
            {network
              ? formatNumber(
                  scenario === "after"
                    ? afterTotal
                    : network.metadata.matTotal
                )
              : "-"}
            <span className="ml-2 text-xs font-normal">
              smp/jam
            </span>
          </p>
          <p className="mt-4 text-xs font-bold text-red-700">
            OD {origin} → {destination}
          </p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {shownOD == null
              ? "-"
              : formatNumber(shownOD)}
            <span className="text-xs font-normal">
              {" "}smp/jam
            </span>
          </p>
          {scenario === "after" && (
            <p className="mt-2 text-[11px] leading-5 text-amber-800">
              Skenario ilustratif: pengurangan 30% pada OD Z11 → Z03
              dan 12% pada OD lainnya. Angka ini asumsi demo, bukan hasil
              perhitungan dampak TDM atau proyeksi resmi 2041.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
