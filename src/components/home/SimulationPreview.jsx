import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Map as MapIcon,
  Layers3,
  Navigation,
  Route,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  Plus,
  Minus,
} from "lucide-react";

/*
 * Leaflet replacement for SimulationPreview.
 * No MapLibre, WebGL, or Worker URL configuration is needed.
 * Routes and vehicle movement below are illustrative, not SUMO output.
 */

const CENTER = [-8.6705, 115.2166];

const CORRIDORS = {
  central: {
    name: "Pusat Denpasar – Sanur",
    color: "#B91C1C",
    coordinates: [
      [-8.6612, 115.1942], [-8.6628, 115.1990],
      [-8.6643, 115.2053], [-8.6660, 115.2115],
      [-8.6678, 115.2185], [-8.6700, 115.2255],
      [-8.6724, 115.2330], [-8.6752, 115.2395],
      [-8.6788, 115.2460], [-8.6840, 115.2510],
      [-8.6908, 115.2550],
    ],
  },
  northSouth: {
    name: "Denpasar Utara – Selatan",
    color: "#2563EB",
    coordinates: [
      [-8.6365, 115.2045], [-8.6448, 115.2055],
      [-8.6515, 115.2073], [-8.6596, 115.2088],
      [-8.6680, 115.2107], [-8.6776, 115.2120],
      [-8.6862, 115.2132], [-8.6950, 115.2147],
      [-8.7030, 115.2162],
    ],
  },
  southCoast: {
    name: "Sesetan – Mertasari",
    color: "#D97706",
    coordinates: [
      [-8.6872, 115.2080], [-8.6898, 115.2145],
      [-8.6930, 115.2208], [-8.6970, 115.2282],
      [-8.7010, 115.2360], [-8.7060, 115.2433],
      [-8.7112, 115.2506], [-8.7155, 115.2570],
    ],
  },
};

const STOPS = [
  { name: "Area Terminal Ubung", coordinates: [-8.6368, 115.2052] },
  { name: "Area Teuku Umar", coordinates: [-8.6672, 115.2102] },
  { name: "Area Renon", coordinates: [-8.6698, 115.2280] },
  { name: "Area Titi Banda", coordinates: [-8.6796, 115.2472] },
  { name: "Area Mertasari", coordinates: [-8.7143, 115.2562] },
];

const VEHICLES = [
  { id: "bus-1", type: "bus", route: "central", color: "#FFFFFF", speed: 0.0013, offset: 0.08 },
  { id: "bus-2", type: "bus", route: "northSouth", color: "#FFFFFF", speed: 0.0012, offset: 0.57 },
  { id: "car-1", type: "car", route: "central", color: "#DC2626", speed: 0.0017, offset: 0.21 },
  { id: "car-2", type: "car", route: "central", color: "#2563EB", speed: 0.0018, offset: 0.64 },
  { id: "car-3", type: "car", route: "northSouth", color: "#F8FAFC", speed: 0.0016, offset: 0.12 },
  { id: "car-4", type: "car", route: "southCoast", color: "#F59E0B", speed: 0.0016, offset: 0.37 },
  { id: "car-5", type: "car", route: "northSouth", color: "#475569", speed: 0.0015, offset: 0.83 },
  { id: "feeder-1", type: "feeder", route: "southCoast", color: "#FDE68A", speed: 0.0014, offset: 0.70 },
  { id: "motor-1", type: "motor", route: "central", color: "#111827", speed: 0.0020, offset: 0.38 },
  { id: "motor-2", type: "motor", route: "northSouth", color: "#1D4ED8", speed: 0.0021, offset: 0.75 },
  { id: "motor-3", type: "motor", route: "southCoast", color: "#E11D48", speed: 0.0020, offset: 0.15 },
];

function segmentDistance(a, b) {
  const meanLat = ((a[0] + b[0]) / 2) * Math.PI / 180;
  return Math.hypot(
    b[0] - a[0],
    (b[1] - a[1]) * Math.cos(meanLat)
  );
}

