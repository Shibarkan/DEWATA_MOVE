
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Map as MapIcon,
  CarFront,
  Network,
  RotateCcw,
  RefreshCw,
  Play,
  Pause,
  Plus,
  Minus,
  Layers,
  Satellite,
  SlidersHorizontal,
  Info,
} from "lucide-react";

import { getDenpasarNetwork } from "../../data/denpasarNetworkBrowser";

/*
 * DEWATAMOVE 2041 — UPDATED MAP PREVIEW
 *
 * Peta jalan:
 *   OpenStreetMap, berdasarkan data yang tersedia.
 *
 * Peta satelit:
 *   MapTiler, membutuhkan VITE_MAPTILER_KEY.
 *
 * Jaringan kendaraan:
 *   OpenStreetMap / Overpass.
 *
 * Tanggal snapshot OSM diambil dari metadata
 * jaringan, bukan tanggal yang dikarang.
 *
 * Simulasi kendaraan tetap ilustratif.
 */

const CITY = [-8.673, 115.216];

const DEFAULT_DENSITY = 0.85;
const MAX_DENSITY = 1.6;
const MAX_VEHICLES = 1900;
const SIM_SPEED = 2.6;

const MAPTILER_KEY =
  import.meta.env.VITE_MAPTILER_KEY || "";

const OSM_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const SATELLITE_URL =
  "https://api.maptiler.com/tiles/satellite-v4/{z}/{x}/{y}?key=" +
  encodeURIComponent(MAPTILER_KEY);

const SPEEDS = [50, 45, 38, 32, 28, 23, 18, 12, 8];

const DENSITIES = [
  9, 12, 18, 13, 8.5, 5.5, 2.4, 1, 0.35,
];

const COLORS = [
  "#f8fafc",
  "#e2e8f0",
  "#334155",
  "#64748b",
  "#b91c1c",
  "#2563eb",
  "#0f766e",
  "#d9a024",
];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const fmt = (value) =>
  Math.round(value || 0).toLocaleString("id-ID");

