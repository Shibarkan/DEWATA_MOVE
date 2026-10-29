import L from "leaflet";

export const CITY = [-8.673, 115.216];

const MAX_VEHICLES = 1800;
export const DEFAULT_DENSITY = 0.85;
export const MAX_DENSITY = 1.6;
export const SIMULATION_SPEED = 3.1;

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

export const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function hash(value) {
  let x = Math.floor(value) | 0;

  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);

  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

// Leaflet zone icon

export function createZoneIcon(id, active) {
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

// Vehicle visuals

export function vehicleScale(zoom) {
  if (zoom <= 11) return 0.14;
  if (zoom <= 12) return 0.18;
  if (zoom <= 13) return 0.25;
  if (zoom <= 14) return 0.38;
  if (zoom <= 15) return 0.55;
  if (zoom <= 16) return 0.75;
  if (zoom <= 17) return 0.95;

  return 1.12;
}

export function laneGap(zoom) {
  if (zoom <= 13) return 0;
  if (zoom <= 14) return 0.5;
  if (zoom <= 15) return 1.3;
  if (zoom <= 16) return 2.8;
  if (zoom <= 17) return 4.5;

  return 6;
}

export function drawVehicle(ctx, vehicle, scale) {
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

// Vehicle creation

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

export function buildVehicles(graph) {
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

// Road connections

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

export function chooseNextRoad(vehicle, edge, graph, adjacency) {
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
    weighted.find(([, value]) => roll <= value)?.[0] ??
    weighted[weighted.length - 1][0]
  );
}
