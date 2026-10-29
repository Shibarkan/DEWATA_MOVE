
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

import { TMD_BOUNDS } from "../../data/tmdNetwork";
import { createODFlowLayer } from "../../data/odVisualization";
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
  const [showOD, setShowOD] = useState(false);

  // Mode TMD
  const [networkOnly, setNetworkOnly] = useState(false);

  // Kontrol
  const [mapMode, setMapMode] = useState("all");
  const [origin, setOrigin] = useState("Z03");
  const [destination, setDestination] = useState("Z11");
  const [visibleCount, setVisibleCount] = useState(0);

  settingsRef.current = {
    scenario,
    density,
    playing,
    showHeat,
    showHotspots,
    networkOnly,
    mapMode,
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
  }, [showHeat, scenario, networkOnly, mapMode]);

  // Bagian visibilitas zona dan hotspot MAT

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const zoneLayer = zoneLayerRef.current;
    const hotspotLayer = hotspotLayerRef.current;

    if (zoneLayer) {
      if (mapMode === "tmd") {
        if (map.hasLayer(zoneLayer)) {
          map.removeLayer(zoneLayer);
        }
      } else if (!map.hasLayer(zoneLayer)) {
        zoneLayer.addTo(map);
      }
    }

    if (hotspotLayer) {
      const visible = showHotspots && mapMode !== "tmd";

      if (visible && !map.hasLayer(hotspotLayer)) {
        hotspotLayer.addTo(map);
      }

      if (!visible && map.hasLayer(hotspotLayer)) {
        map.removeLayer(hotspotLayer);
      }
    }
  }, [network, mapMode, showHotspots]);

  // Bagian visibilitas layer OD

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !network) return;

    if (odLayerRef.current) {
      map.removeLayer(odLayerRef.current);
      odLayerRef.current = null;
    }

    if (!showOD || mapMode === "tmd") return;

    const targetIndex = network.zones.findIndex(
      (zone) => zone.id === destination,
    );
    const target = network.zones[targetIndex];

    if (!target || targetIndex < 0) return;

    const flows = network.zones
      .map((zone, index) => ({
        origin: zone,
        value:
          (Number(network.mat?.[index]?.[targetIndex]) || 0) *
          (scenario === "after"
            ? zone.id === "Z11" && destination === "Z03"
              ? 0.7
              : 0.88
            : 1),
      }))
      .filter(({ origin: source, value }) => source.id !== target.id && value > 0);
    const group = createODFlowLayer(flows, target, origin, formatNumber);

    group.addTo(map);
    odLayerRef.current = group;
  }, [network, origin, destination, scenario, showOD, mapMode]);

  // Bagian aksi peta

  function selectMapMode(nextMode) {
    const map = mapRef.current;
    const showTmd = nextMode !== "roads";
    const tmdLayer = tmdLayerRef.current?.layer;

    setMapMode(nextMode);
    setNetworkOnly(nextMode === "tmd");

    if (nextMode === "tmd") {
      setShowOD(false);
    }

    if (map && tmdLayer) {
      if (showTmd && !map.hasLayer(tmdLayer)) {
        tmdLayer.addTo(map);
      } else if (!showTmd && map.hasLayer(tmdLayer)) {
        map.removeLayer(tmdLayer);
      }
    }

    if (nextMode === "all") {
      setShowHeat(true);
      setShowHotspots(true);
    }

    if (!map) return;

    if (nextMode === "tmd") {
      map.fitBounds(TMD_BOUNDS, {
        padding: [26, 26],
        maxZoom: 11,
        animate: false,
      });
      return;
    }

    if (nextMode === "roads") {
      if (network?.zones?.length) {
        map.fitBounds(
          network.zones.map((zone) => [zone.lat, zone.lng]),
          {
            padding: [35, 35],
            maxZoom: 12,
            animate: false,
          },
        );
      } else {
        map.setView([-8.673, 115.216], 12, { animate: false });
      }
      return;
    }

    if (network?.zones?.length) {
      map.fitBounds(
        network.zones.map((zone) => [zone.lat, zone.lng]),
        {
          padding: [35, 35],
          maxZoom: 12,
          animate: false,
        }
      );
    }
  }

  function reset() {
    setNetworkOnly(false);
    setDensity(DEFAULT_DENSITY);
    setScenario(initialScenario);
    setPlaying(true);
    setShowHeat(true);
    setShowHotspots(true);
    setShowOD(false);
    setOrigin("Z03");
    setDestination("Z11");

    selectMapMode("all");
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
        mapMode={mapMode}
        networkOnly={networkOnly}
        onSelectMapMode={selectMapMode}
        showOD={showOD}
        setShowOD={setShowOD}
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
