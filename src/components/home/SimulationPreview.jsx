
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { TMD_BOUNDS } from "../../data/tmdNetwork";
import { DEFAULT_DENSITY } from "./simulationEngine";
import SimulationDataPanel from "./SimulationDataPanel";
import SimulationMapControls from "./SimulationMapControls";
import { formatNumber, getZoneMatInsights } from "./simulationUtils";
import { useSimulationMap } from "./useSimulationMap";
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

  // Data
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Simulasi
  const [scenario, setScenario] = useState(initialScenario);
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [playing, setPlaying] = useState(true);

  // Layer MAT
  const [showHeat, setShowHeat] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showOD, setShowOD] = useState(true);

  // Mode TMD
  const [networkOnly, setNetworkOnly] = useState(false);

  // Kontrol
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

  useSimulationMap({
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
  });

  // Bagian pembaruan heatmap

  useEffect(() => {
    redrawHeatRef.current();
  }, [showHeat, scenario, networkOnly]);

  // Bagian visibilitas zona dan hotspot MAT

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

  // Bagian visibilitas layer OD

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

  // Bagian aksi peta

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

  // Bagian data MAT

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

  // Bagian render

  return (
    <div className="mx-auto w-full max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:rounded-3xl sm:p-3">

      <SimulationMapControls
        mapElement={mapElement}
        mapRef={mapRef}
        mode={mode}
        networkOnly={networkOnly}
        onShowAllZones={showAllZones}
        onFocusStreet={focusStreet}
        onToggleNetworkOnly={toggleNetworkOnly}
        playing={playing}
        setPlaying={setPlaying}
        onReset={reset}
        loading={loading}
        error={error}
        visibleCount={visibleCount}
      />

      <SimulationDataPanel
        networkOnly={networkOnly}
        showScenarioControls={showScenarioControls}
        scenario={scenario}
        setScenario={setScenario}
        density={density}
        setDensity={setDensity}
        showHeat={showHeat}
        setShowHeat={setShowHeat}
        showOD={showOD}
        setShowOD={setShowOD}
        showHotspots={showHotspots}
        setShowHotspots={setShowHotspots}
        zones={zones}
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        network={network}
        insights={insights}
        afterTotal={afterTotal}
        shownOD={shownOD}
      />
    </div>
  );
}
