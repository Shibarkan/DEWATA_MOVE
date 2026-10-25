import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Minus, Plus, Pause, Play, LocateFixed, Route } from "lucide-react";
import { MODEL_ZONES } from "../../data/modelEngine";

/**
 * MODEL MAP — DewataMove 2041
 * Tailwind-only UI, Leaflet map, Canvas kendaraan (bukan CSS animation).
 * - Kendaraan mengikuti directed-edge koridor sampel / hasil AON assignment
 * - Lane offset di sebelah kiri arah pergerakan; arah edge tidak dibalik
 * - Posisi dan kendaraan dipertahankan saat zoom, pan, ganti parameter
 * - Mobil mengikuti jarak antar-kendaraan sederhana; kecepatan ilustratif
 * - Saat lintasan berakhir: fade-out, bukan teleport terlihat ke ruas lain
 * - Kamera dua peta dapat disinkronkan dari parent
 *
 * Penting: arus relatif/kecepatan = ilustrasi, BUKAN V/C atau kemacetan terukur.
 */
const INITIAL = { lat: -8.667, lng: 115.218, zoom: 12 };
const DARK = "#273445";
const RED = "#B91C1C";
const TEAL = "#0F766E";
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const format = (n) => Math.round(n || 0).toLocaleString("id-ID");
function hash(n) {
  let x = Math.floor(n) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
function nodeKey(point) {
  return `${Number(point[0]).toFixed(5)},${Number(point[1]).toFixed(5)}`;
}
function bearing(road) {
  const cosLat = Math.cos(((road.a[0] + road.b[0]) / 2) * Math.PI / 180);
  return Math.atan2(road.b[0] - road.a[0], (road.b[1] - road.a[1]) * cosLat);
}
function zoneMarker(id, active) {
  return L.divIcon({
    className: "",
    html: `<div class="grid h-7 w-8 place-items-center rounded-lg border text-[10px] font-bold shadow-sm ${active ? "border-[#B91C1C] bg-[#B91C1C] text-white" : "border-slate-300 bg-white text-slate-700"}">${id}</div>`,
    iconSize: [32, 28], iconAnchor: [16, 14],
  });
}
function pressureColor(relative) {
  // Skala warna KONSISTEN antara dua peta, relatif pada referensi Before.
  if (relative >= 0.8) return RED;
  if (relative >= 0.49) return "#E48C36";
  if (relative >= 0.25) return "#D3AC4A";
  return TEAL;
}
function createRoads(assignment, graph, model) {
  const routed = (assignment?.roads || []).filter((r) => r.before > 0 && r.a && r.b && r.length > 2);
  if (routed.length >= 20 && assignment.coverage > 0.03) {
    return {
      mode: "assigned",
      roads: routed.slice(0, 1700).map((r) => ({ ...r, key: String(r.id) })),
    };
  }
  // Fallback dari graph koridor asli yang dimuat OSRM; bobot tekanan ilustratif
  // dari penyedia graph. Setelah kebijakan: dikalikan rasio MAT hasil model.
  if (graph?.nodes?.length && graph?.edges?.length) {
    const growth = (model?.beforeTotal || 1) / Math.max(1, model?.base2026 || 1);
    const ratio = (model?.afterTotal || 1) / Math.max(1, model?.beforeTotal || 1);
    return {
      mode: "proxy",
      roads: graph.edges.map((edge, i) => {
        const before = Math.max(0, Number(edge[4]) || 0) * growth;
        return {
          id: i, key: String(i), a: graph.nodes[edge[0]], b: graph.nodes[edge[1]],
          length: Number(edge[2]) || 0, before, after: before * ratio,
        };
      }).filter((r) => r.a && r.b && r.length > 2 && r.before > 0).slice(0, 1700),
    };
  }
  return { mode: "unavailable", roads: [] };
}
function buildVehiclePopulation(roads, previousCars) {
  if (!roads.length) return [];
  const old = new Map(previousCars.map((c) => [c.id, c]));
  const available = new Set(roads.map((r) => String(r.id)));
  const maxVehicles = typeof window !== "undefined" && window.innerWidth < 768 ? 280 : 620;
  const sortedFlow = roads.map((r) => r.before).sort((a, b) => b - a);
  const p90 = sortedFlow[Math.min(sortedFlow.length - 1, Math.floor(sortedFlow.length * 0.1))] || 1;
  const ordered = [...roads].sort((a, b) => a.id - b.id);
  const vehicles = [];
  for (const road of ordered) {
    const relative = clamp(road.before / Math.max(1, p90), 0, 2.3);
    const ideal = Math.min(9, (road.length / 32) * (0.30 + 1.1 * Math.sqrt(relative)));
    const count = Math.min(Math.floor(road.length / 15), Math.floor(ideal) + (hash(road.id * 19 + 7) < ideal % 1 ? 1 : 0));
    for (let k = 0; k < count; k++) {
      const id = `${road.id}:${k}`;
      const prev = old.get(id);
      const seed = Number(road.id) * 977 + k * 73;
      const roll = hash(seed + 4);
      vehicles.push({
        id, roadKey: prev && available.has(prev.roadKey) ? prev.roadKey : String(road.id),
        originalKey: String(road.id),
        t: prev?.t ?? ((k + 0.5) / Math.max(1, count)),
        speed: prev?.speed ?? 4.0,
        opacity: prev?.opacity ?? 0,
        visibleRank: hash(seed + 37),
        kind: roll < 0.61 ? "motor" : roll < 0.94 ? "car" : "bus",
        color: ["#FFFFFF", "#CBD5E1", "#334155", "#B91C1C", "#3B82F6", "#0F766E"][Math.floor(hash(seed + 11) * 6)],
        seed: prev?.seed ?? seed, state: prev?.state ?? "moving", delay: prev?.delay ?? 0,
        length: roll < 0.61 ? 2.3 : roll < 0.94 ? 4.5 : 10,
      });
    }
  }
  if (vehicles.length <= maxVehicles) return vehicles;
  // Sampling stabil: kendaraan sama saat map viewport berbeda / parameter berubah.
  return Array.from({ length: maxVehicles }, (_, i) => vehicles[Math.floor((i + 0.5) * vehicles.length / maxVehicles)]);
}
function paintVehicle(ctx, car, scale) {
  if (car.kind === "motor") {
    ctx.fillStyle = "#1F2937";
    ctx.fillRect(-4.5 * scale, -1.4 * scale, 9 * scale, 2.8 * scale);
    ctx.fillStyle = car.color;
    ctx.fillRect(-2 * scale, -1.9 * scale, 4 * scale, 3.8 * scale);
    return;
  }
  if (car.kind === "bus") {
    ctx.fillStyle = "#263445";
    ctx.fillRect(-12 * scale, -4.2 * scale, 24 * scale, 8.4 * scale);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(-11 * scale, -3.4 * scale, 22 * scale, 6.8 * scale);
    ctx.fillStyle = RED;
    ctx.fillRect(-10 * scale, 2 * scale, 20 * scale, 1.1 * scale);
    ctx.fillStyle = "#94A3B8";
    ctx.fillRect(-7 * scale, -2.4 * scale, 12 * scale, 3.5 * scale);
    return;
  }
  ctx.fillStyle = "#1F2937";
  ctx.fillRect(-7.5 * scale, -3.4 * scale, 15 * scale, 6.8 * scale);
  ctx.fillStyle = car.color;
  ctx.fillRect(-6.8 * scale, -2.9 * scale, 13.6 * scale, 5.8 * scale);
  ctx.fillStyle = "#9FC3D9";
  ctx.fillRect(1.5 * scale, -2.4 * scale, 3 * scale, 4.8 * scale);
}
function sceneData(roads) {
  const byId = new Map();
  const outgoing = new Map();
  for (const road of roads) {
    road.angle = bearing(road);
    byId.set(String(road.id), road);
    const key = nodeKey(road.a);
    if (!outgoing.has(key)) outgoing.set(key, []);
    outgoing.get(key).push(road);
  }
  return { byId, outgoing };
}
function chooseNext(car, road, scene, after) {
  const choices = (scene.outgoing.get(nodeKey(road.b)) || [])
    .filter((r) => r.key !== road.key && nodeKey(r.b) !== nodeKey(road.a));
  if (!choices.length) return null;
  const ranked = choices.map((r) => {
    const a = Math.abs(Math.atan2(Math.sin(r.angle - road.angle), Math.cos(r.angle - road.angle)));
    const straightness = a < 0.45 ? 4 : a < 1.2 ? 1.8 : 0.8;
    const flow = Math.sqrt(Math.max(0, after ? r.after : r.before) + 1);
    return { road: r, weight: straightness * (0.2 + flow) };
  });
  const total = ranked.reduce((s, c) => s + c.weight, 0);
  car.seed += 31;
  let choice = hash(car.seed) * total;
  for (const candidate of ranked) {
    choice -= candidate.weight;
    if (choice <= 0) return candidate.road;
  }
  return ranked[ranked.length - 1].road;
}

export default function ModelMap({
  stage = "before", model, assignment, graph,
  selectedZone = "Z11", onSelectZone,
  label, compact = false, syncView, onViewChange,
}) {
  const element = useRef(null);
  const canvas = useRef(null);
  const mapRef = useRef(null);
  const roadLayer = useRef(null);
  const zoneLayer = useRef(null);
  const sceneRef = useRef({ byId: new Map(), outgoing: new Map() });
  const carsRef = useRef([]);
  const currentRef = useRef({});
  const onSelectZoneRef = useRef(onSelectZone);
  const onViewChangeRef = useRef(onViewChange);
  const [playing, setPlaying] = useState(true);
  const [layer, setLayer] = useState("road");
  const [streetView, setStreetView] = useState(false);
  const isBefore = stage === "before";
  const { roads, mode } = useMemo(() => createRoads(assignment, graph, model), [assignment, graph, model]);
  const reference = useMemo(() => {
    if (!roads.length) return 1;
    const flows = roads.map((r) => r.before).sort((a, b) => b - a);
    return Math.max(1, flows[Math.min(flows.length - 1, Math.floor(flows.length * 0.14))]);
  }, [roads]);

  onSelectZoneRef.current = onSelectZone;
  onViewChangeRef.current = onViewChange;
  currentRef.current = { roads, mode, stage, reference, playing, layer, isBefore };

  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = L.map(element.current, {
      center: [syncView?.lat ?? INITIAL.lat, syncView?.lng ?? INITIAL.lng],
      zoom: syncView?.zoom ?? INITIAL.zoom,
      minZoom: 10, maxZoom: 19, zoomSnap: 0.5, zoomDelta: 0.5,
      zoomControl: false, scrollWheelZoom: true, preferCanvas: true,
      zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
      wheelPxPerZoomLevel: 130,
    });
    mapRef.current = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    roadLayer.current = L.layerGroup().addTo(map);
    zoneLayer.current = L.layerGroup().addTo(map);
    const notifyView = () => {
      const center = map.getCenter();
      onViewChangeRef.current?.({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    };
    map.on("moveend zoomend", notifyView);
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => map.invalidateSize({ pan: false })) : null;
    observer?.observe(element.current);
    const timer = setTimeout(() => map.invalidateSize({ pan: false }), 120);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      map.off("moveend zoomend", notifyView);
      map.remove(); mapRef.current = null;
      roadLayer.current = null; zoneLayer.current = null;
    };
    // MOUNT ONLY: props kept in currentRef/onViewChangeRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !syncView) return;
    const center = map.getCenter();
    if (Math.abs(center.lat - syncView.lat) > 0.000008 ||
        Math.abs(center.lng - syncView.lng) > 0.000008 ||
        Math.abs(map.getZoom() - syncView.zoom) > 0.05) {
      map.setView([syncView.lat, syncView.lng], syncView.zoom, { animate: false });
    }
  }, [syncView]);

  useEffect(() => {
    const group = zoneLayer.current;
    if (!group) return;
    group.clearLayers();
    for (const z of MODEL_ZONES) {
      L.marker([z.lat, z.lng], { icon: zoneMarker(z.id, z.id === selectedZone), title: z.name })
        .bindTooltip(`${z.id} · ${z.name}`, { direction: "top" })
        .on("click", () => onSelectZoneRef.current?.(z.id)).addTo(group);
    }
  }, [selectedZone]);

  useEffect(() => {
    const group = roadLayer.current;
    if (!group) return;
    group.clearLayers();
    const scene = sceneData(roads);
    sceneRef.current = scene;
    // Keep vehicle IDs/positions if the same edge is present on re-assignment.
    carsRef.current = buildVehiclePopulation(roads, carsRef.current);
    if (layer === "road" && roads.length) {
      for (const r of roads) {
        const flow = isBefore ? r.before : r.after;
        if (!flow) continue;
        const relative = clamp(flow / reference, 0, 2);
        L.polyline([r.a, r.b], {
          color: pressureColor(relative),
          weight: 1.2 + 2.7 * Math.sqrt(clamp(relative, 0, 1.8)),
          opacity: 0.28 + 0.34 * clamp(relative, 0, 1),
          interactive: false,
        }).addTo(group);
      }
    } else {
      // Garis ini adalah OD centroid-to-centroid, BUKAN geometri jalan.
      for (const p of (model?.pairs || []).slice(0, 22)) {
        L.polyline([[p.origin.lat, p.origin.lng], [p.destination.lat, p.destination.lng]], {
          color: p.origin.id === selectedZone ? RED : "#94A3B8",
          weight: p.origin.id === selectedZone ? 2.4 : 1.2,
          opacity: p.origin.id === selectedZone ? 0.8 : 0.34,
          dashArray: "5 8", interactive: false,
        }).addTo(group);
      }
    }
  }, [roads, model, selectedZone, layer, isBefore, reference]);

  useEffect(() => {
    const map = mapRef.current, layerCanvas = canvas.current;
    if (!map || !layerCanvas) return;
    const ctx = layerCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    let raf = 0, lastFrame = 0, lastPaint = 0;
    const frame = (time) => {
      raf = requestAnimationFrame(frame);
      if (time - lastPaint < 30) return;
      lastPaint = time;
      const dt = clamp(lastFrame ? (time - lastFrame) / 1000 : 0, 0, 0.065);
      lastFrame = time;
      const { playing, layer, isBefore, reference } = currentRef.current;
      const scene = sceneRef.current;
      const size = map.getSize();
      const dpr = Math.min(1.8, window.devicePixelRatio || 1);
      const pixelWidth = Math.max(1, Math.round(size.x * dpr));
      const pixelHeight = Math.max(1, Math.round(size.y * dpr));
      if (layerCanvas.width !== pixelWidth) layerCanvas.width = pixelWidth;
      if (layerCanvas.height !== pixelHeight) layerCanvas.height = pixelHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);
      if (layer !== "road") return;

      // Simple car-following queue on same directed edge.
      const occupied = new Map();
      for (const car of carsRef.current) {
        if (car.state !== "moving") continue;
        if (!occupied.has(car.roadKey)) occupied.set(car.roadKey, []);
        occupied.get(car.roadKey).push(car);
      }
      for (const list of occupied.values()) list.sort((a, b) => b.t - a.t);
      const projected = new Map();
      const zoom = map.getZoom();
      const vehicleScale = clamp((zoom - 12.0) / 5.1, 0.14, 1.15);
      const laneOffset = zoom < 14 ? 0 : clamp((zoom - 13) * 1.35, 0, 7);
      for (const list of occupied.values()) {
        for (let i = 0; i < list.length; i++) {
          const car = list[i];
          let road = scene.byId.get(car.roadKey);
          if (!road) continue;
          const volume = isBefore ? road.before : road.after;
          const fraction = clamp(volume / Math.max(1, road.before), 0, 1);
          const wanted = car.visibleRank < fraction ? 1 : 0;
          car.opacity += (wanted - car.opacity) * Math.min(1, dt * 3.4);
          if (car.opacity < 0.025 && wanted === 0) continue;

          const pressure = clamp(volume / reference, 0, 2);
          const desired = (14.5 / (1 + Math.pow(pressure * 2.1, 1.4))) *
            (0.82 + hash(car.seed + 7) * 0.28);
          let target = clamp(desired, 2.1, 14);
          if (i > 0) {
            const ahead = list[i - 1];
            const gap = (ahead.t - car.t) * Math.max(1, road.length) - ahead.length - 2.6;
            target = Math.min(target, Math.sqrt(Math.max(0, 2 * 2.7 * gap)));
          }
          if (playing && !reduced) {
            car.speed = clamp(car.speed + clamp(target - car.speed, -3.5 * dt, 2.5 * dt), 0, 16);
            let meters = car.speed * dt * 3.0; // visual time compression, independent of zoom
            for (let hop = 0; meters > 0.001 && hop < 12; hop++) {
              const remaining = (1 - car.t) * Math.max(0.1, road.length);
              if (meters < remaining) { car.t += meters / road.length; break; }
              meters -= remaining;
              const next = chooseNext(car, road, scene, !isBefore);
              if (!next) {
                car.t = 1; car.state = "leaving"; car.delay = 1.1 + hash(car.seed) * 1.7;
                break;
              }
              car.roadKey = next.key; car.t = 0; road = next;
            }
          }
          if (car.state !== "moving") continue;
          let endpoints = projected.get(road.key);
          if (!endpoints) {
            const a = map.latLngToContainerPoint(road.a);
            const b = map.latLngToContainerPoint(road.b);
            endpoints = [a.x, a.y, b.x, b.y];
            projected.set(road.key, endpoints);
          }
          const [ax, ay, bx, by] = endpoints;
          const dx = bx - ax, dy = by - ay;
          const pixelLength = Math.hypot(dx, dy);
          if (pixelLength < 0.15) continue;
          // Perpendicular offset to the LEFT of travel direction on screen.
          const x = ax + dx * car.t + (dy / pixelLength) * laneOffset;
          const y = ay + dy * car.t - (dx / pixelLength) * laneOffset;
          if (x < -18 || y < -18 || x > size.x + 18 || y > size.y + 18) continue;
          ctx.save();
          ctx.globalAlpha = car.opacity * clamp(Math.min(car.t, 1 - car.t) * 18, 0.2, 1);
          if (zoom <= 13) {
            ctx.beginPath(); ctx.arc(x, y, zoom < 12 ? 0.8 : 1.25, 0, 2 * Math.PI);
            ctx.fillStyle = car.color; ctx.fill();
          } else {
            ctx.translate(x, y);
            ctx.rotate(Math.atan2(dy, dx));
            paintVehicle(ctx, car, vehicleScale);
          }
          ctx.restore();
        }
      }
      // End of corridor: fade out, then return to SAME starting corridor invisibly.
      for (const car of carsRef.current) {
        if (car.state !== "leaving") continue;
        car.opacity = Math.max(0, car.opacity - dt * 1.9);
        car.delay -= dt;
        if (car.delay <= 0 && car.opacity < 0.02) {
          car.roadKey = car.originalKey; car.t = 0.005;
          car.state = "moving"; car.speed = 2; car.seed += 17;
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const centerMap = useCallback(() => {
    mapRef.current?.setView([INITIAL.lat, INITIAL.lng], 12, { animate: false });
    setStreetView(false);
  }, []);
  const focusStreet = useCallback(() => {
    mapRef.current?.setView([-8.657, 115.218], 16, { animate: false });
    setStreetView(true);
  }, []);

  return (
    <div className={`relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#EDF2F4] ${compact ? "h-[330px] sm:h-[390px] xl:h-[435px]" : "h-[420px] sm:h-[540px]"}`}>
      <div ref={element} className="absolute inset-0 z-0" aria-label="Peta interaktif jaringan jalan Denpasar" />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[450]" />

      <div className="absolute left-3 top-3 z-[900] flex items-center gap-1 rounded-xl border border-slate-200/75 bg-white/95 p-1 shadow-sm">
        <button type="button" onClick={() => setLayer("road")} className={`rounded-lg px-2.5 py-2 text-[11px] font-semibold ${layer === "road" ? "bg-[#B91C1C] text-white" : "text-slate-600 hover:bg-slate-100"}`}>Arus jalan</button>
        <button type="button" onClick={() => setLayer("od")} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold ${layer === "od" ? "bg-[#B91C1C] text-white" : "text-slate-600 hover:bg-slate-100"}`}><Route size={12} />OD</button>
      </div>

      <div className="absolute right-3 top-3 z-[900] flex flex-col rounded-xl border border-slate-200 bg-white/95 shadow-sm">
        <button type="button" onClick={() => mapRef.current?.zoomIn(0.5, { animate: false })} aria-label="Perbesar peta" className="grid h-9 w-9 place-items-center hover:bg-slate-100"><Plus size={16} /></button>
        <button type="button" onClick={() => mapRef.current?.zoomOut(0.5, { animate: false })} aria-label="Perkecil peta" className="grid h-9 w-9 place-items-center border-y border-slate-200 hover:bg-slate-100"><Minus size={16} /></button>
        <button type="button" onClick={streetView ? centerMap : focusStreet} aria-label={streetView ? "Tampilkan kota" : "Fokus jalan untuk melihat kendaraan"} className="grid h-9 w-9 place-items-center hover:bg-slate-100"><LocateFixed size={16} /></button>
      </div>

      <div className="absolute bottom-3 left-3 z-[900] flex items-center gap-2">
        <button type="button" onClick={() => setPlaying((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm">
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? "Jeda" : "Putar"}
        </button>
        <span className="hidden rounded-lg bg-white/95 px-3 py-2 text-[10px] font-medium text-slate-500 shadow-sm sm:inline-block">
          {mode === "assigned" ? "Pembebanan ruas sampel" : mode === "proxy" ? "Arus ilustratif koridor" : "Jaringan belum tersedia"}
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-3 right-3 z-[900] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] font-bold tracking-wide text-slate-700 shadow-sm">
        {label || (isBefore ? "SEBELUM" : "SESUDAH")}
      </span>
      {roads.length === 0 && (
        <div className="pointer-events-none absolute inset-x-5 top-1/2 z-[800] -translate-y-1/2 rounded-xl border border-slate-200 bg-white/95 px-5 py-4 text-center text-xs leading-6 text-slate-600 shadow-sm">
          Peta dasar tersedia. Jaringan koridor dan animasi kendaraan akan terlihat setelah rute OSRM berhasil dimuat.
        </div>
      )}
    </div>
  );
}
