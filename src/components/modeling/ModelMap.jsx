import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addTmdNetworkLayer } from "../../data/tmdNetwork";
import { LocateFixed, Minus, Pause, Play, Plus, Route } from "lucide-react";

import { MODEL_ZONES } from "../../data/modelEngine";

/*
  DEWATAMOVE 2041
  LEAFLET MODELING MAP

  Menggunakan:
  - Leaflet
  - OpenStreetMap
  - Canvas 2D
  - Tailwind CSS

  Tanpa MapLibre.

  Kendaraan:
  - Mengikuti geometri OSRM
  - Tetap di jalan ketika zoom
  - Ukuran menyesuaikan zoom
  - Bergerak sesuai arah ruas
  - Tidak reset ketika zoom
  - Populasi Before / After berbeda

  Kompatibel:
  - graph.edges
  - graph.visualRoads
  - trafficAssignment
  - ModelOverview
*/

const RED = "#B91C1C";
const TEAL = "#0F766E";

const INITIAL_VIEW = {
  lat: -8.667,
  lng: 115.218,
  zoom: 12,
};

const MAX_VEHICLES = 650;

const COLORS = [
  "#FFFFFF",
  "#CBD5E1",
  "#475569",
  "#334155",
  "#B91C1C",
  "#2563EB",
  "#0F766E",
  "#D97706",
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ==========================================
// STABLE RANDOM
// ==========================================

function hash(value) {
  let x = Math.floor(value) | 0;

  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);

  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

// ==========================================
// COORDINATE VALIDATION
// ==========================================

function validPoint(point) {
  if (
    !Array.isArray(point) ||
    !Number.isFinite(point[0]) ||
    !Number.isFinite(point[1])
  ) {
    return false;
  }

  const [lat, lng] = point;

  if (lat < -8.82 || lat > -8.53 || lng < 115.07 || lng > 115.45) {
    return false;
  }

  // Filter konservatif yang sama dengan
  // jaringan Modeling sebelumnya.
  // Bukan pengganti garis pantai resmi.

  if (lat >= -8.63 && lng > 115.278) {
    return false;
  }

  if (lat < -8.63 && lat >= -8.72 && lng > 115.274) {
    return false;
  }

  if (lat < -8.72 && lng > 115.265) {
    return false;
  }

  return true;
}

function distanceMeters(a, b) {
  const latitude = ((a[0] + b[0]) * Math.PI) / 360;

  return Math.hypot(
    (b[0] - a[0]) * 111320,
    (b[1] - a[1]) * 111320 * Math.cos(latitude),
  );
}

// ==========================================
// PREPARE POLYLINE GEOMETRY
// ==========================================

function preparePath(path) {
  if (!Array.isArray(path) || path.length < 2 || !path.every(validPoint)) {
    return null;
  }

  const cumulative = [0];
  let total = 0;

  for (let i = 1; i < path.length; i++) {
    const distance = distanceMeters(path[i - 1], path[i]);

    // Tolak sambungan terlalu panjang
    // yang mungkin bukan ruas jalan asli.

    if (!Number.isFinite(distance) || distance < 0.5 || distance > 250) {
      return null;
    }

    total += distance;
    cumulative.push(total);
  }

  if (total < 2) {
    return null;
  }

  return {
    path,
    cumulative,
    total,
  };
}

// ==========================================
// PREPARE ROAD DATA
// ==========================================

function prepareRoads(graph, assignment, model) {
  if (!graph?.nodes?.length || !graph?.edges?.length) {
    return [];
  }

  if (graph.metadata?.ferryFiltered !== true) {
    return [];
  }

  const assigned = new Map(
    (assignment?.roads || []).map((road) => [Number(road.id), road]),
  );

  const useAssignment =
    assigned.size >= 20 && Number(assignment?.coverage || 0) > 0.03;

  const growth = (model?.beforeTotal || 1) / Math.max(1, model?.base2026 || 1);

  const afterRatio =
    (model?.afterTotal || 1) / Math.max(1, model?.beforeTotal || 1);

  // Mendukung jaringan dengan full polyline
  // maupun jaringan edges kecil OSRM.

  const sources = graph.visualRoads?.length
    ? graph.visualRoads
    : graph.edges.map((edge, id) => ({
        id,
        from: edge[0],
        to: edge[1],
        path: [graph.nodes[edge[0]], graph.nodes[edge[1]]],
        pressure: edge[4],
      }));

  const roads = [];

  for (const source of sources) {
    const id = Number(source.id);

    if (!Number.isInteger(id)) {
      continue;
    }

    const geometry = preparePath(source.path);

    if (!geometry) {
      continue;
    }

    const edge = graph.edges[id];

    const matched = assigned.get(id);

    const proxyBefore =
      Math.max(0, Number(source.pressure ?? edge?.[4] ?? 0)) * growth;

    const before = useAssignment
      ? Math.max(0, Number(matched?.before || 0))
      : proxyBefore;

    const after = useAssignment
      ? Math.max(0, Number(matched?.after || 0))
      : proxyBefore * afterRatio;

    if (before <= 0) {
      continue;
    }

    roads.push({
      id,

      from: source.from ?? edge?.[0],

      to: source.to ?? edge?.[1],

      ...geometry,

      before,
      after,
    });
  }

  return roads;
}

// ==========================================
// ROAD PRESSURE
// ==========================================

function trafficColor(relative) {
  if (relative >= 0.8) {
    return RED;
  }

  if (relative >= 0.5) {
    return "#E58C32";
  }

  if (relative >= 0.25) {
    return "#D3AD4C";
  }

  return TEAL;
}

// ==========================================
// VEHICLE SIZE BY ZOOM
// ==========================================

function getVehiclePreset(zoom) {
  // Zoom jauh
  if (zoom < 13.5) {
    return {
      level: "small",
      car: [4.7, 2.4],
      motor: [3.2, 1.6],
      bus: [7.5, 3.2],
      laneOffset: 0,
      visibility: 0.22,
    };
  }

  // Zoom sedang
  if (zoom < 16) {
    return {
      level: "medium",
      car: [8.5, 4],
      motor: [4.7, 2.2],
      bus: [14, 5.2],
      laneOffset: 0,
      visibility: 0.58,
    };
  }

  // Zoom dekat
  return {
    level: "large",
    car: [15, 6.7],
    motor: [7, 3],
    bus: [24, 8.5],

    // Offset sangat kecil agar tidak
    // terlihat keluar dari geometri jalan.
    laneOffset: zoom >= 17 ? Math.min(1.8, (zoom - 16) * 0.65) : 0,

    visibility: 1,
  };
}

// ==========================================
// LOCATION ALONG POLYLINE
// ==========================================

function pointAlongRoad(road, distance) {
  const target = clamp(distance, 0, road.total - 0.0001);

  const values = road.cumulative;

  // Binary search untuk polyline panjang.
  let low = 1;
  let high = values.length - 1;

  while (low < high) {
    const mid = (low + high) >> 1;

    if (values[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const index = low;

  const start = road.path[index - 1];
  const end = road.path[index];

  const segmentLength = values[index] - values[index - 1];

  const t = (target - values[index - 1]) / Math.max(segmentLength, 0.001);

  return {
    lat: start[0] + (end[0] - start[0]) * t,

    lng: start[1] + (end[1] - start[1]) * t,

    start,
    end,
  };
}

// ==========================================
// ROAD SCENE
// ==========================================

function buildScene(roads) {
  const byId = new Map();
  const outgoing = new Map();

  for (const road of roads) {
    byId.set(road.id, road);

    if (!outgoing.has(road.from)) {
      outgoing.set(road.from, []);
    }

    outgoing.get(road.from).push(road);
  }

  return {
    byId,
    outgoing,
  };
}

// ==========================================
// CREATE VEHICLES
// ==========================================

function createVehicles(roads, previous = []) {
  if (!roads.length) {
    return [];
  }

  const old = new Map(previous.map((vehicle) => [vehicle.id, vehicle]));

  const roadIds = new Set(roads.map((road) => road.id));

  const values = roads.map((road) => road.before).sort((a, b) => b - a);

  const reference =
    values[Math.min(values.length - 1, Math.floor(values.length * 0.12))] || 1;

  const result = [];

  for (const road of roads) {
    const density = clamp(road.before / Math.max(reference, 1), 0, 2);

    // Populasi tetap pada ruas.
    // Zoom hanya menentukan berapa
    // kendaraan yang terlihat.

    const ideal = Math.min(
      5,
      (road.total / 65) * (0.28 + Math.sqrt(density) * 1.1),
    );

    const count = Math.min(
      5,
      Math.floor(ideal) + (hash(road.id * 19 + 7) < ideal % 1 ? 1 : 0),
    );

    for (let i = 0; i < count; i++) {
      const id = `${road.id}:${i}`;

      const saved = old.get(id);

      const seed = road.id * 977 + i * 73;

      const roll = hash(seed + 5);

      const kind = roll < 0.48 ? "motor" : roll < 0.94 ? "car" : "bus";

      const color =
        kind === "bus"
          ? RED
          : COLORS[Math.floor(hash(seed + 11) * COLORS.length)];

      result.push({
        id,
        seed,

        originalRoadId: road.id,

        roadId: saved && roadIds.has(saved.roadId) ? saved.roadId : road.id,

        distance:
          saved && roadIds.has(saved.roadId)
            ? saved.distance
            : road.total * ((i + 0.5) / Math.max(count, 1)),

        speed: saved?.speed ?? 4,
        alpha: saved?.alpha ?? 0.3,

        state: saved?.state ?? "moving",

        cooldown: saved?.cooldown ?? 0,

        kind,
        color,

        sample: hash(seed + 31),
        afterSample: hash(seed + 47),
      });
    }
  }

  return result.sort((a, b) => a.sample - b.sample).slice(0, MAX_VEHICLES);
}

// ==========================================
// CHOOSE CONNECTED ROAD
// ==========================================

function roadDirection(road, atEnd = false) {
  const points = road.path;

  const a = atEnd ? points[points.length - 2] : points[0];

  const b = atEnd ? points[points.length - 1] : points[1];

  return Math.atan2(
    b[0] - a[0],
    (b[1] - a[1]) * Math.cos(((a[0] + b[0]) * Math.PI) / 360),
  );
}

function chooseNextRoad(current, scene) {
  const candidates = scene.outgoing.get(current.to) || [];

  const options = candidates.filter(
    (road) => road.id !== current.id && road.to !== current.from,
  );

  if (!options.length) {
    return null;
  }

  const heading = roadDirection(current, true);

  let best = null;
  let bestScore = Infinity;

  for (const candidate of options) {
    const nextHeading = roadDirection(candidate, false);

    const angle = Math.abs(
      Math.atan2(
        Math.sin(nextHeading - heading),
        Math.cos(nextHeading - heading),
      ),
    );

    if (angle < bestScore) {
      bestScore = angle;
      best = candidate;
    }
  }

  return best;
}

// ==========================================
// SIMULATE VEHICLES
// ==========================================

function advanceVehicles(vehicles, scene, dt, after, reference) {
  for (const car of vehicles) {
    if (car.state === "waiting") {
      car.cooldown -= dt;

      if (car.cooldown <= 0) {
        car.roadId = car.originalRoadId;
        car.distance = 0;
        car.alpha = 0;
        car.speed = 2;
        car.state = "moving";
      }

      continue;
    }

    if (car.state === "leaving") {
      car.alpha = Math.max(0, car.alpha - dt * 2.5);

      if (car.alpha <= 0) {
        car.state = "waiting";
        car.cooldown = 0.5;
      }

      continue;
    }

    let road = scene.byId.get(car.roadId);

    if (!road) {
      continue;
    }

    const flow = after ? road.after : road.before;

    const pressure = clamp(flow / Math.max(reference, 1), 0, 2);

    // Kecepatan visual dari tekanan arus.
    // Bukan kecepatan hasil pengukuran.

    const targetSpeed = clamp(
      13 / (1 + Math.pow(pressure * 1.6, 1.3)),
      1.5,
      13,
    );

    car.speed += clamp(targetSpeed - car.speed, -3 * dt, 2.5 * dt);

    car.alpha = Math.min(1, car.alpha + dt * 1.8);

    let remaining = car.speed * dt * 2.5;

    // Ketika mencapai ujung ruas,
    // lanjut ke ruas yang tersambung.
    for (let hop = 0; hop < 8; hop++) {
      const available = road.total - car.distance;

      if (remaining < available) {
        car.distance += remaining;
        break;
      }

      remaining -= Math.max(available, 0);

      const next = chooseNextRoad(road, scene);

      if (!next) {
        car.distance = road.total - 0.001;

        car.state = "leaving";
        break;
      }

      car.roadId = next.id;
      car.distance = 0;
      road = next;

      if (remaining <= 0) {
        break;
      }
    }
  }
}

// ==========================================
// DRAW VEHICLE
// ==========================================

function drawVehicle(ctx, car, preset) {
  const [length, width] = preset[car.kind];

  if (car.kind === "motor") {
    ctx.fillStyle = "#1F2937";

    ctx.fillRect(-length / 2, -width / 2, length, width);

    ctx.fillStyle = car.color;

    ctx.fillRect(-length * 0.22, -width * 0.58, length * 0.44, width * 1.16);

    return;
  }

  // Body memanjang searah sumbu X.
  // Rotasi mengikuti garis jalan di layar.

  ctx.fillStyle = car.kind === "bus" ? "#FFFFFF" : car.color;

  ctx.strokeStyle = "#334155";

  ctx.lineWidth = 0.5;

  ctx.beginPath();

  ctx.roundRect(
    -length / 2,
    -width / 2,
    length,
    width,
    Math.max(1, width * 0.28),
  );

  ctx.fill();
  ctx.stroke();

  if (preset.level === "small") {
    return;
  }

  // Kaca
  ctx.fillStyle = "#9FC6DA";

  ctx.beginPath();

  ctx.roundRect(
    -length * 0.08,
    -width * 0.28,
    length * 0.28,
    width * 0.56,
    Math.max(1, width * 0.12),
  );

  ctx.fill();

  // Trans Metro Dewata
  if (car.kind === "bus") {
    ctx.fillStyle = RED;

    ctx.fillRect(
      -length * 0.44,
      width * 0.23,
      length * 0.88,
      Math.max(1, width * 0.13),
    );
  }

  if (preset.level === "large") {
    // Lampu kendaraan
    ctx.fillStyle = "#FEF3C7";

    ctx.fillRect(length * 0.4, -width * 0.3, 1.5, 1.5);

    ctx.fillRect(length * 0.4, width * 0.17, 1.5, 1.5);
  }
}

// ==========================================
// ZONE MARKERS
// ==========================================

function zoneIcon(id, active) {
  return L.divIcon({
    className: "",

    html: `
      <div style="
        width:34px;
        height:30px;
        display:grid;
        place-items:center;
        border-radius:9px;
        background:${active ? RED : "#FFFFFF"};
        border:1px solid ${active ? RED : "#CBD5E1"};
        color:${active ? "#FFFFFF" : "#334155"};
        font:700 10px system-ui;
        box-shadow:0 3px 12px rgba(15,23,42,.12);
      ">
        ${id}
      </div>
    `,

    iconSize: [34, 30],
    iconAnchor: [17, 15],
  });
}

// ==========================================
// MAIN MODEL MAP
// ==========================================

export default function ModelMap({
  stage = "before",
  model,
  assignment,
  graph,

  selectedZone = "Z11",
  onSelectZone,

  label,
  compact = false,

  syncView,
  onViewChange,
}) {
  const mapContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const mapRef = useRef(null);
  const tmdLayerRef = useRef(null);
  const roadLayerRef = useRef(null);
  const zoneLayerRef = useRef(null);

  const vehiclesRef = useRef([]);

  const sceneRef = useRef({
    byId: new Map(),
    outgoing: new Map(),
  });

  const settingsRef = useRef({});

  const selectRef = useRef(onSelectZone);
  const viewRef = useRef(onViewChange);

  const [playing, setPlaying] = useState(true);

  const [layer, setLayer] = useState("road");

  const isBefore = stage === "before";

  // ======================================
  // PREPARE NETWORK
  // ======================================

  const roads = useMemo(
    () => prepareRoads(graph, assignment, model),
    [graph, assignment, model],
  );

  const reference = useMemo(() => {
    if (!roads.length) {
      return 1;
    }

    const sorted = roads.map((road) => road.before).sort((a, b) => b - a);

    return Math.max(1, sorted[Math.floor(sorted.length * 0.12)] || 1);
  }, [roads]);

  // Latest values for animation loop
  settingsRef.current = {
    isBefore,
    playing,
    layer,
    reference,
  };

  selectRef.current = onSelectZone;
  viewRef.current = onViewChange;

  // ======================================
  // INITIALIZE LEAFLET
  // ======================================

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [
        syncView?.lat ?? INITIAL_VIEW.lat,
        syncView?.lng ?? INITIAL_VIEW.lng,
      ],

      zoom: syncView?.zoom ?? INITIAL_VIEW.zoom,

      minZoom: 10,
      maxZoom: 19,

      zoomSnap: 0.5,
      zoomDelta: 0.5,

      zoomControl: false,

      scrollWheelZoom: true,

      // Mengurangi ketidaksesuaian
      // sementara saat animasi zoom.
      zoomAnimation: false,
      markerZoomAnimation: false,
      fadeAnimation: false,

      preferCanvas: true,
    });

    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // CANVAS KENDARAAN: masukkan ke pane Leaflet
    // agar posisinya tetap mengikuti peta saat zoom/pan.
    const vehiclePane = map.createPane("dmVehiclePane");
    vehiclePane.style.zIndex = "450";
    vehiclePane.style.pointerEvents = "none";

    const vehicleCanvas = L.DomUtil.create(
      "canvas",
      "dm-vehicle-canvas",
      vehiclePane,
    );

    vehicleCanvas.style.position = "absolute";
    vehicleCanvas.style.left = "0";
    vehicleCanvas.style.top = "0";
    vehicleCanvas.style.pointerEvents = "none";

    canvasRef.current = vehicleCanvas;

    roadLayerRef.current = L.layerGroup().addTo(map);

    zoneLayerRef.current = L.layerGroup().addTo(map);
    // Jaringan Trans Metro Dewata
    tmdLayerRef.current = addTmdNetworkLayer(map);

    const notifyView = () => {
      const center = map.getCenter();

      viewRef.current?.({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      });
    };

    map.on("moveend zoomend", notifyView);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.invalidateSize({
              pan: false,
            });
          })
        : null;

    observer?.observe(mapContainerRef.current);

    const timer = window.setTimeout(() => {
      map.invalidateSize({
        pan: false,
      });
    }, 150);

    return () => {
      window.clearTimeout(timer);

      observer?.disconnect();

      map.off("moveend zoomend", notifyView);
      tmdLayerRef.current?.destroy?.();
      tmdLayerRef.current = null;
      map.remove();

      mapRef.current = null;
      roadLayerRef.current = null;
      zoneLayerRef.current = null;
    };

    // Peta dibuat satu kali per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================================
  // SYNC CAMERA
  // ======================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !syncView) {
      return;
    }

    const center = map.getCenter();

    const changed =
      Math.abs(center.lat - syncView.lat) > 0.00001 ||
      Math.abs(center.lng - syncView.lng) > 0.00001 ||
      Math.abs(map.getZoom() - syncView.zoom) > 0.05;

    if (changed) {
      map.setView(
        [syncView.lat, syncView.lng],

        syncView.zoom,

        {
          animate: false,
        },
      );
    }
  }, [syncView]);

  // ======================================
  // ZONE MARKERS
  // ======================================

  useEffect(() => {
    const group = zoneLayerRef.current;

    if (!group) {
      return;
    }

    group.clearLayers();

    for (const zone of MODEL_ZONES) {
      L.marker(
        [zone.lat, zone.lng],

        {
          icon: zoneIcon(zone.id, zone.id === selectedZone),

          title: zone.name,
        },
      )
        .bindTooltip(`${zone.id} · ${zone.name}`)
        .on("click", () => {
          selectRef.current?.(zone.id);
        })
        .addTo(group);
    }
  }, [selectedZone]);

  // ======================================
  // ROAD LAYER & VEHICLES
  // ======================================

  useEffect(() => {
    const group = roadLayerRef.current;

    if (!group) {
      return;
    }

    group.clearLayers();

    sceneRef.current = buildScene(roads);

    // Pertahankan posisi kendaraan
    // saat data kebijakan diperbarui.
    // Zoom tidak memanggil fungsi ini.

    vehiclesRef.current = createVehicles(roads, vehiclesRef.current);

    if (layer === "road") {
      // Kelompokkan jalan berdasarkan
      // warna supaya tidak membuat
      // ribuan layer individual.

      const buckets = [[], [], [], []];

      for (const road of roads) {
        const flow = isBefore ? road.before : road.after;

        if (flow <= 0) {
          continue;
        }

        const relative = clamp(flow / Math.max(reference, 1), 0, 2);

        const bucket =
          relative >= 0.8 ? 3 : relative >= 0.5 ? 2 : relative >= 0.25 ? 1 : 0;

        buckets[bucket].push(road.path);
      }

      const colors = ["#0F766E", "#D3AD4C", "#E58C32", "#B91C1C"];

      buckets.forEach((paths, index) => {
        if (!paths.length) {
          return;
        }

        L.polyline(paths, {
          color: colors[index],
          weight: 2.7,
          opacity: 0.66,
          interactive: false,
          smoothFactor: 0,
        }).addTo(group);
      });
    }

    if (layer === "od") {
      // OD bukan jalan kendaraan.
      // Hanya muncul ketika dipilih.

      for (const pair of (model?.pairs || []).slice(0, 20)) {
        const focused = pair.origin.id === selectedZone;

        L.polyline(
          [
            [pair.origin.lat, pair.origin.lng],
            [pair.destination.lat, pair.destination.lng],
          ],

          {
            color: focused ? RED : "#64748B",

            opacity: focused ? 0.75 : 0.23,

            weight: focused ? 2.4 : 1.1,

            dashArray: "5 8",

            interactive: false,
          },
        ).addTo(group);
      }
    }
  }, [roads, layer, isBefore, reference, model, selectedZone]);

  // ======================================
  // CANVAS VEHICLE ANIMATION
  // ======================================

  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;

    if (!map || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let raf = 0;
    let lastTime = 0;
    let lastDraw = 0;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;

    function drawFrame(time) {
      raf = requestAnimationFrame(drawFrame);

      // Sekitar 30 FPS agar lebih ringan.
      if (time - lastDraw < 32) {
        return;
      }

      const dt = clamp(lastTime ? (time - lastTime) / 1000 : 0, 0, 0.07);

      lastTime = time;
      lastDraw = time;

      const size = map.getSize();

      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const width = Math.max(1, Math.round(size.x * dpr));

      const height = Math.max(1, Math.round(size.y * dpr));

      if (canvas.width !== width) {
        canvas.width = width;
      }

      if (canvas.height !== height) {
        canvas.height = height;
      }

      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, size.x, size.y);

      const settings = settingsRef.current;

      if (settings.layer !== "road") {
        return;
      }

      const scene = sceneRef.current;
      const vehicles = vehiclesRef.current;

      const after = !settings.isBefore;

      if (settings.playing && !reducedMotion) {
        advanceVehicles(vehicles, scene, dt, after, settings.reference);
      }

      const preset = getVehiclePreset(map.getZoom());

      // ==================================
      // DRAW VEHICLES
      // ==================================

      for (const car of vehicles) {
        if (car.state === "waiting" || car.sample > preset.visibility) {
          continue;
        }

        const road = scene.byId.get(car.roadId);

        if (!road) {
          continue;
        }

        // Populasi After mengikuti
        // rasio arus di ruas yang sama.

        const afterRatio = clamp(road.after / Math.max(1, road.before), 0, 1);

        if (after && car.afterSample > afterRatio) {
          continue;
        }

        const point = pointAlongRoad(road, car.distance);

        // Koordinat posisi kendaraan,
        // arah, dan jalan diproyeksikan
        // oleh instance Leaflet yang sama.

        const position = map.latLngToLayerPoint([point.lat, point.lng]);

        const screenStart = map.latLngToLayerPoint(point.start);

        const screenEnd = map.latLngToLayerPoint(point.end);

        const dx = screenEnd.x - screenStart.x;

        const dy = screenEnd.y - screenStart.y;

        const length = Math.hypot(dx, dy);

        if (length < 0.001) {
          continue;
        }

        const angle = Math.atan2(dy, dx);

        // Sisi kiri arah gerak.
        // Offset dinonaktifkan pada
        // zoom jauh dan sedang.

        const offset = preset.laneOffset;

        const x = position.x + (dy / length) * offset;

        const y = position.y - (dx / length) * offset;

        if (x < -30 || y < -30 || x > size.x + 30 || y > size.y + 30) {
          continue;
        }

        ctx.save();

        ctx.globalAlpha = clamp(car.alpha, 0, 1);

        ctx.translate(x, y);
        ctx.rotate(angle);

        drawVehicle(ctx, car, preset);

        ctx.restore();
      }
    }

    raf = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  // ======================================
  // VIEW CONTROLS
  // ======================================

  const resetView = useCallback(() => {
    mapRef.current?.setView(
      [INITIAL_VIEW.lat, INITIAL_VIEW.lng],
      INITIAL_VIEW.zoom,
      {
        animate: false,
      },
    );
  }, []);

  // ======================================
  // RENDER
  // ======================================

  return (
    <div
      className={`
        relative min-w-0
        overflow-hidden rounded-2xl
        border border-slate-200
        bg-[#EDF2F4]
        ${
          compact
            ? "h-[330px] sm:h-[390px] xl:h-[435px]"
            : "h-[420px] sm:h-[540px] lg:h-[600px]"
        }
      `}
    >
      {/* LEAFLET MAP */}

      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        aria-label="Peta pemodelan Denpasar"
      />

      {/* VEHICLE CANVAS */}

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="
    pointer-events-none
    absolute inset-0
    z-[450]
  "
      />

      {/* MAP LAYERS */}

      <div
        className="
          absolute left-3 top-3 z-[900]
          flex items-center gap-1
          rounded-xl
          border border-slate-200
          bg-white/95 p-1
          shadow-sm
        "
      >
        <button
          type="button"
          onClick={() => setLayer("road")}
          className={`
            rounded-lg px-3 py-2
            text-[11px] font-semibold
            transition-colors
            ${
              layer === "road"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }
          `}
        >
          Arus jalan
        </button>

        <button
          type="button"
          onClick={() => setLayer("od")}
          className={`
            flex items-center gap-1
            rounded-lg px-3 py-2
            text-[11px] font-semibold
            transition-colors
            ${
              layer === "od"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }
          `}
        >
          <Route size={13} />
          OD
        </button>
      </div>

      {/* ZOOM CONTROLS */}

      <div
        className="
          absolute right-3 top-3 z-[900]
          flex flex-col overflow-hidden
          rounded-xl border border-slate-200
          bg-white/95 shadow-sm
        "
      >
        <button
          type="button"
          aria-label="Perbesar peta"
          onClick={() => mapRef.current?.zoomIn(0.5)}
          className="
            grid h-10 w-10 place-items-center
            text-slate-700 hover:bg-slate-100
          "
        >
          <Plus size={17} />
        </button>

        <div className="mx-2 h-px bg-slate-200" />

        <button
          type="button"
          aria-label="Perkecil peta"
          onClick={() => mapRef.current?.zoomOut(0.5)}
          className="
            grid h-10 w-10 place-items-center
            text-slate-700 hover:bg-slate-100
          "
        >
          <Minus size={17} />
        </button>

        <div className="mx-2 h-px bg-slate-200" />

        <button
          type="button"
          aria-label="Kembali ke pusat Denpasar"
          onClick={resetView}
          className="
            grid h-10 w-10 place-items-center
            text-slate-700 hover:bg-slate-100
          "
        >
          <LocateFixed size={17} />
        </button>
      </div>

      {/* PLAY / PAUSE */}

      <div
        className="
          absolute bottom-3 left-3 z-[900]
          flex items-center gap-2
        "
      >
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="
            flex items-center gap-2
            rounded-lg border border-slate-200
            bg-white/95 px-3 py-2
            text-[11px] font-semibold
            text-slate-700 shadow-sm
          "
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}

          {playing ? "Jeda" : "Putar"}
        </button>
      </div>

      {/* STAGE LABEL */}

      <span
        className="
          pointer-events-none
          absolute bottom-3 right-3
          z-[900]
          rounded-lg
          border border-slate-200
          bg-white/95 px-3 py-2
          text-[10px] font-bold
          text-slate-700 shadow-sm
        "
      >
        {label || (isBefore ? "SEBELUM" : "SESUDAH")}
      </span>

      {/* NO NETWORK */}

      {!roads.length && layer === "road" && (
        <div
          className="
            pointer-events-none
            absolute inset-x-5 top-1/2 z-[800]
            -translate-y-1/2
            rounded-xl border border-slate-200
            bg-white/95 px-5 py-4
            text-center text-xs leading-6
            text-slate-600 shadow-sm
          "
        >
          Jaringan jalan Modeling belum tersedia. Periksa koneksi OSRM atau data
          jaringan.
        </div>
      )}

      {/* OD NOTE */}

      {layer === "od" && (
        <div
          className="
            pointer-events-none
            absolute bottom-14 left-3
            z-[900]
            max-w-[250px]
            rounded-lg bg-white/95
            px-3 apy-2
            text-[10px] text-slate-600
            shadow-sm
          "
        >
          Garis OD menunjukkan hubungan asal–tujuan, bukan lintasan mobil.
        </div>
      )}
    </div>
  );
}