function buildRouteInfo(coordinates) {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i += 1) {
    cumulative.push(
      cumulative[i - 1] + segmentDistance(coordinates[i - 1], coordinates[i])
    );
  }
  return { cumulative, total: cumulative[cumulative.length - 1] };
}

const ROUTE_INFO = Object.fromEntries(
  Object.entries(CORRIDORS).map(([id, route]) => [
    id,
    buildRouteInfo(route.coordinates),
  ])
);

function positionOnRoute(routeId, progress) {
  const coords = CORRIDORS[routeId].coordinates;
  const info = ROUTE_INFO[routeId];
  const target = Math.max(0, Math.min(1, progress)) * info.total;
  let i = 0;

  while (i < coords.length - 2 && target > info.cumulative[i + 1]) i += 1;

  const a = coords[i];
  const b = coords[i + 1];
  const start = info.cumulative[i];
  const end = info.cumulative[i + 1];
  const t = (target - start) / Math.max(end - start, 1e-10);
  const lat = a[0] + (b[0] - a[0]) * t;
  const lng = a[1] + (b[1] - a[1]) * t;
  const dx = (b[1] - a[1]) * Math.cos(lat * Math.PI / 180);
  const dy = b[0] - a[0];

  return {
    coordinates: [lat, lng],
    bearing: Math.atan2(dx, dy) * 180 / Math.PI,
  };
}

function vehiclePosition(vehicle, elapsed) {
  // Ping-pong movement prevents a vehicle teleporting to the route start.
  const cycle = ((vehicle.offset + elapsed * vehicle.speed) % 2 + 2) % 2;
  const forward = cycle <= 1;
  const point = positionOnRoute(vehicle.route, forward ? cycle : 2 - cycle);
  return { ...point, bearing: forward ? point.bearing : point.bearing + 180 };
}

function vehicleSvg(vehicle) {
  const color = vehicle.color;

  if (vehicle.type === "bus") {
    return `<svg viewBox="0 0 84 34" width="100%" height="100%" aria-hidden="true">
      <rect x="1" y="2" width="82" height="30" rx="5" fill="#26323D"/>
      <rect x="3" y="3" width="78" height="28" rx="5" fill="#FFFFFF"/>
      <rect x="10" y="7" width="55" height="19" rx="3" fill="#D5E1E6"/>
      <rect x="13" y="9" width="13" height="15" rx="2" fill="#334155"/>
      <rect x="29" y="9" width="13" height="15" rx="2" fill="#334155"/>
      <rect x="45" y="9" width="13" height="15" rx="2" fill="#334155"/>
      <rect x="68" y="8" width="9" height="18" rx="2" fill="#334155"/>
      <rect x="4" y="27" width="76" height="4" rx="1" fill="#B91C1C"/>
      <rect x="77" y="8" width="3" height="5" rx="1" fill="#FEF3C7"/>
      <rect x="77" y="21" width="3" height="5" rx="1" fill="#FEF3C7"/>
    </svg>`;
  }

  if (vehicle.type === "motor") {
    return `<svg viewBox="0 0 42 22" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="7" cy="12" rx="6" ry="4" fill="#111827"/>
      <ellipse cx="35" cy="12" rx="6" ry="4" fill="#111827"/>
      <path d="M8 12 L15 8 L27 8 L34 12" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
      <rect x="15" y="5" width="12" height="9" rx="4" fill="${color}"/>
      <circle cx="21" cy="9" r="3" fill="#334155"/>
    </svg>`;
  }

  const feeder = vehicle.type === "feeder";
  return `<svg viewBox="0 0 70 34" width="100%" height="100%" aria-hidden="true">
    <rect x="2" y="3" width="66" height="28" rx="${feeder ? 6 : 9}" fill="#26323D"/>
    <rect x="4" y="4" width="62" height="26" rx="${feeder ? 5 : 8}" fill="${color}"/>
    <rect x="17" y="7" width="36" height="19" rx="5" fill="#334155"/>
    <rect x="21" y="9" width="11" height="15" rx="2" fill="#83A7B8"/>
    <rect x="38" y="9" width="11" height="15" rx="2" fill="#83A7B8"/>
    ${feeder ? '<rect x="5" y="26" width="60" height="3" fill="#B91C1C"/>' : ""}
    <rect x="64" y="9" width="3" height="5" rx="1" fill="#FEF3C7"/>
    <rect x="64" y="21" width="3" height="5" rx="1" fill="#FEF3C7"/>
  </svg>`;
}