function hash(number) {
  let x = Math.floor(number) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);

  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function zoneIcon(id, active) {
  return L.divIcon({
    className: "dm-zone-icon",
    html: `
      <span class="${active ? "active" : ""}">
        ${id}
      </span>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/*
 * Ukuran kendaraan semakin kecil saat zoom out.
 */
function vehicleScale(zoom) {
  return clamp(
    Math.pow(2, (zoom - 16) * 0.38) * 0.7,
    0.16,
    1.25
  );
}

function drawVehicle(ctx, car, scale) {
  const s = scale;

  if (car.type === "motor") {
    ctx.fillStyle = "#17202e";
    ctx.fillRect(-5 * s, -1.4 * s, 10 * s, 2.8 * s);

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
    ctx.fillRect(-6 * s, -2.4 * s, 12 * s, 4 * s);

    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(-9 * s, 2 * s, 18 * s, 1 * s);
    return;
  }

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-7 * s, -3.2 * s, 14 * s, 6.4 * s);

  ctx.fillStyle = car.color;
  ctx.fillRect(-6.3 * s, -2.7 * s, 12.6 * s, 5.4 * s);

  ctx.fillStyle = "#9bc5d8";
  ctx.fillRect(1.6 * s, -2.1 * s, 2.5 * s, 4.2 * s);
}

function makeCar(edgeId, index, count, edge) {
  const seed = edgeId * 997 + index * 73;
  const roadType = clamp(edge[3] | 0, 0, 8);
  const random = hash(seed);

  const type =
    random < 0.67
      ? "motor"
      : random < (roadType <= 4 ? 0.96 : 1)
        ? "car"
        : "bus";

  const modeFactor =
    type === "motor" ? 1.07 :
    type === "bus" ? 0.8 : 1;

  const desiredSpeed =
    (SPEEDS[roadType] / 3.6) *
    (0.82 + hash(seed + 13) * 0.35) *
    modeFactor;

  return {
    edge: edgeId,
    t: (index + 0.5) / count,
    type,
    color:
      COLORS[Math.floor(hash(seed + 3) * COLORS.length)],
    length:
      type === "motor" ? 2 :
      type === "bus" ? 10 : 4.5,
    desiredSpeed,
    speed: desiredSpeed * 0.8,
    minGap: 2 + hash(seed + 38) * 2,
    visibility: hash(seed + 823),
    seed,
    state: "driving",
    opacity: 1,
  };
}

function edgeAngle(graph, edge) {
  const a = graph.nodes[edge[0]];
  const b = graph.nodes[edge[1]];

  const cosine = Math.cos(
    ((a[0] + b[0]) * Math.PI) / 360
  );

  return Math.atan2(
    b[0] - a[0],
    (b[1] - a[1]) * cosine
  );
}

/*
 * Pilih ruas yang memang terhubung.
 * Prioritaskan arah lurus.
 */
function nextRoad(car, current, graph, adjacency, flowKey) {
  const outgoing = adjacency[current[1]] || [];

  if (!outgoing.length) return null;

  const noTurnBack = outgoing.filter(
    (index) => graph.edges[index][1] !== current[0]
  );

  const choices = noTurnBack.length
    ? noTurnBack
    : outgoing;

  const oldAngle = edgeAngle(graph, current);

  const p95 = Math.max(
    1,
    graph.metadata?.visualP95 || 1
  );

  let sum = 0;

  const weighted = choices.map((index) => {
    const edge = graph.edges[index];
    const angle = edgeAngle(graph, edge);

    const turn = Math.abs(
      Math.atan2(
        Math.sin(angle - oldAngle),
        Math.cos(angle - oldAngle)
      )
    );

    const direction =
      turn < 0.45 ? 3 :
      turn < 1.3 ? 1.5 : 0.65;

    const flow = Math.max(0, edge[flowKey] || 0);

    sum += direction *
      (0.8 + Math.min(1, Math.sqrt(flow / p95) * 0.6));

    return [index, sum];
  });

  car.seed += 37;

  const roll = hash(car.seed) * sum;

  return (
    weighted.find((item) => roll <= item[1])?.[0] ??
    weighted[weighted.length - 1][0]
  );
}

function formatSnapshot(value) {
  if (!value) return "Belum tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Belum tersedia";
  }

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  }) + " WITA";
}

export default function SimulationPreview({
  initialScenario = "before",
  showScenarioControls = false,
}) {
  const mapDiv = useRef(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);

  const markersRef = useRef({});
  const odRef = useRef(null);
  const heatRefreshRef = useRef(() => {});

  const simulationRef = useRef({
    graph: null,
    cars: [],
    adjacency: [],
    spawnEdges: [],
    heat: null,
  });

  const settingsRef = useRef({});

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [basemap, setBasemap] = useState("jalan");
  const [scenario, setScenario] = useState(initialScenario);
  const [density, setDensity] = useState(DEFAULT_DENSITY);

  const [playing, setPlaying] = useState(true);
  const [showHeat, setShowHeat] = useState(false);
  const [showOD, setShowOD] = useState(false);

  const [mode, setMode] = useState("zones");
  const [origin, setOrigin] = useState("Z11");
  const [destination, setDestination] = useState("Z03");
  const [visibleCount, setVisibleCount] = useState(0);

  settingsRef.current = {
    scenario,
    density,
    playing,
    showHeat,
  };

  useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);

  /*
   * INISIALISASI LEAFLET
   */
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return;

    let disposed = false;
    let observer = null;
    let frameId = null;
    let lastFrame = null;
    let lastCount = 0;

    const map = L.map(mapDiv.current, {
      center: CITY,
      zoom: 12,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false,
      scrollWheelZoom: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      preferCanvas: true,
    });

    mapRef.current = map;

    function resizeCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

      const w = Math.max(1, Math.round(size.x * dpr));
      const h = Math.max(1, Math.round(size.y * dpr));

      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }

    /*
     * GAMBAR HEATMAP BERDASARKAN MAT
     */
    function buildHeat() {
      const graph = simulationRef.current.graph;

      if (!graph || !settingsRef.current.showHeat) {
        simulationRef.current.heat = null;
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

      const bounds = map.getBounds().pad(0.1);
      const flowKey =
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

        const flow = Math.max(0, edge[flowKey] || 0);
        if (!flow) continue;

        const strength = Math.sqrt(
          clamp(flow / p95, 0, 3)
        );

        const p = map.latLngToContainerPoint(a);
        const q = map.latLngToContainerPoint(b);

        ctx.strokeStyle =
          strength > 1
            ? "rgba(185,28,28,.55)"
            : strength > 0.45
              ? "rgba(234,117,31,.40)"
              : "rgba(234,179,8,.25)";

        ctx.lineWidth = clamp(
          1 + strength * 2.3, 1, 5
        );

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      simulationRef.current.heat = off;
    }

    heatRefreshRef.current = buildHeat;

    /*
     * MEMBUAT KENDARAAN HANYA SEKALI
     */
    function initializeCars(graph) {
      const p95 = Math.max(
        1,
        graph.metadata?.visualP95 || 1
      );

      const plans = [];
      let total = 0;

      graph.edges.forEach((edge, index) => {
        if (edge[2] < 7) return;

        const type = clamp(edge[3] | 0, 0, 8);
        const flow = Math.max(0, edge[4] || 0);

        const intensity = Math.sqrt(
          clamp(flow / p95, 0, 4)
        );

        const demand =
          (edge[2] / 1000) *
          DENSITIES[type] *
          (0.45 + Math.min(1.7, intensity * 0.9)) *
          MAX_DENSITY;

        const cap = Math.max(
          1,
          Math.floor(edge[2] / (type <= 3 ? 16 : 23))
        );

        const expected = Math.min(demand, cap);

        if (expected > 0) {
          plans.push([index, expected]);
          total += expected;
        }
      });

      const factor = Math.min(
        1,
        MAX_VEHICLES / Math.max(total, 1)
      );

      const cars = [];

      for (const [index, expected] of plans) {
        const amount = expected * factor;

        const count =
          Math.floor(amount) +
          (hash(index * 31 + 9) < amount % 1 ? 1 : 0);

        for (let i = 0; i < count; i++) {
          cars.push(
            makeCar(index, i, count, graph.edges[index])
          );
        }
      }

      simulationRef.current.cars =
        cars.length <= MAX_VEHICLES
          ? cars
          : Array.from(
              { length: MAX_VEHICLES },
              (_, i) =>
                cars[Math.floor(i * cars.length / MAX_VEHICLES)]
            );

      simulationRef.current.spawnEdges =
        plans.map(([index]) => index);
    }

    /*
     * PERGERAKAN DAN PERILAKU KENDARAAN
     */
    function simulate(dt) {
      const scene = simulationRef.current;
      const graph = scene.graph;

      if (!graph || dt <= 0) return;

      const flowKey =
        settingsRef.current.scenario === "after" ? 5 : 4;

      const groups = new Map();

      for (const car of scene.cars) {
        if (car.state !== "driving") continue;

        if (!groups.has(car.edge)) {
          groups.set(car.edge, []);
        }

        groups.get(car.edge).push({
          car,
          t: car.t,
        });
      }

      for (const group of groups.values()) {
        group.sort((a, b) => b.t - a.t);
      }

      for (const group of groups.values()) {
        for (let i = 0; i < group.length; i++) {
          const car = group[i].car;
          let edge = graph.edges[car.edge];

          if (!edge) continue;

          const length = Math.max(edge[2], 0.5);
          let target = car.desiredSpeed;

          // Mengikuti kendaraan di depan.
          if (i > 0) {
            const leader = group[i - 1];

            const gap =
              (leader.t - group[i].t) * length -
              leader.car.length -
              car.minGap;

            const safeSpeed = Math.sqrt(
              Math.max(0, 5 * gap)
            );

            target = Math.min(target, safeSpeed);
          }

          // Perlambatan ringan di persimpangan.
          const toEnd = (1 - car.t) * length;
          const exits = scene.adjacency[edge[1]] || [];

          if (exits.length > 2 && toEnd < 18) {
            target = Math.min(
              target,
              7 + (toEnd / 18) * 5
            );
          }

          const acceleration = clamp(
            (target - car.speed) * 1.8,
            -4,
            2.4
          );

          car.speed = clamp(
            car.speed + acceleration * dt,
            0,
            car.desiredSpeed
          );

          let travel = car.speed * dt;

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

            const next = nextRoad(
              car,
              edge,
              graph,
              scene.adjacency,
              flowKey
            );

            if (next == null) {
              car.t = 0.9999;
              car.speed = 0;
              car.state = "exiting";
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
       * Perjalanan yang selesai memudar.
       * Perjalanan baru muncul dengan fade-in
       * setelah kendaraan lama tidak terlihat.
       */
      for (const car of scene.cars) {
        if (car.state === "exiting") {
          car.opacity = Math.max(0, car.opacity - dt * 1.3);

          if (car.opacity === 0 && scene.spawnEdges.length) {
            car.seed += 163;

            const index = Math.floor(
              hash(car.seed) * scene.spawnEdges.length
            );

            car.edge = scene.spawnEdges[index];
            car.t = 0.01;
            car.speed = car.desiredSpeed * 0.6;
            car.state = "entering";
          }
        } else if (car.state === "entering") {
          car.opacity = Math.min(1, car.opacity + dt * 0.8);

          if (car.opacity >= 1) {
            car.state = "driving";
          }
        }
      }
    }

    /*
     * GAMBAR MOBIL SESUAI ZOOM.
     *
     * Tidak ada reset mobil saat zoom/pan.
     */
    function drawCars() {
      const scene = simulationRef.current;
      const graph = scene.graph;
      const canvas = canvasRef.current;

      if (!graph || !canvas) return 0;

      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;

      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);

      if (settingsRef.current.showHeat && scene.heat) {
        ctx.drawImage(scene.heat, 0, 0, size.x, size.y);
      }

      const zoom = map.getZoom();
      const scale = vehicleScale(zoom);

      const laneGap = clamp(
        (zoom - 13) * 1.25,
        0,
        6
      );

      const threshold =
        settingsRef.current.density / MAX_DENSITY;

      const projections = new Map();

      let visible = 0;

      for (const car of scene.cars) {
        if (
          car.visibility > threshold ||
          car.opacity <= 0
        ) {
          continue;
        }

        let line = projections.get(car.edge);

        if (!line) {
          const edge = graph.edges[car.edge];
          if (!edge) continue;

          const a = map.latLngToContainerPoint(
            graph.nodes[edge[0]]
          );

          const b = map.latLngToContainerPoint(
            graph.nodes[edge[1]]
          );

          line = [a.x, a.y, b.x, b.y];

          projections.set(car.edge, line);
        }

        const dx = line[2] - line[0];
        const dy = line[3] - line[1];
        const length = Math.hypot(dx, dy);

        if (length < 0.01) continue;

        // Posisi relatif sisi kiri jalan Indonesia.
        const x =
          line[0] +
          dx * car.t +
          (dy / length) * laneGap;

        const y =
          line[1] +
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
          const radius = clamp(
            0.75 + (zoom - 11) * 0.22,
            0.6,
            1.3
          );

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = car.color;
          ctx.fill();
        } else {
          ctx.translate(x, y);
          ctx.rotate(Math.atan2(dy, dx));
          drawVehicle(ctx, car, scale);
        }

        ctx.restore();
        visible++;
      }

      return visible;
    }

    /*
     * FRAME ANIMASI
     */
    function frame(now) {
      if (disposed) return;

      const dt =
        lastFrame == null
          ? 0
          : clamp((now - lastFrame) / 1000, 0, 0.06);

      lastFrame = now;

      if (
        settingsRef.current.playing &&
        simulationRef.current.graph
      ) {
        let remaining = dt * SIM_SPEED;

        while (remaining > 0.0001) {
          const step = Math.min(remaining, 0.065);
          simulate(step);
          remaining -= step;
        }
      }

      const count = drawCars();

      if (now - lastCount > 800) {
        lastCount = now;
        setVisibleCount(count);
      }

      frameId = requestAnimationFrame(frame);
    }

    function viewportChanged() {
      resizeCanvas();
      buildHeat();
      drawCars();
    }

    map.on("moveend zoomend", viewportChanged);

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        if (disposed) return;

        map.invalidateSize({ pan: false });
        viewportChanged();
      });

      observer.observe(mapDiv.current);
    }

    resizeCanvas();

    /*
     * AMBIL JARINGAN OSM
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
          throw new Error("Format jaringan jalan tidak valid.");
        }

        const adjacency = Array.from(
          { length: graph.nodes.length },
          () => []
        );

        graph.edges.forEach((edge, index) => {
          adjacency[edge[0]].push(index);
        });

        simulationRef.current.graph = graph;
        simulationRef.current.adjacency = adjacency;

        initializeCars(graph);

        for (const zone of graph.zones || []) {
          const marker = L.marker(
            [zone.lat, zone.lng],
            {
              icon: zoneIcon(zone.id, false),
              title: `${zone.id} — ${zone.name}`,
            }
          ).addTo(map);

          marker.bindTooltip(
            `${zone.id} — ${zone.name}`
          );

          marker.on("click", () => setOrigin(zone.id));
          markersRef.current[zone.id] = marker;
        }

        setNetwork(graph);
        setLoading(false);
        setError("");

        if (graph.zones?.length) {
          map.fitBounds(
            graph.zones.map((zone) => [
              zone.lat,
              zone.lng,
            ]),
            {
              padding: [35, 35],
              maxZoom: 12,
              animate: false,
            }
          );
        }

        viewportChanged();
      } catch (err) {
        if (disposed) return;

        setError(
          "Gagal memuat jaringan jalan: " + err.message
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
      map.off("moveend zoomend", viewportChanged);
      map.remove();

      mapRef.current = null;
      baseLayerRef.current = null;
      markersRef.current = {};
      odRef.current = null;
      heatRefreshRef.current = () => {};

      simulationRef.current = {
        graph: null,
        cars: [],
        adjacency: [],
        spawnEdges: [],
        heat: null,
      };
    };
  }, []);

  /*
   * PILIH LAPISAN PETA.
   *
   * Jalan dan Kontras menggunakan tile OSM.
   * Kontras hanya mengubah tampilannya.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const satellite = basemap === "satelit" && MAPTILER_KEY;

    const newLayer = L.tileLayer(
      satellite ? SATELLITE_URL : OSM_URL,
      {
        maxZoom: 19,
        attribution: satellite
          ? '&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    newLayer.addTo(map);

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    baseLayerRef.current = newLayer;

    newLayer.bringToBack();
  }, [basemap]);

  /*
   * PERBARUI HEATMAP SAJA.
   */
  useEffect(() => {
    heatRefreshRef.current();
  }, [showHeat, scenario]);

  /*
   * MARKER DAN GARIS OD.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !network) return;

    if (odRef.current) {
      map.removeLayer(odRef.current);
      odRef.current = null;
    }

    for (const zone of network.zones) {
      markersRef.current[zone.id]?.setIcon(
        zoneIcon(
          zone.id,
          zone.id === origin ||
          zone.id === destination
        )
      );
    }

    if (!showOD) return;

    const a = network.zones.find(
      (zone) => zone.id === origin
    );

    const b = network.zones.find(
      (zone) => zone.id === destination
    );

    if (a && b) {
      odRef.current = L.polyline(
        [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        {
          color: "#b91c1c",
          weight: 3,
          opacity: 0.85,
          dashArray: "6 8",
        }
      ).addTo(map);
    }
  }, [network, origin, destination, showOD]);

  /*
   * HAPUS CACHE JARINGAN DAN AMBIL ULANG.
   *
   * Reload diperlukan untuk mereset singleton
   * getDenpasarNetwork pada modul browser.
   */
  async function refreshRoadNetwork() {
    try {
      setNotice("Memperbarui jaringan OSM...");

      if (typeof caches !== "undefined") {
        const cache = await caches.open(
          "denpasar-network-v1"
        );

        const key = new URL(
          "/denpasar-road-graph-v1.json",
          window.location.origin
        ).href;

        await cache.delete(key);
      }

      window.location.reload();
    } catch {
      setNotice(
        "Cache tidak dapat dihapus. Periksa pengaturan browser."
      );
    }
  }

  function chooseBasemap(value) {
    if (value === "satelit" && !MAPTILER_KEY) {
      setNotice(
        "Mode satelit memerlukan VITE_MAPTILER_KEY. " +
        "Mode peta jalan OSM tetap bisa digunakan tanpa key."
      );
      return;
    }

    setNotice("");
    setBasemap(value);
  }

  function showZones() {
    setMode("zones");

    if (!network?.zones?.length) return;

    mapRef.current?.fitBounds(
      network.zones.map((zone) => [
        zone.lat,
        zone.lng,
      ]),
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
    setShowHeat(false);
    setShowOD(false);
    setOrigin("Z11");
    setDestination("Z03");
    showZones();
  }

  const zones = network?.zones || [];

  const oi = zones.findIndex(
    (zone) => zone.id === origin
  );

  const di = zones.findIndex(
    (zone) => zone.id === destination
  );

  const selectedOD =
    oi >= 0 && di >= 0
      ? network.mat[oi][di]
      : null;

  const reduction =
    origin === "Z11" && destination === "Z03"
      ? 0.3
      : 0.12;

  const shownOD =
    selectedOD == null
      ? null
      : scenario === "after"
        ? selectedOD * (1 - reduction)
        : selectedOD;

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
    <div className="mx-auto w-full max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:p-3">

      <style>{`
        .dm-map {
          height: 100%;
          width: 100%;
          background: #edf1f4;
        }

        .dm-map.map-contrast .leaflet-tile-pane img {
          filter:
            grayscale(0.85)
            brightness(1.1)
            contrast(0.92);
        }

        .dm-zone-icon {
          border: none !important;
          background: transparent !important;
        }

        .dm-zone-icon span {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 32px;
          height: 32px;
          border: 2px solid #94a3b8;
          border-radius: 50%;
          background: white;
          color: #334155;
          font-size: 9px;
          font-weight: 900;
          box-shadow: 0 2px 8px #0003;
        }

        .dm-zone-icon span.active {
          background: #b91c1c;
          color: white;
          border-color: white;
        }

        .dm-map .leaflet-control-attribution {
          font-size: 9px;
        }
      `}</style>

      {/* PETA */}

      <div className="relative h-[440px] overflow-hidden rounded-xl bg-slate-100 sm:h-[570px] lg:h-[660px]">

        <div
          ref={mapDiv}
          className={`dm-map absolute inset-0 z-0 ${
            basemap === "kontras" ? "map-contrast" : ""
          }`}
          aria-label="Peta jaringan jalan Denpasar"
        />

        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-[450]"
          aria-hidden="true"
        />

        {/* TOOLBAR UTAMA */}

        <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center gap-1 rounded-xl bg-slate-900/95 p-1.5 text-white shadow-lg sm:left-4 sm:right-auto sm:top-4 sm:gap-2">

          <button
            onClick={showZones}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold sm:flex-none sm:px-3 sm:text-xs ${
              mode === "zones" ? "bg-red-700" : "bg-slate-700"
            }`}
          >
            <MapIcon size={14} />
            13 Zona
          </button>

          <button
            onClick={focusStreet}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold sm:flex-none sm:px-3 sm:text-xs ${
              mode === "street" ? "bg-red-700" : "bg-slate-700"
            }`}
          >
            <CarFront size={14} />
            Fokus Jalan
          </button>

          <button
            onClick={() => setPlaying((v) => !v)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-700"
            aria-label={playing ? "Jeda" : "Jalankan"}
          >
            {playing
              ? <Pause size={16} />
              : <Play size={16} />}
          </button>

          <button
            onClick={reset}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-700"
            aria-label="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* PILIHAN BASEMAP */}

        <div className="absolute left-2 right-14 top-[60px] z-[1000] flex max-w-max flex-wrap gap-1 rounded-xl bg-white/95 p-1.5 shadow-lg sm:left-4 sm:top-[66px]">

          <button
            onClick={() => chooseBasemap("jalan")}
            className={`rounded-lg px-3 py-2 text-[11px] font-bold ${
              basemap === "jalan"
                ? "bg-red-700 text-white"
                : "text-slate-600"
            }`}
          >
            <Layers size={13} className="mr-1 inline" />
            Jalan
          </button>

          <button
            onClick={() => chooseBasemap("kontras")}
            className={`rounded-lg px-3 py-2 text-[11px] font-bold ${
              basemap === "kontras"
                ? "bg-red-700 text-white"
                : "text-slate-600"
            }`}
          >
            Kontras
          </button>

          <button
            onClick={() => chooseBasemap("satelit")}
            className={`rounded-lg px-3 py-2 text-[11px] font-bold ${
              basemap === "satelit"
                ? "bg-red-700 text-white"
                : "text-slate-600"
            }`}
          >
            <Satellite size={13} className="mr-1 inline" />
            Satelit
          </button>
        </div>

        {/* ZOOM */}

        <div className="absolute right-2 top-[60px] z-[1000] flex flex-col gap-1.5 sm:right-4 sm:top-4">

          <button
            onClick={() => mapRef.current?.zoomIn(0.5)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-md"
            aria-label="Zoom In"
          >
            <Plus size={18} />
          </button>

          <button
            onClick={() => mapRef.current?.zoomOut(0.5)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-md"
            aria-label="Zoom Out"
          >
            <Minus size={18} />
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="pointer-events-none absolute inset-0 z-[1100] grid place-items-center bg-slate-100/75 px-4">
            <div className="rounded-xl bg-white px-5 py-4 text-center text-sm font-semibold shadow">
              Memuat jaringan jalan Denpasar...
            </div>
          </div>
        )}

        {/* ERROR */}

        {(error || notice) && (
          <div className="absolute bottom-20 left-2 right-2 z-[1100] rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-900 shadow sm:left-4 sm:right-auto sm:max-w-md">
            <Info size={14} className="mr-1 inline" />
            {error || notice}
          </div>
        )}

        {/* INFO PETA */}

        <div className="pointer-events-none absolute bottom-2 left-2 z-[900] rounded-lg bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-800 shadow sm:bottom-4 sm:left-4">
          {fmt(visibleCount)} kendaraan terlihat
        </div>

      </div>

      {/* PANEL INFORMASI */}

      <div className="grid gap-5 p-3 sm:p-5 lg:grid-cols-3">

        <section className="min-w-0 space-y-3">

          <h3 className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal size={17} />
            Pengaturan Lalu Lintas
          </h3>

          {showScenarioControls && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScenario("before")}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  scenario === "before"
                    ? "bg-red-700 text-white"
                    : "bg-slate-100"
                }`}
              >
                Before TDM
              </button>

              <button
                onClick={() => setScenario("after")}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  scenario === "after"
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100"
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
              className="mt-2 block w-full accent-red-700"
            />
          </label>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHeat}
                onChange={(e) =>
                  setShowHeat(e.target.checked)
                }
              />
              Heat Jalan
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOD}
                onChange={(e) =>
                  setShowOD(e.target.checked)
                }
              />
              Garis OD
            </label>
          </div>

        </section>

        <section className="min-w-0 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Network size={17} />
            Matriks Asal Tujuan
          </h3>

          <label className="block text-xs">
            Zona Asal
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id} — {zone.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            Zona Tujuan
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id} — {zone.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-5">

          <p className="text-xs font-bold text-slate-600">
            {scenario === "after"
              ? "MAT SETELAH TDM — ASUMSI"
              : "TOTAL MAT 2026"}
          </p>

          <p className="mt-2 text-2xl font-black">
            {network
              ? fmt(
                  scenario === "after"
                    ? afterTotal
                    : network.metadata.matTotal
                )
              : "—"}
            <span className="ml-2 text-xs font-normal">
              smp/jam
            </span>
          </p>

          <p className="mt-4 text-xs font-bold text-red-700">
            OD {origin} → {destination}
          </p>

          <p className="mt-1 text-lg font-black">
            {shownOD == null ? "—" : fmt(shownOD)}
            <span className="ml-1 text-xs font-normal">
              smp/jam
            </span>
          </p>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-xs font-bold text-slate-700">
              Data Jaringan OpenStreetMap
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Snapshot dataset:
              {" "}
              {formatSnapshot(network?.metadata?.snapshot)}
            </p>

            <button
              type="button"
              onClick={refreshRoadNetwork}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
            >
              <RefreshCw size={14} />
              Perbarui Data Jalan
            </button>
          </div>

        </section>

      </div>
    </div>
  );
}
