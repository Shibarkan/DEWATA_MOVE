
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Map as MapIcon,
  CarFront,
  BusFront,
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

import {
  addTmdNetworkLayer,
  TMD_BOUNDS,
  TMD_CORRIDORS,
} from "../../data/tmdNetwork";

// ======================================================
// DEWATAMOVE 2041
// SIMULATION PREVIEW — HOME
//
// - Leaflet + OpenStreetMap
// - Jaringan Trans Metro Dewata
// - Animasi kendaraan berbasis jaringan jalan
// - MAT 13 zona
// - Garis OD
// - Visualisasi intensitas arus
// - Mode Jaringan TMD saja
// - Responsif dengan Tailwind
//
// Posisi bus TMD merupakan simulasi, bukan GPS aktual.
// ======================================================

const CITY = [-8.673, 115.216];

const MAX_VEHICLES = 1800;
const DEFAULT_DENSITY = 0.85;
const MAX_DENSITY = 1.6;
const SIMULATION_SPEED = 3.1;

const ROAD_SPEEDS = [
  50, 45, 38, 32, 28, 23, 18, 12, 8,
];

const ROAD_CLASS_FACTOR = [
  1.15, 1.1, 1.05, 1,
  0.94, 0.88, 0.82, 0.76, 0.7,
];

const VEHICLE_COLORS = [
  "#FFFFFF",
  "#E2E8F0",
  "#475569",
  "#334155",
  "#B91C1C",
  "#2563EB",
  "#0F766E",
  "#D9A024",
];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const formatNumber = (value) =>
  Math.round(value || 0).toLocaleString("id-ID");

function hash(value) {
  let x = Math.floor(value) | 0;

  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);

  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

// ======================================================
// MAT INSIGHTS
// ======================================================

function getZoneMatInsights(graph) {
  if (
    !graph ||
    !Array.isArray(graph.mat) ||
    !Array.isArray(graph.zones)
  ) {
    return null;
  }

  const matrix = graph.mat;

  const zones = graph.zones.map((zone, fallbackIndex) => {
    const parsedIndex =
      Number(String(zone.id).replace(/[^0-9]/g, "")) - 1;

    const index =
      Number.isInteger(parsedIndex) &&
      parsedIndex >= 0 &&
      parsedIndex < matrix.length
        ? parsedIndex
        : fallbackIndex;

    const out = (matrix[index] || []).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );

    const incoming = matrix.reduce(
      (sum, row) => sum + (Number(row?.[index]) || 0),
      0
    );

    const internal = Number(matrix[index]?.[index]) || 0;

    return {
      ...zone,
      index,
      out,
      incoming,
      internal,
      activity: out + incoming - internal,
    };
  });

  const byOrigin = [...zones].sort((a, b) => b.out - a.out);

  const byDestination = [...zones].sort(
    (a, b) => b.incoming - a.incoming
  );

  const byActivity = [...zones].sort(
    (a, b) => b.activity - a.activity
  );

  const zoneByIndex = new Map(
    zones.map((zone) => [zone.index, zone])
  );

  const odPairs = [];

  matrix.forEach((row, i) => {
    if (!Array.isArray(row)) return;

    row.forEach((raw, j) => {
      const value = Number(raw) || 0;

      if (
        i !== j &&
        value > 0 &&
        zoneByIndex.has(i) &&
        zoneByIndex.has(j)
      ) {
        odPairs.push({
          origin: zoneByIndex.get(i),
          destination: zoneByIndex.get(j),
          value,
        });
      }
    });
  });

  odPairs.sort((a, b) => b.value - a.value);

  const total = matrix.reduce(
    (sum, row) =>
      sum +
      (Array.isArray(row)
        ? row.reduce(
            (acc, value) => acc + (Number(value) || 0),
            0
          )
        : 0),
    0
  );

  return {
    byOrigin,
    byDestination,
    byActivity,
    odPairs,
    total,
  };
}

// ======================================================
// LEAFLET ZONE ICON
// ======================================================

