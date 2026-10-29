import L from "leaflet";
import { updateIdm } from "../../data/vehicleDynamics.js";

export const RED = "#B91C1C";
export const TEAL = "#0F766E";

export const INITIAL_VIEW = {
  lat: -8.667,
  lng: 115.218,
  zoom: 12,
};

export const MAX_VEHICLES = 2400;

export const COLORS = [
  "#FFFFFF",
  "#CBD5E1",
  "#475569",
  "#334155",
  "#B91C1C",
  "#2563EB",
  "#0F766E",
  "#D97706",
];

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
// Bagian random stabil

export function hash(value) {
  let x = Math.floor(value) | 0;

  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);

  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
// Bagian validasi koordinat

export function validPoint(point) {
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

export function distanceMeters(a, b) {
  const latitude = ((a[0] + b[0]) * Math.PI) / 360;

  return Math.hypot(
    (b[0] - a[0]) * 111320,
    (b[1] - a[1]) * 111320 * Math.cos(latitude),
  );
}
// Bagian persiapan geometri jalan

export function preparePath(path) {
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
// Bagian persiapan data jalan

export function prepareRoads(graph, assignment, model) {
  if (!graph?.nodes?.length || !graph?.edges?.length) {
    return [];
  }

  if (graph.metadata?.ferryFiltered !== true) {
    return [];
  }

  const assigned = new Map(
    (assignment?.roads || []).map((road) => [Number(road.id), road]),
  );

  const useAssignment = assigned.size > 0;

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
// Bagian tekanan arus jalan

export function trafficColor(relative) {
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
// Bagian ukuran kendaraan

export function getVehiclePreset(zoom) {
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
// Bagian posisi di sepanjang jalan

export function pointAlongRoad(road, distance) {
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
// Bagian jaringan jalan

export function buildScene(roads) {
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
// Bagian pembuatan kendaraan

export function createVehicles(roads, previous = []) {
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

    const vehiclesPerKm = 8 + 18 * Math.sqrt(density);
    const ideal = Math.min(8, (road.total / 1000) * vehiclesPerKm);

    const count =
      Math.floor(ideal) +
      (hash(road.id * 19 + 7) < ideal % 1 ? 1 : 0);

    for (let i = 0; i < count; i++) {
      const id = `${road.id}:${i}`;

      const saved = old.get(id);

      const seed = road.id * 977 + i * 73;

      const roll = hash(seed + 5);

      const kind = roll < 0.75 ? "motor" : roll < 0.98 ? "car" : "bus";

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
        spawnDistance:
          saved?.spawnDistance ??
          road.total * ((i + 0.5) / Math.max(count, 1)),

        speed: saved?.speed ?? 4,
        alpha: saved?.alpha ?? 0.3,
        scenarioVisibility: saved?.scenarioVisibility ?? 1,
        length: kind === "motor" ? 2 : kind === "bus" ? 10 : 4.5,
        minGap: kind === "motor" ? 1.5 : 2.5,
        timeHeadway: kind === "motor" ? 1.3 : 1.6,
        maxAcceleration: kind === "motor" ? 1.5 : 1.2,
        comfortableDeceleration: kind === "bus" ? 1.8 : 2,

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
// Bagian pemilihan jalan lanjutan

export function roadDirection(road, atEnd = false) {
  const points = road.path;

  const a = atEnd ? points[points.length - 2] : points[0];

  const b = atEnd ? points[points.length - 1] : points[1];

  return Math.atan2(
    b[0] - a[0],
    (b[1] - a[1]) * Math.cos(((a[0] + b[0]) * Math.PI) / 360),
  );
}

export function chooseNextRoad(current, scene) {
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
// Bagian simulasi kendaraan

export function advanceVehicles(vehicles, scene, dt, after, reference) {
  const vehiclesByRoad = new Map();

  for (const car of vehicles) {
    if (car.state === "waiting") {
      car.cooldown -= dt;

      if (car.cooldown <= 0) {
        car.roadId = car.originalRoadId;
        car.distance = car.spawnDistance;
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

    const road = scene.byId.get(car.roadId);

    if (!road) {
      continue;
    }

    car.alpha = Math.min(1, car.alpha + dt * 1.8);
    const afterRatio = clamp(road.after / Math.max(1, road.before), 0, 1);
    const targetVisibility = !after || car.afterSample < afterRatio ? 1 : 0;
    car.scenarioVisibility += clamp(
      targetVisibility - car.scenarioVisibility,
      -dt * 1.8,
      dt * 1.8,
    );

    if (!vehiclesByRoad.has(road.id)) {
      vehiclesByRoad.set(road.id, []);
    }

    vehiclesByRoad.get(road.id).push(car);
  }

  for (const [roadId, group] of vehiclesByRoad) {
    group.sort((a, b) => b.distance - a.distance);

    for (let index = 0; index < group.length; index++) {
      const car = group[index];
      const leader = index > 0 ? group[index - 1] : null;
      let road = scene.byId.get(roadId);

      if (!road) {
        continue;
      }

      const flow = after ? road.after : road.before;
      const pressure = clamp(flow / Math.max(reference, 1), 0, 2);
      const targetSpeed = clamp(
        13 / (1 + Math.pow(pressure * 1.6, 1.3)),
        1.5,
        13,
      );
      const leaderGap = leader
        ? leader.distance - car.distance -
          (leader.length + car.length) / 2 - car.minGap
        : 10000;
      const movement = updateIdm(
        car,
        targetSpeed,
        leader?.speed,
        leaderGap,
        dt,
      );

      car.speed = movement.speed;

      const safeDistance = leader
        ? Math.max(0, leader.distance - car.distance -
            (leader.length + car.length) / 2 - car.minGap)
        : Infinity;
      let remaining = Math.min(movement.distance, safeDistance);

    // Ketika mencapai ujung ruas,
    // lanjut ke ruas yang tersambung.
      for (let hop = 0; hop < 8 && remaining > 0; hop++) {
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
          car.speed = 0;
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
}
// Bagian gambar kendaraan

export function drawVehicle(ctx, car, preset) {
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
// Bagian ikon zona

export function zoneIcon(id, active) {
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
