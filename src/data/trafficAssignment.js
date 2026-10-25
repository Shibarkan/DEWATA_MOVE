
/**
 * DewataMove 2041 | Network traffic assignment (exploratory)
 * Graph source: denpasarNetworkBrowser.js (directed OSRM sampled corridors).
 * Algorithm: shortest-distance all-or-nothing, once per origin zone.
 * Not an equilibrium model and not a city-wide calibrated volume estimate.
 */
import { MODEL_ZONES } from "./modelEngine";

function geoDistance(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * rad) * Math.cos(b[0] * rad) *
    Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function createQueue() {
  const data = [];
  return {
    push(item) {
      let k = data.length;
      data.push(item);
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (data[p][0] <= item[0]) break;
        data[k] = data[p]; k = p;
      }
      data[k] = item;
    },
    pop() {
      if (!data.length) return null;
      const first = data[0];
      const last = data.pop();
      if (data.length) {
        let k = 0;
        while (2 * k + 1 < data.length) {
          let c = 2 * k + 1;
          if (c + 1 < data.length && data[c + 1][0] < data[c][0]) c++;
          if (last[0] <= data[c][0]) break;
          data[k] = data[c]; k = c;
        }
        data[k] = last;
      }
      return first;
    },
    get length() { return data.length; },
  };
}

/**
 * Snap centroid zona ke node terdekat dalam jangkauan. Zona terlalu jauh
 * dari jaringan sampel akan ditandai unassigned.
 */
function snapZones(nodes, limitMeters) {
  return MODEL_ZONES.map((zone) => {
    let best = { node: -1, distance: Infinity };
    const center = [zone.lat, zone.lng];
    nodes.forEach((p, i) => {
      const distance = geoDistance(center, p);
      if (distance < best.distance) best = { node: i, distance };
    });
    return {
      ...best,
      valid: best.distance <= limitMeters,
    };
  });
}

/** Memastikan edge dan konektivitas yang tersedia tidak dikarang. */
export function assignTraffic(graph, model, options = {}) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges) ||
      !graph.nodes.length || !graph.edges.length) return null;

  const nodes = graph.nodes;
  const edges = graph.edges;
  const maxSnap = options.maxSnapMeters ?? 1800;
  const snap = snapZones(nodes, maxSnap);
  const adjacency = Array.from({ length: nodes.length }, () => []);

  edges.forEach((edge, index) => {
    const [from, to, length] = edge;
    if (!Number.isInteger(from) || !Number.isInteger(to) ||
        !nodes[from] || !nodes[to] || from === to) return;
    adjacency[from].push({ to, index, weight: Math.max(0.1, Number(length) || geoDistance(nodes[from], nodes[to])) });
  });

  const beforeLinks = new Float64Array(edges.length);
  const afterLinks = new Float64Array(edges.length);
  const stats = {
    assigned: 0, unassigned: 0, unassignedAfter: 0,
    unassignedZoneSnap: 0, unassignedDisconnected: 0,
    intrazonal: 0,
  };
  const n = MODEL_ZONES.length;

  for (let i = 0; i < n; i++) {
    stats.intrazonal += model.matrixBefore[i]?.[i] || 0;
    const distances = new Float64Array(nodes.length).fill(Infinity);
    const parentEdge = new Int32Array(nodes.length).fill(-1);
    const parentNode = new Int32Array(nodes.length).fill(-1);

    if (snap[i].valid) {
      const heap = createQueue();
      distances[snap[i].node] = 0;
      heap.push([0, snap[i].node]);
      while (heap.length) {
        const [distance, from] = heap.pop();
        if (distance > distances[from]) continue;
        for (const edge of adjacency[from]) {
          const nextDistance = distance + edge.weight;
          if (nextDistance >= distances[edge.to]) continue;
          distances[edge.to] = nextDistance;
          parentEdge[edge.to] = edge.index;
          parentNode[edge.to] = from;
          heap.push([nextDistance, edge.to]);
        }
      }
    }

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const before = model.matrixBefore[i]?.[j] || 0;
      const after = model.matrixAfter[i]?.[j] || 0;
      if (!before) continue;
      if (!snap[i].valid || !snap[j].valid) {
        stats.unassigned += before;
        stats.unassignedAfter += after;
        stats.unassignedZoneSnap += before;
        continue;
      }
      const source = snap[i].node;
      const target = snap[j].node;
      if (source === target || !Number.isFinite(distances[target])) {
        stats.unassigned += before;
        stats.unassignedAfter += after;
        stats.unassignedDisconnected += before;
        continue;
      }
      const path = [];
      let k = target;
      while (k !== source && parentEdge[k] >= 0 && path.length <= edges.length) {
        path.push(parentEdge[k]);
        k = parentNode[k];
      }
      if (k !== source) {
        stats.unassigned += before;
        stats.unassignedAfter += after;
        stats.unassignedDisconnected += before;
        continue;
      }
      stats.assigned += before;
      for (const edgeIndex of path) {
        beforeLinks[edgeIndex] += before;
        afterLinks[edgeIndex] += after;
      }
    }
  }

  const roads = edges.map((edge, index) => ({
    id: index,
    a: nodes[edge[0]], b: nodes[edge[1]],
    length: Math.max(0, Number(edge[2]) || 0),
    before: beforeLinks[index],
    after: afterLinks[index],
  })).filter((r) => r.a && r.b && r.before > 0);

  const referenceFlow = Math.max(1, ...roads.map((r) => r.before));
  roads.sort((a, b) => b.before - a.before);
  const totalInterzonal = stats.assigned + stats.unassigned;

  return {
    roads,
    referenceFlow,
    snappedZones: snap,
    ...stats,
    coverage: totalInterzonal > 0 ? stats.assigned / totalInterzonal : 0,
    source: graph.metadata?.source || "OSRM / OpenStreetMap",
    sampleCorridors: graph.metadata?.sampledCorridors ?? null,
    caveat: "AON di koridor OSRM sampel. Jaringan tidak lengkap dan belum dikalibrasi; volume ruas tidak mewakili total seluruh jalan Denpasar.",
  };
}