function createZoneIcon(id, active) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:31px;
        height:29px;
        border-radius:9px;
        background:${active ? "#B91C1C" : "#FFFFFF"};
        color:${active ? "#FFFFFF" : "#334155"};
        border:1px solid ${
          active ? "#B91C1C" : "#CBD5E1"
        };
        font:700 10px system-ui;
        box-shadow:0 2px 8px #0002;
      ">
        ${id}
      </div>
    `,
    iconSize: [31, 29],
    iconAnchor: [15, 14],
  });
}

// ======================================================
// VEHICLE VISUALS
// ======================================================

function vehicleScale(zoom) {
  if (zoom <= 11) return 0.14;
  if (zoom <= 12) return 0.18;
  if (zoom <= 13) return 0.25;
  if (zoom <= 14) return 0.38;
  if (zoom <= 15) return 0.55;
  if (zoom <= 16) return 0.75;
  if (zoom <= 17) return 0.95;

  return 1.12;
}

function laneGap(zoom) {
  if (zoom <= 13) return 0;
  if (zoom <= 14) return 0.5;
  if (zoom <= 15) return 1.3;
  if (zoom <= 16) return 2.8;
  if (zoom <= 17) return 4.5;

  return 6;
}

function drawVehicle(ctx, vehicle, scale) {
  const s = scale;

  if (vehicle.type === "motor") {
    ctx.fillStyle = "#17202E";
    ctx.fillRect(-5 * s, -1.5 * s, 10 * s, 3 * s);

    ctx.fillStyle = vehicle.color;
    ctx.fillRect(-2 * s, -1.8 * s, 4 * s, 3.6 * s);
    return;
  }

  if (vehicle.type === "bus") {
    ctx.fillStyle = "#243244";
    ctx.fillRect(-11 * s, -4 * s, 22 * s, 8 * s);

    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(-10 * s, -3.2 * s, 20 * s, 6.4 * s);

    ctx.fillStyle = "#B91C1C";
    ctx.fillRect(-9 * s, 2 * s, 18 * s, 1 * s);
    return;
  }

  ctx.fillStyle = "#1E293B";
  ctx.fillRect(-7 * s, -3.2 * s, 14 * s, 6.4 * s);

  ctx.fillStyle = vehicle.color;
  ctx.fillRect(-6.3 * s, -2.7 * s, 12.6 * s, 5.4 * s);

  ctx.fillStyle = "#9BC5D8";
  ctx.fillRect(1.6 * s, -2.1 * s, 2.5 * s, 4.2 * s);
}

// ======================================================
// CREATE VEHICLES
// ======================================================

function createVehicle(edgeIndex, index, count, edge) {
  const seed = edgeIndex * 997 + index * 73;
  const roadClass = clamp(edge[3] | 0, 0, 8);

  const roll = hash(seed);

  const type =
    roll < 0.67
      ? "motor"
      : roll < 0.96
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
    color: VEHICLE_COLORS[
      Math.floor(hash(seed + 3) * VEHICLE_COLORS.length)
    ],
    length:
      type === "motor"
        ? 2
        : type === "bus"
          ? 10
          : 4.5,
    desiredSpeed,
    speed: desiredSpeed * 0.84,
    minGap: 2 + hash(seed + 38) * 2,
    visibility: hash(seed + 823),
    seed,
    status: "moving",
    opacity: 1,
  };
}

function buildVehicles(graph) {
  const p95 = Math.max(
    1,
    graph.metadata?.visualP95 || 1
  );

  const plans = [];
  let totalExpected = 0;

  graph.edges.forEach((edge, index) => {
    if (edge[2] < 7) return;

    const roadClass = clamp(edge[3] | 0, 0, 8);
    const flow = Math.max(0, edge[4] || 0);

    const relativeFlow = Math.pow(
      clamp(flow / p95, 0, 3),
      0.82
    );

    const demand =
      (edge[2] / 1000) *
      ROAD_CLASS_FACTOR[roadClass] *
      (0.05 + 16.5 * relativeFlow) *
      MAX_DENSITY;

    const capacity = Math.max(
      1,
      Math.floor(edge[2] / (roadClass <= 3 ? 16 : 23))
    );

    const expected = Math.min(demand, capacity);

    if (expected > 0) {
      plans.push([index, expected]);
      totalExpected += expected;
    }
  });

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

    for (let i = 0; i < count; i++) {
      cars.push(
        createVehicle(index, i, count, graph.edges[index])
      );
    }
  }

  if (cars.length <= MAX_VEHICLES) return cars;

  return Array.from(
    { length: MAX_VEHICLES },
    (_, i) =>
      cars[Math.floor((i * cars.length) / MAX_VEHICLES)]
  );
}

// ======================================================
// ROAD CONNECTIONS
// ======================================================

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

function chooseNextRoad(vehicle, edge, graph, adjacency) {
  const outgoing = adjacency[edge[1]] || [];

  if (!outgoing.length) return null;

  const noUTurn = outgoing.filter(
    (index) => graph.edges[index][1] !== edge[0]
  );

  const choices = noUTurn.length ? noUTurn : outgoing;

  const currentAngle = roadAngle(graph, edge);

  let total = 0;

  const weighted = choices.map((index) => {
    const next = graph.edges[index];
    const angle = roadAngle(graph, next);

    const difference = Math.abs(
      Math.atan2(
        Math.sin(angle - currentAngle),
        Math.cos(angle - currentAngle)
      )
    );

    const weight =
      difference < 0.45
        ? 3
        : difference < 1.3
          ? 1.5
          : 0.65;

    total += weight;

    return [index, total];
  });

  vehicle.seed += 37;
  const roll = hash(vehicle.seed) * total;

  return (
    weighted.find(([index, value]) => roll <= value)?.[0] ??
    weighted[weighted.length - 1][0]
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function SimulationPreview({
  initialScenario = "before",
  showScenarioControls = false,
}) {
  const mapElement = useRef(null);
  const canvasElement = useRef(null);

  const mapRef = useRef(null);
  const tmdLayerRef = useRef(null);

  const previousMapViewRef = useRef(null);

  const zoneLayerRef = useRef(null);
  const hotspotLayerRef = useRef(null);
  const odLayerRef = useRef(null);

  const redrawHeatRef = useRef(() => {});

  const sceneRef = useRef({
    graph: null,
    cars: [],
    adjacency: [],
    heatCanvas: null,
  });

  const settingsRef = useRef({});

  // DATA
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SIMULASI
  const [scenario, setScenario] = useState(initialScenario);
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [playing, setPlaying] = useState(true);

  // LAYER MAT
  const [showHeat, setShowHeat] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showOD, setShowOD] = useState(true);

  // MODE TMD
  const [networkOnly, setNetworkOnly] = useState(false);

  // KONTROL
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
    networkOnly,
  };

  useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);

  // ====================================================
  // INITIALIZE LEAFLET
  // ====================================================

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    let disposed = false;
    let frameId = 0;
    let lastFrame = 0;
    let lastCounter = 0;
    let observer = null;

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
          "© OpenStreetMap contributors",
      }
    ).addTo(map);

    // ================================================
    // CANVAS VEHICLE PANE
    // ================================================

    const vehiclePane = map.createPane("dtVehiclePane");

    vehiclePane.style.zIndex = "450";
    vehiclePane.style.pointerEvents = "none";

    const vehicleCanvas = L.DomUtil.create(
      "canvas",
      "dt-vehicle-canvas",
      vehiclePane
    );

    vehicleCanvas.style.position = "absolute";
    vehicleCanvas.style.pointerEvents = "none";

    canvasElement.current = vehicleCanvas;

    // ================================================
    // TMD NETWORK
    // ================================================

    tmdLayerRef.current = addTmdNetworkLayer(map, {
      animateBuses: true,
    });

    // ================================================
    // RESIZE CANVAS
    // ================================================

    function resizeCanvas() {
      const canvas = canvasElement.current;
      if (!canvas) return;

      const size = map.getSize();
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.8
      );

      const width = Math.max(
        1,
        Math.round(size.x * dpr)
      );

      const height = Math.max(
        1,
        Math.round(size.y * dpr)
      );

      if (canvas.width !== width) {
        canvas.width = width;
      }

      if (canvas.height !== height) {
        canvas.height = height;
      }

      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;

      const offset = map.containerPointToLayerPoint([0, 0]);

      canvas.style.left = `${offset.x}px`;
      canvas.style.top = `${offset.y}px`;
    }

    // ================================================
    // HEATMAP
    // ================================================

    function paintHeat() {
      const graph = sceneRef.current.graph;

      if (
        !graph ||
        !settingsRef.current.showHeat ||
        settingsRef.current.networkOnly
      ) {
        sceneRef.current.heatCanvas = null;
        return;
      }

      const size = map.getSize();
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.8
      );

      const offscreen = document.createElement("canvas");

      offscreen.width = Math.round(size.x * dpr);
      offscreen.height = Math.round(size.y * dpr);

      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bounds = map.getBounds().pad(0.08);

      const flowIndex =
        settingsRef.current.scenario === "after"
          ? 5
          : 4;

      const p95 = Math.max(
        1,
        graph.metadata?.visualP95 || 1
      );

      for (const edge of graph.edges) {
        const a = graph.nodes[edge[0]];
        const b = graph.nodes[edge[1]];

        if (!a || !b) continue;

        if (
          Math.max(a[0], b[0]) < bounds.getSouth() ||
          Math.min(a[0], b[0]) > bounds.getNorth() ||
          Math.max(a[1], b[1]) < bounds.getWest() ||
          Math.min(a[1], b[1]) > bounds.getEast()
        ) {
          continue;
        }

        const flow = Math.max(
          0,
          edge[flowIndex] || 0
        );

        if (!flow) continue;

        const p = map.latLngToContainerPoint(a);
        const q = map.latLngToContainerPoint(b);

        const strength = Math.sqrt(
          clamp(flow / p95, 0, 3)
        );

        ctx.strokeStyle =
          strength > 1
            ? "rgba(185,28,28,.52)"
            : strength > 0.45
              ? "rgba(234,117,31,.38)"
              : "rgba(234,179,8,.23)";

        ctx.lineWidth = clamp(
          1 + strength * 2.3,
          1,
          5
        );

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      sceneRef.current.heatCanvas = offscreen;
    }

    redrawHeatRef.current = paintHeat;

    // ================================================
    // ANIMATE TRAFFIC
    // ================================================

    function simulate(dt) {
      const scene = sceneRef.current;
      const graph = scene.graph;

      if (!graph || dt <= 0) return;

      const occupied = new Map();

      for (const vehicle of scene.cars) {
        if (vehicle.status !== "moving") continue;

        if (!occupied.has(vehicle.edge)) {
          occupied.set(vehicle.edge, []);
        }

        occupied.get(vehicle.edge).push(vehicle);
      }

      for (const group of occupied.values()) {
        group.sort((a, b) => b.t - a.t);

        for (let i = 0; i < group.length; i++) {
          const vehicle = group[i];
          let edge = graph.edges[vehicle.edge];

          if (!edge) continue;

          const length = Math.max(edge[2], 0.5);

          let targetSpeed = vehicle.desiredSpeed;

          if (i > 0) {
            const leader = group[i - 1];

            const gap =
              (leader.t - vehicle.t) * length -
              leader.length -
              vehicle.minGap;

            const safeSpeed = Math.sqrt(
              Math.max(0, 2 * 2.5 * gap)
            );

            targetSpeed = Math.min(
              targetSpeed,
              safeSpeed
            );
          }

          const acceleration = clamp(
            (targetSpeed - vehicle.speed) * 1.8,
            -4,
            2.4
          );

          vehicle.speed = clamp(
            vehicle.speed + acceleration * dt,
            0,
            vehicle.desiredSpeed
          );

          let distance = vehicle.speed * dt;

          for (
            let hop = 0;
            hop < 12 && distance > 0.0001;
            hop++
          ) {
            const edgeLength = Math.max(edge[2], 0.5);

            const remaining =
              (1 - vehicle.t) * edgeLength;

            if (distance < remaining) {
              vehicle.t += distance / edgeLength;
              distance = 0;
              break;
            }

            distance -= remaining;

            const next = chooseNextRoad(
              vehicle,
              edge,
              graph,
              scene.adjacency
            );

            if (next == null) {
              vehicle.t = 0.9999;
              vehicle.status = "exiting";
              vehicle.speed = 0;
              distance = 0;
              break;
            }

            vehicle.edge = next;
            vehicle.t = 0;
            edge = graph.edges[next];
          }

          vehicle.t = clamp(
            vehicle.t,
            0,
            0.9999
          );
        }
      }

      for (const vehicle of scene.cars) {
        if (vehicle.status !== "exiting") continue;

        vehicle.opacity = Math.max(
          0,
          vehicle.opacity - dt * 1.2
        );

        if (vehicle.opacity <= 0) {
          vehicle.status = "finished";
        }
      }
    }

    // ================================================
    // DRAW VEHICLES
    // ================================================

    function draw() {
      const canvas = canvasElement.current;
      const graph = sceneRef.current.graph;

      if (!canvas) return 0;

      const offset = map.containerPointToLayerPoint([0, 0]);

      canvas.style.left = `${offset.x}px`;
      canvas.style.top = `${offset.y}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;

      const size = map.getSize();

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.8
      );

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);

      // MODE JARINGAN TMD SAJA
      // Hilangkan heatmap dan semua kendaraan MAT.
      if (settingsRef.current.networkOnly) {
        return 0;
      }

      if (!graph) return 0;

      if (
        settingsRef.current.showHeat &&
        sceneRef.current.heatCanvas
      ) {
        ctx.drawImage(
          sceneRef.current.heatCanvas,
          0,
          0,
          size.x,
          size.y
        );
      }

      const zoom = map.getZoom();
      const scale = vehicleScale(zoom);
      const gap = laneGap(zoom);

      const threshold =
        settingsRef.current.density / MAX_DENSITY;

      const projectCache = new Map();

      let count = 0;

      for (const vehicle of sceneRef.current.cars) {
        if (
          vehicle.status === "finished" ||
          vehicle.opacity <= 0 ||
          vehicle.visibility > threshold
        ) {
          continue;
        }

        let points = projectCache.get(vehicle.edge);

        if (!points) {
          const edge = graph.edges[vehicle.edge];

          if (!edge) continue;

          const p = graph.nodes[edge[0]];
          const q = graph.nodes[edge[1]];

          if (!p || !q) continue;

          const a = map.latLngToContainerPoint(p);
          const b = map.latLngToContainerPoint(q);

          points = [a.x, a.y, b.x, b.y];

          projectCache.set(vehicle.edge, points);
        }

        const dx = points[2] - points[0];
        const dy = points[3] - points[1];

        const length = Math.hypot(dx, dy);

        if (length < 0.01) continue;

        const x =
          points[0] +
          dx * vehicle.t +
          (dy / length) * gap;

        const y =
          points[1] +
          dy * vehicle.t -
          (dx / length) * gap;

        if (
          x < -20 ||
          y < -20 ||
          x > size.x + 20 ||
          y > size.y + 20
        ) {
          continue;
        }

        ctx.save();
        ctx.globalAlpha = vehicle.opacity;

        if (zoom <= 13) {
          const radius =
            zoom <= 11
              ? 0.8
              : zoom <= 12
                ? 1.05
                : 1.35;

          ctx.fillStyle = vehicle.color;
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 0.35;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.translate(x, y);
          ctx.rotate(Math.atan2(dy, dx));

          drawVehicle(ctx, vehicle, scale);
        }

        ctx.restore();
        count++;
      }

      return count;
    }

    // ================================================
    // ANIMATION FRAME
    // ================================================

    function frame(now) {
      if (disposed) return;

      const dt = lastFrame
        ? clamp((now - lastFrame) / 1000, 0, 0.06)
        : 0;

      lastFrame = now;

      if (
        settingsRef.current.playing &&
        sceneRef.current.graph &&
        !settingsRef.current.networkOnly
      ) {
        let remaining = dt * SIMULATION_SPEED;

        while (remaining > 0.0001) {
          const step = Math.min(remaining, 0.065);

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

    // ================================================
    // MAP RESIZE / VIEW CHANGES
    // ================================================

    function viewportChanged() {
      resizeCanvas();
      paintHeat();
      draw();
    }

    map.on("zoomend moveend", viewportChanged);
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

    // ================================================
    // LOAD ROAD NETWORK
    // ================================================

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

        graph.edges.forEach((edge, index) => {
          if (adjacency[edge[0]]) {
            adjacency[edge[0]].push(index);
          }
        });

        sceneRef.current.graph = graph;
        sceneRef.current.adjacency = adjacency;
        sceneRef.current.cars = buildVehicles(graph);

        // ============================================
        // MAT ZONE CIRCLES
        // ============================================

        const insights = getZoneMatInsights(graph);

        if (insights) {
          const maxActivity = Math.max(
            1,
            insights.byActivity[0]?.activity || 1
          );

          const origins = new Set(
            insights.byOrigin.slice(0, 2).map((z) => z.id)
          );

          const destinations = new Set(
            insights.byDestination.slice(0, 2).map((z) => z.id)
          );

          const group = L.layerGroup();

          insights.byActivity.forEach((zone) => {
            const priorityOrigin = origins.has(zone.id);
            const priorityDestination =
              destinations.has(zone.id);

            const color = priorityDestination
              ? "#2563EB"
              : priorityOrigin
                ? "#DC2626"
                : "#F59E0B";

            const radius =
              9 +
              20 * Math.sqrt(zone.activity / maxActivity);

            L.circleMarker(
              [zone.lat, zone.lng],
              {
                radius,
                color,
                weight: 1.5,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.12,
              }
            )
              .bindTooltip(
                `<b>${zone.id} · ${zone.name}</b>` +
                `<div>Bangkitan: ${formatNumber(zone.out)} smp/jam</div>` +
                `<div>Tarikan: ${formatNumber(zone.incoming)} smp/jam</div>`
              )
              .addTo(group);
          });

          hotspotLayerRef.current = group;

          if (
            settingsRef.current.showHotspots &&
            !settingsRef.current.networkOnly
          ) {
            group.addTo(map);
          }
        }

        // ============================================
        // MAT ZONE MARKERS Z01-Z13
        // ============================================

        const zoneLayer = L.layerGroup();

        for (const zone of graph.zones || []) {
          L.marker(
            [zone.lat, zone.lng],
            {
              icon: createZoneIcon(zone.id, false),
              title: `${zone.id} - ${zone.name}`,
            }
          )
            .bindTooltip(`${zone.id} - ${zone.name}`)
            .on("click", () => setOrigin(zone.id))
            .addTo(zoneLayer);
        }

        zoneLayerRef.current = zoneLayer;

        if (!settingsRef.current.networkOnly) {
          zoneLayer.addTo(map);
        }

        setNetwork(graph);
        setLoading(false);
        setError("");

        if (settingsRef.current.networkOnly) {
          map.fitBounds(TMD_BOUNDS, {
            padding: [26, 26],
            maxZoom: 11,
            animate: false,
          });
        } else {
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

        console.error("[DewataMove]", err);

        setError(
          "Jaringan jalan gagal dimuat: " + err.message
        );

        setLoading(false);
      }
    })();

    frameId = requestAnimationFrame(frame);

    // ================================================
    // CLEANUP
    // ================================================

    return () => {
      disposed = true;

      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      observer?.disconnect();

      map.off("zoomend moveend", viewportChanged);
      map.off("zoom", draw);

      tmdLayerRef.current?.destroy?.();
      tmdLayerRef.current = null;

      canvasElement.current = null;

      map.remove();
      mapRef.current = null;

      zoneLayerRef.current = null;
      hotspotLayerRef.current = null;
      odLayerRef.current = null;

      redrawHeatRef.current = () => {};

      sceneRef.current = {
        graph: null,
        cars: [],
        adjacency: [],
        heatCanvas: null,
      };
    };
  }, []);

  // ====================================================
  // UPDATE HEATMAP
  // ====================================================

  useEffect(() => {
    redrawHeatRef.current();
  }, [showHeat, scenario, networkOnly]);

  // ====================================================
  // SHOW / HIDE MAT ZONE AND HOTSPOTS
  // ====================================================

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const zoneLayer = zoneLayerRef.current;
    const hotspotLayer = hotspotLayerRef.current;

    if (zoneLayer) {
      if (networkOnly) {
        if (map.hasLayer(zoneLayer)) {
          map.removeLayer(zoneLayer);
        }
      } else if (!map.hasLayer(zoneLayer)) {
        zoneLayer.addTo(map);
      }
    }

    if (hotspotLayer) {
      const visible = showHotspots && !networkOnly;

      if (visible && !map.hasLayer(hotspotLayer)) {
        hotspotLayer.addTo(map);
      }

      if (!visible && map.hasLayer(hotspotLayer)) {
        map.removeLayer(hotspotLayer);
      }
    }
  }, [network, networkOnly, showHotspots]);

  // ====================================================
  // SHOW / HIDE OD LAYER
  // ====================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !network) return;

    if (odLayerRef.current) {
      map.removeLayer(odLayerRef.current);
      odLayerRef.current = null;
    }

    if (!showOD || networkOnly) return;

    const group = L.layerGroup();
    const insights = getZoneMatInsights(network);

    const strongestPairs = insights?.odPairs.slice(0, 5) || [];

    const maximum = Math.max(
      1,
      strongestPairs[0]?.value || 1
    );

    for (const pair of strongestPairs) {
      const selected =
        pair.origin.id === origin &&
        pair.destination.id === destination;

      L.polyline(
        [
          [pair.origin.lat, pair.origin.lng],
          [pair.destination.lat, pair.destination.lng],
        ],
        {
          color: selected ? "#B91C1C" : "#F97316",
          weight:
            1.5 +
            4 * Math.sqrt(pair.value / maximum),
          opacity: selected ? 0.72 : 0.28,
          dashArray: selected ? null : "5 10",
        }
      )
        .bindTooltip(
          `${pair.origin.id} → ${pair.destination.id}: ` +
          `${formatNumber(pair.value)} smp/jam`
        )
        .addTo(group);
    }

    const a = network.zones.find(
      (zone) => zone.id === origin
    );

    const b = network.zones.find(
      (zone) => zone.id === destination
    );

    if (a && b) {
      L.polyline(
        [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        {
          color: "#B91C1C",
          weight: 3,
          dashArray: "8 6",
          opacity: 0.85,
          interactive: false,
        }
      ).addTo(group);
    }

    group.addTo(map);
    odLayerRef.current = group;
  }, [network, origin, destination, showOD, networkOnly]);

  // ====================================================
  // MAP ACTIONS
  // ====================================================

  function toggleNetworkOnly() {
    const map = mapRef.current;

    if (!networkOnly) {
      if (map) {
        previousMapViewRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom(),
        };

        map.fitBounds(TMD_BOUNDS, {
          padding: [26, 26],
          maxZoom: 11,
          animate: false,
        });
      }

      setNetworkOnly(true);
      setMode("tmd");
    } else {
      const previous = previousMapViewRef.current;

      if (map && previous) {
        map.setView(
          previous.center,
          previous.zoom,
          { animate: false }
        );
      }

      setNetworkOnly(false);
      setMode("zones");
    }
  }

  function showAllZones() {
    const map = mapRef.current;

    setNetworkOnly(false);
    setMode("zones");

    if (!map || !network?.zones?.length) return;

    map.fitBounds(
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
    setNetworkOnly(false);
    setMode("street");

    mapRef.current?.setView(
      [-8.670, 115.216],
      16,
      { animate: false }
    );
  }

  function reset() {
    setNetworkOnly(false);
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

  // ====================================================
  // MAT DATA
  // ====================================================

  const zones = network?.zones || [];

  const insights = useMemo(
    () => getZoneMatInsights(network),
    [network]
  );

  const originIndex = zones.findIndex(
    (zone) => zone.id === origin
  );

  const destinationIndex = zones.findIndex(
    (zone) => zone.id === destination
  );

  const od =
    originIndex >= 0 && destinationIndex >= 0
      ? network?.mat?.[originIndex]?.[destinationIndex]
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

  const afterTotal = network?.mat?.reduce(
    (sum, row, i) =>
      sum +
      row.reduce(
        (acc, value, j) =>
          acc +
          value *
            (1 - (i === 10 && j === 2 ? 0.3 : 0.12)),
        0
      ),
    0
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="mx-auto w-full max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:rounded-3xl sm:p-3">

      {/* ================================================
          LEAFLET MAP
      ================================================ */}

      <div className="relative h-[430px] overflow-hidden rounded-xl bg-slate-100 sm:h-[570px] sm:rounded-2xl lg:h-[660px]">

        <div
          ref={mapElement}
          className="absolute inset-0 z-0 h-full w-full"
          aria-label="Peta mobilitas Denpasar dan jaringan TMD"
        />

        {/* TOOLBAR */}

        <div className="absolute left-2 right-2 top-2 z-[1000] flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-md sm:left-4 sm:right-auto sm:top-4">

          <button
            type="button"
            onClick={showAllZones}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
              mode === "zones"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <MapIcon size={14} />
            13 Zona
          </button>

          <button
            type="button"
            onClick={focusStreet}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
              mode === "street"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <CarFront size={14} />
            Fokus Jalan
          </button>

          <button
            type="button"
            onClick={toggleNetworkOnly}
            aria-pressed={networkOnly}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
              networkOnly
                ? "bg-[#B91C1C] text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Network size={14} />
            {networkOnly
              ? "Tampilkan MAT"
              : "Jaringan TMD saja"}
          </button>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label={playing ? "Jeda kendaraan" : "Jalankan kendaraan"}
          >
            {playing ? (
              <Pause size={15} />
            ) : (
              <Play size={15} />
            )}
          </button>

          <button
            type="button"
            onClick={reset}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Reset peta"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* ZOOM */}

        <div className="absolute right-2 top-[105px] z-[1000] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md sm:right-4 sm:top-20">

          <button
            type="button"
            onClick={() =>
              mapRef.current?.zoomIn(0.5, {
                animate: false,
              })
            }
            className="grid h-10 w-10 place-items-center text-slate-800 hover:bg-slate-50"
            aria-label="Zoom in"
          >
            <Plus size={18} />
          </button>

          <div className="mx-2 h-px bg-slate-200" />

          <button
            type="button"
            onClick={() =>
              mapRef.current?.zoomOut(0.5, {
                animate: false,
              })
            }
            className="grid h-10 w-10 place-items-center text-slate-800 hover:bg-slate-50"
            aria-label="Zoom out"
          >
            <Minus size={18} />
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="pointer-events-none absolute inset-0 z-[1100] flex items-center justify-center bg-white/70 p-4">
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#B91C1C]" />

              <p className="text-xs font-semibold text-slate-800">
                Memuat jaringan jalan Denpasar...
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="absolute bottom-14 left-3 right-3 z-[1100] rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-900 shadow-sm sm:right-auto sm:max-w-lg">
            <Info size={14} className="mr-1 inline" />
            {error}
          </div>
        )}

        {/* INFORMASI MODE JARINGAN */}

        {networkOnly ? (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[900] flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm">
            <BusFront size={15} className="text-[#B91C1C]" />
            6 Koridor Trans Metro Dewata
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[900] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm">
              {formatNumber(visibleCount)} kendaraan terlihat
            </div>

            <div className="pointer-events-none absolute bottom-3 right-3 z-[900] hidden rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-sm sm:block">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                Asal dominan MAT
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Tujuan dominan MAT
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Zona lainnya
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================================================
          NETWORK ONLY INFORMATION
      ================================================ */}

      {networkOnly ? (
        <div className="px-3 py-5 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Jaringan Trans Metro Dewata
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                Peta menampilkan koridor TMD beserta titik
                pemberhentian utama. Posisi bus merupakan
                simulasi visual, bukan lokasi GPS aktual.
              </p>
            </div>

            <span className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              6 Koridor
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TMD_CORRIDORS.map((corridor) => (
              <div
                key={corridor.id}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3"
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: corridor.color,
                  }}
                >
                  {corridor.id}
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">
                    {corridor.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    {corridor.route}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ============================================
              MAT CONTROLS
          ============================================ */}

          <div className="grid gap-5 p-3 sm:p-5 lg:grid-cols-3">

            <section className="min-w-0 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal size={17} />
                Pengaturan Lalu Lintas
              </h3>

              {showScenarioControls && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScenario("before")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                      scenario === "before"
                        ? "bg-[#B91C1C] text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Before TDM
                  </button>

                  <button
                    type="button"
                    onClick={() => setScenario("after")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                      scenario === "after"
                        ? "bg-[#0F766E] text-white"
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
                  onChange={(event) =>
                    setDensity(Number(event.target.value))
                  }
                  className="mt-3 block w-full accent-[#B91C1C]"
                />
              </label>

              <div className="space-y-2.5 text-xs text-slate-700">

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showHeat}
                    onChange={(event) =>
                      setShowHeat(event.target.checked)
                    }
                    className="accent-[#B91C1C]"
                  />
                  Intensitas Ruas (Model)
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOD}
                    onChange={(event) =>
                      setShowOD(event.target.checked)
                    }
                    className="accent-[#B91C1C]"
                  />
                  Garis OD Terbesar
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showHotspots}
                    onChange={(event) =>
                      setShowHotspots(event.target.checked)
                    }
                    className="accent-[#B91C1C]"
                  />
                  Aktivitas MAT per Zona
                </label>
              </div>

              <p className="text-[11px] leading-5 text-slate-500">
                Warna ruas dan kepadatan kendaraan adalah
                visualisasi ilustratif berdasarkan arus model,
                bukan pengukuran kemacetan aktual.
              </p>
            </section>

            {/* ==========================================
                ZONE SELECTION
            ========================================== */}

            <section className="min-w-0 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Network size={17} />
                Matriks Asal Tujuan
              </h3>

              <label className="block text-xs font-medium text-slate-700">
                Zona Asal

                <select
                  value={origin}
                  onChange={(event) =>
                    setOrigin(event.target.value)
                  }
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#B91C1C]"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.id} - {zone.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700">
                Zona Tujuan

                <select
                  value={destination}
                  onChange={(event) =>
                    setDestination(event.target.value)
                  }
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#B91C1C]"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.id} - {zone.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* ==========================================
                MAT STATISTICS
            ========================================== */}

            <section className="min-w-0 rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {scenario === "after"
                  ? "MAT Setelah TDM — Asumsi"
                  : "Total MAT 2026"}
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {network
                  ? formatNumber(
                      scenario === "after"
                        ? afterTotal
                        : insights?.total
                    )
                  : "-"}
              </p>

              <p className="text-xs text-slate-500">
                smp/jam
              </p>

              <div className="my-4 h-px bg-slate-200" />

              <p className="text-xs font-bold text-[#B91C1C]">
                OD {origin} → {destination}
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {shownOD == null
                  ? "-"
                  : formatNumber(shownOD)}
              </p>

              <p className="text-xs text-slate-500">
                smp/jam
              </p>

              {scenario === "after" && (
                <p className="mt-3 text-[11px] leading-5 text-amber-800">
                  Perubahan OD di pratinjau menggunakan asumsi
                  demonstrasi, bukan hasil kalibrasi atau
                  proyeksi resmi.
                </p>
              )}
            </section>
          </div>

          {/* ============================================
              MAT SUMMARY
          ============================================ */}

          {insights && insights.odPairs.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-5 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Sorotan Pergerakan · MAT 2026
                </h3>

                <span className="text-[11px] text-slate-500">
                  Satuan: smp/jam
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-slate-500">
                    Asal terbesar
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {insights.byOrigin[0]?.id}
                  </p>

                  <p className="text-xs text-slate-600">
                    {formatNumber(
                      insights.byOrigin[0]?.out
                    )}{" "}
                    smp/jam
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Tujuan terbesar
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {insights.byDestination[0]?.id}
                  </p>

                  <p className="text-xs text-slate-600">
                    {formatNumber(
                      insights.byDestination[0]?.incoming
                    )}{" "}
                    smp/jam
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Hubungan OD utama
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {insights.odPairs[0]?.origin.id} →{" "}
                    {insights.odPairs[0]?.destination.id}
                  </p>

                  <p className="text-xs text-slate-600">
                    {formatNumber(
                      insights.odPairs[0]?.value
                    )}{" "}
                    smp/jam
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
