
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Minus, Pause, Play, Plus, Route } from "lucide-react";
import { MODEL_ZONES } from "../../data/modelEngine";

const ACCENT = "#B91C1C";
const MIN_ZOOM = 10;
const MAX_ZOOM = 18;
const ID_FORMAT = (x) => Math.round(x || 0).toLocaleString("id-ID");

function markerIcon(zoneId, selected) {
  return L.divIcon({
    className: "dm-zone-marker",
    html: `<span style="display:grid;place-items:center;width:33px;height:30px;border-radius:10px;background:${selected ? ACCENT : "#fff"};color:${selected ? "#fff" : "#273344"};border:1px solid ${selected ? ACCENT : "#cbd5e1"};box-shadow:0 3px 12px #0f172a1f;font:700 10px system-ui;">${zoneId}</span>`,
    iconSize: [33, 30],
    iconAnchor: [16.5, 15],
  });
}

/**
 * Interaktif untuk 13 zona, volume ruas sampel, dan animasi kendaraan ilustratif.
 * Tile OSM dimuat secara daring. Animasi TIDAK merepresentasikan GPS real-time.
 * Peta tidak dihancurkan ketika stage / opsi tampilan berubah.
 */
export default function ModelMap({
  stage = "before",
  model,
  assignment,
  selectedZone = "Z11",
  onSelectZone = () => {},
}) {
  const element = useRef(null);
  const canvas = useRef(null);
  const mapRef = useRef(null);
  const markerLayer = useRef(null);
  const flowLayer = useRef(null);
  const settings = useRef({});
  const [playing, setPlaying] = useState(true);
  const [activeLayer, setActiveLayer] = useState("road");

  const sampleRoads = useMemo(
    () => (assignment?.roads || []).slice(0, 1400),
    [assignment]
  );

  settings.current = {
    sampleRoads,
    stage,
    playing,
    activeLayer,
  };

  // Map hanya dibuat satu kali per mounting komponen.
  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = L.map(element.current, {
      center: [-8.673, 115.216],
      zoom: 12,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      scrollWheelZoom: true,
      zoomSnap: 0.5,
      preferCanvas: true,
    });
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerLayer.current = L.layerGroup().addTo(map);
    flowLayer.current = L.layerGroup().addTo(map);

    map.fitBounds(MODEL_ZONES.map((z) => [z.lat, z.lng]), {
      padding: [35, 35], maxZoom: 12, animate: false,
    });

    const onResize = () => map.invalidateSize({ animate: false, pan: false });
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(onResize) : null;
    observer?.observe(element.current);
    return () => {
      observer?.disconnect();
      map.remove();
      mapRef.current = null;
      markerLayer.current = null;
      flowLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const group = markerLayer.current;
    if (!group) return;
    group.clearLayers();
    MODEL_ZONES.forEach((z) => {
      L.marker([z.lat, z.lng], {
        icon: markerIcon(z.id, z.id === selectedZone),
        title: z.name,
      })
        .bindTooltip(`${z.id} · ${z.name}`, { direction: "top" })
        .on("click", () => onSelectZone(z.id))
        .addTo(group);
    });
  }, [selectedZone, onSelectZone]);

  useEffect(() => {
    const group = flowLayer.current;
    if (!group) return;
    group.clearLayers();

    if (activeLayer === "road" && sampleRoads.length > 0) {
      const maxFlow = Math.max(1, assignment?.referenceFlow || 1);
      for (const road of sampleRoads) {
        const current = stage === "before" ? road.before : road.after;
        if (!current) continue;
        const intensity = Math.sqrt(Math.min(1, current / maxFlow));
        L.polyline([road.a, road.b], {
          color: stage === "before" ? "#B91C1C" : "#0F766E",
          opacity: 0.15 + intensity * 0.58,
          weight: 1 + 5 * intensity,
          lineCap: "round",
          interactive: false,
        }).addTo(group);
      }
    }

    // Garis OD hanya dari centroid ke centroid. Bukan jalan aktual.
    if (activeLayer === "od" || (activeLayer === "road" && sampleRoads.length === 0)) {
      for (const pair of (model?.pairs || []).slice(0, 20)) {
        const selected = pair.origin.id === selectedZone;
        L.polyline(
          [[pair.origin.lat, pair.origin.lng], [pair.destination.lat, pair.destination.lng]],
          {
            color: selected ? ACCENT : "#DA795C",
            weight: selected ? 2.8 : 1.3,
            opacity: selected ? 0.8 : 0.24,
            dashArray: "5 9",
            interactive: false,
          }
        ).addTo(group);
      }
    }
  }, [activeLayer, sampleRoads, assignment, model, stage, selectedZone]);

  // Kendaraan dibuat deterministik berdasarkan ruas. Tidak berpindah
  // ke ruas acak ketika zoom, peta digeser, atau stage berganti.
  const cars = useRef([]);
  useEffect(() => {
    const candidate = (assignment?.roads || []).filter((r) => r.before > 0 && r.length >= 2).slice(0, 350);
    cars.current = Array.from({ length: Math.min(candidate.length, 110) }, (_, i) => ({
      road: candidate[(i * 37) % candidate.length],
      t: ((i * 67 + 11) % 101) / 101,
      speed: 7 + (i % 5) * 1.7, // m/s; hanya untuk animasi ilustratif
      kind: i % 13 === 0 ? "bus" : i % 3 === 0 ? "motor" : "car",
    }));
  }, [assignment]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = canvas.current;
    if (!map || !layer) return;
    const context = layer.getContext("2d");
    if (!context) return;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let request = 0;
    let previous = 0;
    const draw = (now) => {
      const dt = Math.min(0.05, previous ? (now - previous) / 1000 : 0);
      previous = now;
      const { sampleRoads, activeLayer, playing, stage } = settings.current;
      const size = map.getSize();
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(size.x * scale);
      const height = Math.round(size.y * scale);
      if (layer.width !== width) layer.width = width;
      if (layer.height !== height) layer.height = height;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, size.x, size.y);
      if (activeLayer === "road" && sampleRoads.length > 0) {
        const max = Math.max(1, assignment?.referenceFlow || 1);
        for (const car of cars.current) {
          const volume = stage === "before" ? car.road.before : car.road.after;
          const visibility = Math.min(1, volume / Math.max(1, car.road.before));
          if (visibility < ((car.road.id * 41 + car.speed * 13) % 100) / 100) continue;
          if (playing && !prefersReducedMotion) {
            car.t = (car.t + dt * car.speed / Math.max(5, car.road.length)) % 1;
          }
          const a = map.latLngToContainerPoint(car.road.a);
          const b = map.latLngToContainerPoint(car.road.b);
          const x = a.x + (b.x - a.x) * car.t;
          const y = a.y + (b.y - a.y) * car.t;
          if (x < -15 || y < -15 || x > size.x + 15 || y > size.y + 15) continue;
          // Memudar di ujung ruas lalu muncul kembali di ruas yang sama.
          const fade = Math.min(1, car.t * 16, (1 - car.t) * 16);
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          const zoom = map.getZoom();
          const k = Math.max(0.4, Math.min(1.3, (zoom - 10) / 7));
          context.save();
          context.globalAlpha = Math.min(0.9, Math.sqrt(volume / max) + 0.35) * fade;
          context.translate(x, y);
          context.rotate(angle);
          context.fillStyle = car.kind === "bus" ? "#B91C1C" : car.kind === "motor" ? "#293647" : "#FFFFFF";
          context.strokeStyle = "#1E293B";
          context.lineWidth = 0.55;
          const w = (car.kind === "bus" ? 14 : car.kind === "motor" ? 5 : 9) * k;
          const h = (car.kind === "bus" ? 5 : car.kind === "motor" ? 2 : 4) * k;
          context.fillRect(-w / 2, -h / 2, w, h);
          context.strokeRect(-w / 2, -h / 2, w, h);
          context.restore();
        }
      }
      request = requestAnimationFrame(draw);
    };
    request = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(request);
  }, [assignment]);

  const center = () => {
    mapRef.current?.fitBounds(MODEL_ZONES.map((z) => [z.lat, z.lng]), {
      padding: [35, 35], maxZoom: 12, animate: true,
    });
  };

  return (
    <div className="relative h-[395px] min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-[#edf0ef] sm:h-[540px] lg:h-[600px]">
      <style>{`
        .dm-zone-marker { background: transparent; border: 0; }
        .dm-map-canvas { pointer-events: none; }
        @media (prefers-reduced-motion: reduce) {
          .dm-map-controls * { transition: none !important; }
        }
      `}</style>
      <div ref={element} className="absolute inset-0 z-0" aria-label="Peta jalan Denpasar berbasis OpenStreetMap" />
      <canvas ref={canvas} className="dm-map-canvas absolute inset-0 z-[450]" aria-hidden="true" />

      <div className="dm-map-controls absolute left-3 top-3 z-[900] flex max-w-[calc(100%-85px)] items-center gap-1 rounded-xl border border-white/80 bg-white/95 p-1 shadow-sm backdrop-blur-sm sm:left-4 sm:top-4">
        <button onClick={() => setActiveLayer("road")} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${activeLayer === "road" ? "bg-[#B91C1C] text-white" : "text-slate-600 hover:bg-slate-100"}`}>Volume ruas</button>
        <button onClick={() => setActiveLayer("od")} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${activeLayer === "od" ? "bg-[#B91C1C] text-white" : "text-slate-600 hover:bg-slate-100"}`}><Route size={13}/> OD</button>
      </div>

      <div className="dm-map-controls absolute right-3 top-3 z-[900] flex flex-col overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur-sm sm:right-4 sm:top-4">
        <button aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn(0.5)} className="grid h-10 w-10 place-items-center hover:bg-slate-100"><Plus size={17}/></button>
        <div className="mx-2 h-px bg-slate-200"/>
        <button aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut(0.5)} className="grid h-10 w-10 place-items-center hover:bg-slate-100"><Minus size={17}/></button>
        <div className="mx-2 h-px bg-slate-200"/>
        <button aria-label="Tampilkan semua zona" onClick={center} className="grid h-10 w-10 place-items-center hover:bg-slate-100"><LocateFixed size={17}/></button>
      </div>

      <div className="dm-map-controls absolute bottom-7 left-3 z-[900] flex flex-wrap items-center gap-2 sm:bottom-6 sm:left-4">
        <button onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Jeda kendaraan" : "Jalankan kendaraan"} className="inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          {playing ? <Pause size={13}/> : <Play size={13}/>} {playing ? "Jeda" : "Putar"}
        </button>
        <span className="hidden rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-sm backdrop-blur-sm sm:inline-flex">
          {activeLayer === "od" ? "Garis OD antarzona" : sampleRoads.length ? `${ID_FORMAT(sampleRoads.length)} ruas sampel` : "Jaringan ruas belum tersedia"}
        </span>
      </div>

      <span className="pointer-events-none absolute bottom-7 right-3 z-[900] rounded-lg bg-white/95 px-2.5 py-2 text-[10px] font-semibold text-slate-600 shadow-sm sm:bottom-6 sm:right-4">
        {stage === "before" ? "BEFORE · 2041" : stage === "process" ? "TDM · PROSES" : "AFTER · 2041"}
      </span>
    </div>
  );
}