function makeVehicleIcon(vehicle, bearing = 0) {
  const sizes = {
    bus: [46, 20],
    car: [29, 16],
    feeder: [35, 18],
    motor: [19, 11],
  };
  const [width, height] = sizes[vehicle.type];

  return L.divIcon({
    className: "denpasar-vehicle-icon",
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    html: `<div class="denpasar-vehicle-art"
      style="width:${width}px;height:${height}px;transform:rotate(${bearing - 90}deg)">
      ${vehicleSvg(vehicle)}
    </div>`,
  });
}

function makeStopIcon() {
  return L.divIcon({
    className: "denpasar-stop-icon",
    iconSize: [17, 17],
    iconAnchor: [8.5, 8.5],
    html: `<div style="width:15px;height:15px;border:3px solid #B91C1C;
      border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.22)"></div>`,
  });
}

const buttonClass = (active) =>
  `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
    active ? "bg-[#B91C1C] text-white" : "bg-white/10 text-white hover:bg-white/20"
  }`;

export default function SimulationPreview() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const vehicleMarkersRef = useRef([]);
  const stopMarkersRef = useRef([]);
  const routeGroupRef = useRef(null);
  const frameRef = useRef(null);
  const elapsedRef = useRef(0);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("overview");
  const [traffic, setTraffic] = useState(true);
  const [playing, setPlaying] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Initialize Leaflet and OpenStreetMap tiles.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    let disposed = false;
    let tileLoaded = false;
    let loadTimeout = null;
    let resizeObserver;
    let map;

    try {
      map = L.map(containerRef.current, {
        center: CENTER,
        zoom: 12.5,
        zoomControl: false,
        scrollWheelZoom: false,
        preferCanvas: true,
      });
      mapRef.current = map;
      L.control.zoom({ position: "topright" }).addTo(map);

      const tiles = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ).addTo(map);

      tiles.on("load", () => {
        tileLoaded = true;
        if (loadTimeout) window.clearTimeout(loadTimeout);
        if (!disposed) {
          setError("");
          setStatus("ready");
        }
      });

      tiles.on("tileerror", () => {
        if (!disposed && !tileLoaded) {
          setError("Tile peta belum berhasil dimuat. Periksa koneksi internet atau coba muat ulang.");
        }
      });

      loadTimeout = window.setTimeout(() => {
        if (!disposed && !tileLoaded) {
          setError("Peta belum berhasil dimuat dalam 15 detik. Periksa koneksi internet atau akses layanan OpenStreetMap.");
          setStatus("error");
        }
      }, 15000);

      const routeGroup = L.layerGroup();
      Object.values(CORRIDORS).forEach((corridor) => {
        L.polyline(corridor.coordinates, {
          color: "#FFFFFF",
          weight: 7,
          opacity: 0.88,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(routeGroup);

        L.polyline(corridor.coordinates, {
          color: corridor.color,
          weight: 3.5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(routeGroup);
      });
      routeGroup.addTo(map);
      routeGroupRef.current = routeGroup;

      STOPS.forEach((stop) => {
        const marker = L.marker(stop.coordinates, {
          icon: makeStopIcon(),
          title: stop.name,
          zIndexOffset: 500,
        })
          .bindPopup(
            `<strong>${stop.name}</strong><br/><span style="font-size:12px">Titik referensi ilustratif, bukan verifikasi halte resmi.</span>`
          )
          .addTo(map);

        const element = marker.getElement();
        if (element) {
          element.style.background = "transparent";
          element.style.border = "0";
        }
        stopMarkersRef.current.push(marker);
      });

      VEHICLES.forEach((vehicle) => {
        const point = vehiclePosition(vehicle, elapsedRef.current);
        const marker = L.marker(point.coordinates, {
          icon: makeVehicleIcon(vehicle, point.bearing),
          interactive: false,
          keyboard: false,
          zIndexOffset:
            vehicle.type === "bus" ? 400 :
            vehicle.type === "feeder" ? 300 :
            vehicle.type === "car" ? 200 : 100,
        }).addTo(map);

        const element = marker.getElement();
        if (element) {
          element.style.background = "transparent";
          element.style.border = "0";
          element.style.pointerEvents = "none";
          element.style.filter = "drop-shadow(0 2px 3px rgba(15,23,42,.25))";
        }
        vehicleMarkersRef.current.push({ marker, vehicle });
      });

      resizeObserver = typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!disposed && mapRef.current) {
              mapRef.current.invalidateSize({ pan: false });
            }
          })
        : null;

      if (resizeObserver && containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      requestAnimationFrame(() => {
        if (!disposed) map.invalidateSize();
      });
    } catch (err) {
      console.error("[Denpasar Leaflet]", err);
      setError(err?.message || "Gagal menginisialisasi peta.");
      setStatus("error");
    }

    return () => {
      disposed = true;
      if (loadTimeout) window.clearTimeout(loadTimeout);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      resizeObserver?.disconnect();
      vehicleMarkersRef.current.forEach(({ marker }) => marker.remove());
      stopMarkersRef.current.forEach((marker) => marker.remove());
      vehicleMarkersRef.current = [];
      stopMarkersRef.current = [];
      routeGroupRef.current = null;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  // Leaflet is 2D. The overview and POV modes change zoom and follow position.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    if (mode === "2d") {
      map.flyTo(CENTER, 11.8, { duration: 0.7 });
    } else if (mode === "overview") {
      map.flyTo(CENTER, 13, { duration: 0.7 });
    } else if (mode === "pov") {
      const car = VEHICLES.find((item) => item.id === "car-1");
      if (car) {
        const point = vehiclePosition(car, elapsedRef.current);
        map.flyTo(point.coordinates, 16.5, { duration: 0.8 });
      }
    }
  }, [mode, status]);

  // Toggle illustrative corridors and moving vehicles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    vehicleMarkersRef.current.forEach(({ marker }) => {
      const element = marker.getElement();
      if (element) element.style.display = traffic ? "" : "none";
    });

    const group = routeGroupRef.current;
    if (group) {
      if (traffic && !map.hasLayer(group)) group.addTo(map);
      if (!traffic && map.hasLayer(group)) map.removeLayer(group);
    }
  }, [traffic, status]);

  // Animate the demo vehicles.
  useEffect(() => {
    if (status !== "ready" || !playing) return undefined;

    let previousTime = null;
    let lastMarkerUpdate = 0;
    let lastCameraUpdate = 0;

    const animate = (time) => {
      if (previousTime === null) previousTime = time;
      const delta = Math.min((time - previousTime) / 1000, 0.1);
      previousTime = time;
      elapsedRef.current += delta;

      if (time - lastMarkerUpdate >= 40) {
        lastMarkerUpdate = time;
        let followed = null;

        vehicleMarkersRef.current.forEach(({ marker, vehicle }) => {
          const point = vehiclePosition(vehicle, elapsedRef.current);
          marker.setLatLng(point.coordinates);

          const artwork = marker.getElement()?.querySelector(".denpasar-vehicle-art");
          if (artwork) {
            artwork.style.transform = `rotate(${point.bearing - 90}deg)`;
          }
          if (vehicle.id === "car-1") followed = point;
        });

        if (mode === "pov" && followed && time - lastCameraUpdate >= 120) {
          lastCameraUpdate = time;
          mapRef.current?.panTo(followed.coordinates, { animate: false });
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [status, playing, mode]);

  const reset = useCallback(() => {
    elapsedRef.current = 0;
    setMode("overview");
    setTraffic(true);
    setPlaying(true);

    vehicleMarkersRef.current.forEach(({ marker, vehicle }) => {
      const point = vehiclePosition(vehicle, 0);
      marker.setLatLng(point.coordinates);
      const artwork = marker.getElement()?.querySelector(".denpasar-vehicle-art");
      if (artwork) artwork.style.transform = `rotate(${point.bearing - 90}deg)`;
    });

    mapRef.current?.flyTo(CENTER, 13, { duration: 0.7 });
  }, []);

  const retry = useCallback(() => window.location.reload(), []);
  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  return (
    <div className="mx-auto w-full max-w-[1280px] rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-3">
      <div className="relative h-[420px] overflow-hidden rounded-[22px] bg-[#E8ECE6] sm:h-[520px] lg:h-[650px]">
        <div
          ref={containerRef}
          className="denpasar-leaflet-map absolute inset-0 z-0 h-full w-full"
          aria-label="Peta interaktif demonstrasi Denpasar"
        />

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-50/70">
            <div className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow">
              Memuat peta Denpasar...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-50/90 p-5">
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
              <div className="mb-3 flex items-center gap-3">
                <AlertTriangle size={23} className="text-red-600" />
                <h3 className="font-bold text-slate-900">Peta belum berhasil dimuat</h3>
              </div>
              <p className="break-words text-sm leading-6 text-slate-600">
                {error || "Periksa koneksi internet dan akses tile OpenStreetMap."}
              </p>
              <button
                onClick={retry}
                className="mt-5 rounded-full bg-[#B91C1C] px-5 py-3 text-xs font-semibold text-white transition hover:bg-red-800"
              >
                Coba Muat Ulang
              </button>
            </div>
          </div>
        )}

        {status === "ready" && error && (
          <div className="absolute bottom-28 left-4 right-4 z-20 mx-auto max-w-lg rounded-xl border border-amber-200 bg-white/95 px-4 py-3 text-xs text-slate-700 shadow">
            {error}
          </div>
        )}

        <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#252B2F]/95 p-2 shadow-lg backdrop-blur-md sm:left-5 sm:right-auto sm:top-5">
          <span className="hidden px-3 text-[11px] font-black tracking-wider text-white lg:block">
            DENPASAR MOBILITY LAB
          </span>
          <button onClick={() => setMode("2d")} aria-pressed={mode === "2d"} className={buttonClass(mode === "2d")}>
            <MapIcon size={15} /> 2D
          </button>
          <button onClick={() => setMode("overview")} aria-pressed={mode === "overview"} className={buttonClass(mode === "overview")}>
            <Layers3 size={15} /> Area View
          </button>
          <button onClick={() => setMode("pov")} aria-pressed={mode === "pov"} className={buttonClass(mode === "pov")}>
            <Navigation size={15} /> POV Mobil
          </button>
          <button onClick={() => setTraffic((value) => !value)} aria-pressed={traffic} className={buttonClass(traffic)}>
            <Route size={15} /> <span className="hidden sm:inline">Traffic</span>
          </button>
          <button onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Jeda animasi" : "Jalankan animasi"} className={buttonClass(false)}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button onClick={zoomIn} aria-label="Perbesar peta" className={buttonClass(false)}>
            <Plus size={15} />
          </button>
          <button onClick={zoomOut} aria-label="Perkecil peta" className={buttonClass(false)}>
            <Minus size={15} />
          </button>
          <button onClick={reset} aria-label="Reset peta" className={buttonClass(false)}>
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="absolute right-4 top-[76px] z-10 hidden rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:right-5 sm:top-[76px] xl:block">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${status === "ready" ? "bg-green-500" : "bg-amber-500"}`} />
          Denpasar — {mode === "pov" ? "POV Mobil" : mode === "2d" ? "2D Map" : "Area View"}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Denpasar Mobility Preview</p>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                Peta OpenStreetMap dengan animasi mobil, motor, bus, feeder, dan titik referensi.
                Jalur serta gerak kendaraan masih berupa demonstrasi dan belum mengikuti
                geometri jalan atau hasil SUMO. POV mengikuti kendaraan dari tampilan peta
                atas, bukan kamera 3D.
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-semibold text-[#B91C1C]">
              MAP PREVIEW
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
