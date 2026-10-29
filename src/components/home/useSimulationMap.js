import { useEffect } from "react";
import L from "leaflet";
import { getDenpasarNetwork } from "../../data/denpasarNetworkBrowser";
import { addTmdNetworkLayer, TMD_BOUNDS } from "../../data/tmdNetwork";
import {
  buildVehicles,
  CITY,
  clamp,
  createZoneIcon,
  chooseNextRoad,
  drawVehicle,
  laneGap,
  MAX_DENSITY,
  SIMULATION_SPEED,
  vehicleScale,
} from "./simulationEngine";
import { formatNumber, getZoneMatInsights } from "./simulationUtils";

export function useSimulationMap({
  mapElement,
  canvasElement,
  mapRef,
  tmdLayerRef,
  zoneLayerRef,
  hotspotLayerRef,
  odLayerRef,
  redrawHeatRef,
  sceneRef,
  settingsRef,
  setVisibleCount,
  setOrigin,
  setNetwork,
  setLoading,
  setError,
}) {
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
    // Bagian canvas kendaraan

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

    // Refs bridge React with Leaflet's imperative canvas lifecycle.
    // eslint-disable-next-line react/immutability
    canvasElement.current = vehicleCanvas;
    // Bagian jaringan TMD

    // eslint-disable-next-line react/immutability
    tmdLayerRef.current = addTmdNetworkLayer(map, {
      animateBuses: true,
    });
    // Bagian ukuran canvas

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
    // Bagian heatmap

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
    // Bagian animasi kendaraan

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
    // Bagian gambar kendaraan

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

      // In network-only mode, hide the MAT heatmap and vehicles.
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
    // Bagian frame animasi

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
    // Bagian perubahan tampilan peta

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
    // Bagian pemuatan jaringan jalan

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
    // Bagian lingkaran zona MAT

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
    // Bagian penanda zona MAT

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
    // Bagian pembersihan

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
  // Leaflet initializes once; changing simulation values are read through refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
