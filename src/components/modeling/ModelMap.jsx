import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addTmdNetworkLayer } from "../../data/tmdNetwork";
import { createODFlowLayer } from "../../data/odVisualization";
import {
  CarFront,
  LocateFixed,
  Map as MapIcon,
  Minus,
  Network,
  Pause,
  Play,
  Plus,
  Route,
} from "lucide-react";

import { MODEL_ZONES } from "../../data/modelEngine";
import {
  advanceVehicles,
  buildScene,
  clamp,
  createVehicles,
  drawVehicle,
  getVehiclePreset,
  INITIAL_VIEW,
  pointAlongRoad,
  prepareRoads,
  RED,
  zoneIcon,
} from "./modelMapUtils";

// Bagian peta model

export default function ModelMap({
  stage = "before",
  model,
  assignment,
  graph,

  selectedZone = "Z11",
  onSelectZone,

  label,
  compact = false,
  displayMode = "all",
  onDisplayModeChange,

  syncView,
  onViewChange,
}) {
  const mapContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const mapRef = useRef(null);
  const tmdLayerRef = useRef(null);
  const roadLayerRef = useRef(null);
  const zoneLayerRef = useRef(null);
  const matActivityLayerRef = useRef(null);

  const vehiclesRef = useRef([]);

  const sceneRef = useRef({
    byId: new Map(),
    outgoing: new Map(),
  });

  const settingsRef = useRef({});

  const selectRef = useRef(onSelectZone);
  const viewRef = useRef(onViewChange);

  const [playing, setPlaying] = useState(true);
  const [showOD, setShowOD] = useState(false);

  const isBefore = stage === "before";
  const showTmdLayer = displayMode !== "roads";

  function changeDisplayMode(nextMode) {
    if (nextMode === "tmd") {
      setShowOD(false);
    }

    onDisplayModeChange?.(nextMode);
  }

  // Bagian persiapan jaringan

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

  // Nilai terbaru untuk animasi
  settingsRef.current = {
    isBefore,
    playing,
    displayMode,
    reference,
  };

  selectRef.current = onSelectZone;
  viewRef.current = onViewChange;

  // Bagian inisialisasi Leaflet

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

    const matActivityPane = map.createPane("dmMatActivityPane");
    matActivityPane.style.zIndex = "420";
    matActivityPane.style.pointerEvents = "auto";

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
      matActivityLayerRef.current = null;
    };

    // Peta dibuat satu kali per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !showTmdLayer) {
      return;
    }

    const tmdLayer = addTmdNetworkLayer(map, {
      animateBuses: true,
    });

    tmdLayerRef.current = tmdLayer;

    return () => {
      tmdLayer.destroy?.();

      if (tmdLayerRef.current === tmdLayer) {
        tmdLayerRef.current = null;
      }
    };
  }, [showTmdLayer]);

  // Bagian sinkronisasi kamera

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

  // Bagian penanda zona

  useEffect(() => {
    const map = mapRef.current;
    const group = zoneLayerRef.current;

    if (!map || !group) {
      return;
    }

    group.clearLayers();

    if (displayMode === "tmd") {
      if (map.hasLayer(group)) {
        map.removeLayer(group);
      }
      return;
    }

    if (!map.hasLayer(group)) {
      group.addTo(map);
    }

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
  }, [displayMode, selectedZone]);

  useEffect(() => {
    const map = mapRef.current;
    const matrix = isBefore
      ? model?.matrixBefore
      : model?.matrixAfter;

    if (
      !map ||
      displayMode === "tmd" ||
      !Array.isArray(matrix) ||
      !Array.isArray(model?.matrixBefore)
    ) {
      return;
    }

    const calculateActivities = (values) =>
      MODEL_ZONES.map((zone, index) => {
        const outgoing = (values[index] || []).reduce(
          (sum, value) => sum + (Number(value) || 0),
          0,
        );
        const incoming = values.reduce(
          (sum, row) => sum + (Number(row?.[index]) || 0),
          0,
        );
        return {
          zone,
          outgoing,
          incoming,
        };
      });

    const totals = calculateActivities(matrix);
    const maximum = Math.max(
      1,
      ...totals.map(({ incoming }) => incoming),
    );
    const strongestOrigins = new Set(
      [...totals]
        .sort((a, b) => b.outgoing - a.outgoing)
        .slice(0, 2)
        .map(({ zone }) => zone.id),
    );
    const strongestDestinations = new Set(
      [...totals]
        .sort((a, b) => b.incoming - a.incoming)
        .slice(0, 2)
        .map(({ zone }) => zone.id),
    );
    const layer = L.layerGroup();

    for (const { zone, outgoing, incoming } of totals) {
      const intensity = incoming / maximum;
      const selected = zone.id === selectedZone;
      const color = selected
        ? RED
        : strongestDestinations.has(zone.id)
          ? "#2563EB"
          : strongestOrigins.has(zone.id)
            ? RED
            : "#F59E0B";

      L.circleMarker([zone.lat, zone.lng], {
        pane: "dmMatActivityPane",
        radius: 18 + 24 * Math.sqrt(intensity),
        color,
        weight: selected ? 3 : 2,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: 0.1,
      })
        .bindTooltip(
          `<strong>${zone.id} · ${zone.name}</strong>` +
            `<br/>Bangkitan: ${Math.round(outgoing).toLocaleString("id-ID")} smp/jam` +
            `<br/>Tarikan: ${Math.round(incoming).toLocaleString("id-ID")} smp/jam` +
            `<br/>Ukuran lingkaran mengikuti tarikan MAT relatif.`,
        )
        .on("click", () => selectRef.current?.(zone.id))
        .addTo(layer);
    }

    layer.addTo(map);
    matActivityLayerRef.current = layer;

    return () => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }

      if (matActivityLayerRef.current === layer) {
        matActivityLayerRef.current = null;
      }
    };
  }, [model, isBefore, selectedZone, displayMode]);

  // Bagian layer jalan dan kendaraan

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

    if (displayMode !== "tmd") {
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
          weight: 1.8,
          opacity: 0.52,
          interactive: false,
          smoothFactor: 0,
        }).addTo(group);
      });
    }

    if (showOD && displayMode !== "tmd") {
      const flows = (model?.pairs || [])
        .map((pair) => ({
          origin: pair.origin,
          destination: pair.destination,
          flow: isBefore ? pair.before : pair.after,
        }))
        .filter(
          ({ origin, destination, flow }) =>
            destination.id === selectedZone &&
            origin.id !== selectedZone &&
            flow > 0,
        )
        .map(({ origin, flow }) => ({ origin, value: flow }));
      const target = MODEL_ZONES.find((zone) => zone.id === selectedZone);
      const strongestOrigin = flows.reduce(
        (strongest, flow) =>
          !strongest || flow.value > strongest.value ? flow : strongest,
        null,
      );

      if (target) {
        createODFlowLayer(
          flows,
          target,
          strongestOrigin?.origin.id,
          (value) => Math.round(value).toLocaleString("id-ID"),
        ).addTo(group);
      }
    }
  }, [roads, displayMode, isBefore, reference, model, selectedZone, showOD]);

  // Bagian animasi kendaraan

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

      if (settings.displayMode === "tmd") {
        return;
      }

      const scene = sceneRef.current;
      const vehicles = vehiclesRef.current;

      const after = !settings.isBefore;

      if (settings.playing && !reducedMotion) {
        advanceVehicles(vehicles, scene, dt, after, settings.reference);
      }

      const preset = getVehiclePreset(map.getZoom());
      const projectedSegments = new WeakMap();

      // Bagian gambar kendaraan

      for (const car of vehicles) {
        if (car.state === "waiting" || car.sample > preset.visibility) {
          continue;
        }

        const road = scene.byId.get(car.roadId);

        if (!road) {
          continue;
        }

        const point = pointAlongRoad(road, car.distance);

        // Koordinat posisi kendaraan,
        // arah, dan jalan diproyeksikan
        // oleh instance Leaflet yang sama.

        let projectedEnds = projectedSegments.get(point.start);

        if (!projectedEnds) {
          projectedEnds = new WeakMap();
          projectedSegments.set(point.start, projectedEnds);
        }

        let projected = projectedEnds.get(point.end);

        if (!projected) {
          projected = {
            start: map.latLngToLayerPoint(point.start),
            end: map.latLngToLayerPoint(point.end),
          };
          projectedEnds.set(point.end, projected);
        }

        const position = map.latLngToLayerPoint([point.lat, point.lng]);
        const { start: screenStart, end: screenEnd } = projected;

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

        ctx.globalAlpha = clamp(
          car.alpha * car.scenarioVisibility,
          0,
          1,
        );

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

  // Bagian kontrol tampilan

  const resetView = useCallback(() => {
    mapRef.current?.setView(
      [INITIAL_VIEW.lat, INITIAL_VIEW.lng],
      INITIAL_VIEW.zoom,
      {
        animate: false,
      },
    );
  }, []);

  // Bagian render

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

      {/* MAP DISPLAY MODES */}

      <div
        className="
          absolute left-2 top-2 z-[900] w-fit max-w-[calc(100%-1rem)]
          flex flex-wrap items-center gap-1
          rounded-xl
          border border-slate-200
          bg-white/95 p-1
          shadow-sm
        "
      >
        <button
          type="button"
          onClick={() => changeDisplayMode("roads")}
          aria-pressed={displayMode === "roads"}
          className={`
            flex items-center gap-1.5 rounded-lg px-2.5 py-2
            text-[11px] font-semibold
            transition-colors
            ${
              displayMode === "roads"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }
          `}
        >
          <CarFront size={14} />
          Jaringan Jalan
        </button>

        <button
          type="button"
          onClick={() => changeDisplayMode("tmd")}
          aria-pressed={displayMode === "tmd"}
          className={`
            flex items-center gap-1
            rounded-lg px-2.5 py-2
            text-[11px] font-semibold
            transition-colors
            ${
              displayMode === "tmd"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }
          `}
        >
          <Network size={14} />
          Jaringan TMD
        </button>

        <button
          type="button"
          onClick={() => changeDisplayMode("all")}
          aria-pressed={displayMode === "all"}
          className={`
            flex items-center gap-1.5 rounded-lg px-2.5 py-2
            text-[11px] font-semibold transition-colors
            ${
              displayMode === "all"
                ? "bg-[#B91C1C] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }
          `}
        >
          <MapIcon size={14} />
          Denpasar Bali
        </button>

        <button
          type="button"
          onClick={() => setShowOD((visible) => !visible)}
          disabled={displayMode === "tmd"}
          aria-pressed={showOD}
          title={
            displayMode === "tmd"
              ? "OD tersedia pada mode Jaringan Jalan dan Denpasar Bali"
              : undefined
          }
          className={`
            flex items-center gap-1.5 rounded-lg px-2.5 py-2
            text-[11px] font-semibold transition-colors
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              showOD
                ? "bg-[#B91C1C] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }
          `}
        >
          <Route size={14} />
          Tampilkan OD
        </button>
      </div>

      {displayMode !== "tmd" && (
        <div className="absolute left-3 top-32 z-[900] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 text-[10px] font-medium text-slate-600 shadow-sm">
          {[
            ["#0F766E", "Rendah"],
            ["#D3AD4C", "Sedang"],
            ["#E58C32", "Tinggi"],
            ["#B91C1C", "Sangat padat"],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* ZOOM CONTROLS */}

      <div
        className="
          absolute right-3 top-24 z-[900]
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

      {!roads.length && displayMode !== "tmd" && (
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

    </div>
  );
}
