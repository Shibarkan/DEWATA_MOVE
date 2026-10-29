import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Minus, LocateFixed, BusFront } from "lucide-react";
import { addTmdNetworkLayer, TMD_BOUNDS, TMD_CORRIDORS } from "../../../data/tmdNetwork";
import { INITIAL_VIEW } from "./helpers";

export default function TMDOnlyMap({
  compact = false,
  syncView,
  onViewChange,
}) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const tmdRef = useRef(null);

  const viewCallbackRef = useRef(onViewChange);
  const skipFirstSyncRef = useRef(true);

  viewCallbackRef.current = onViewChange;

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      center: [
        syncView?.lat ?? INITIAL_VIEW.lat,
        syncView?.lng ?? INITIAL_VIEW.lng,
      ],
      zoom: syncView?.zoom ?? INITIAL_VIEW.zoom,
      minZoom: 8,
      maxZoom: 19,
      zoomControl: false,
      scrollWheelZoom: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      zoomAnimation: false,
      markerZoomAnimation: false,
      fadeAnimation: false,
      preferCanvas: true,
    });

    mapRef.current = map;

    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }
    ).addTo(map);

    // Jaringan TMD mengambil data dari tmdNetwork.js.
    tmdRef.current = addTmdNetworkLayer(map, {
      animateBuses: true,
      showStops: true,
    });

    const notifyView = () => {
      const center = map.getCenter();

      viewCallbackRef.current?.({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      });
    };

    map.on("moveend zoomend", notifyView);

    // Langsung menampilkan seluruh koridor TMD.
    map.fitBounds(TMD_BOUNDS, {
      padding: [22, 22],
      maxZoom: 11,
      animate: false,
    });

    notifyView();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.invalidateSize({ pan: false });
          })
        : null;

    observer?.observe(mapElement.current);

    const timer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 100);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      map.off("moveend zoomend", notifyView);

      tmdRef.current?.destroy?.();
      tmdRef.current = null;

      map.remove();
      mapRef.current = null;
    };

    // Inisialisasi peta hanya satu kali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ikuti perpindahan kamera pada peta sebelah.
  useEffect(() => {
    if (skipFirstSyncRef.current) {
      skipFirstSyncRef.current = false;
      return;
    }

    const map = mapRef.current;

    if (!map || !syncView) return;

    const center = map.getCenter();

    const changed =
      Math.abs(center.lat - syncView.lat) > 0.00001 ||
      Math.abs(center.lng - syncView.lng) > 0.00001 ||
      Math.abs(map.getZoom() - syncView.zoom) > 0.05;

    if (changed) {
      map.setView(
        [syncView.lat, syncView.lng],
        syncView.zoom,
        { animate: false }
      );
    }
  }, [syncView]);

  function showAllTMD() {
    mapRef.current?.fitBounds(TMD_BOUNDS, {
      padding: [22, 22],
      maxZoom: 11,
      animate: false,
    });
  }

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#EDF2F4] ${
        compact
          ? "h-[330px] sm:h-[390px] xl:h-[435px]"
          : "h-[420px] sm:h-[540px] lg:h-[600px]"
      }`}
    >
      <div
        ref={mapElement}
        className="absolute inset-0 z-0"
        aria-label="Peta jaringan Trans Metro Dewata"
      />

      {/* Tombol zoom, terpisah dari tombol mode */}

      <div className="absolute right-3 top-3 z-[900] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn(0.5)}
          aria-label="Perbesar peta TMD"
          className="grid h-10 w-10 place-items-center text-slate-700 hover:bg-slate-100"
        >
          <Plus size={17} />
        </button>

        <div className="mx-2 h-px bg-slate-200" />

        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut(0.5)}
          aria-label="Perkecil peta TMD"
          className="grid h-10 w-10 place-items-center text-slate-700 hover:bg-slate-100"
        >
          <Minus size={17} />
        </button>

        <div className="mx-2 h-px bg-slate-200" />

        <button
          type="button"
          onClick={showAllTMD}
          aria-label="Tampilkan seluruh jaringan TMD"
          className="grid h-10 w-10 place-items-center text-slate-700 hover:bg-slate-100"
        >
          <LocateFixed size={17} />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[900] flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] font-semibold text-slate-700 shadow-sm">
        <BusFront size={14} className="text-[#B91C1C]" />
        {TMD_CORRIDORS.length} Koridor TMD
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[900] hidden rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-500 shadow-sm sm:block">
        Bus simulasi, bukan GPS
      </div>
    </div>
  );
}
