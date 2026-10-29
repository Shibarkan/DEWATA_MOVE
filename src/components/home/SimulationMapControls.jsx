import {
  BusFront,
  CarFront,
  Info,
  Map as MapIcon,
  Minus,
  Network,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";
import { formatNumber } from "./simulationUtils";

export default function SimulationMapControls({
  mapElement,
  mapRef,
  mode,
  networkOnly,
  onShowAllZones,
  onFocusStreet,
  onToggleNetworkOnly,
  playing,
  setPlaying,
  onReset,
  loading,
  error,
  visibleCount,
}) {
  return (
    <div className="relative h-[430px] overflow-hidden rounded-xl bg-slate-100 sm:h-[570px] sm:rounded-2xl lg:h-[660px]">
      <div
        ref={mapElement}
        className="absolute inset-0 z-0 h-full w-full"
        aria-label="Peta mobilitas Denpasar dan jaringan TMD"
      />

      <div className="absolute left-2 right-2 top-2 z-[1000] flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-md sm:left-4 sm:right-auto sm:top-4">
        <button
          type="button"
          onClick={onShowAllZones}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
            mode === "zones"
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <MapIcon size={14} />
          13 Zona
        </button>

        <button
          type="button"
          onClick={onFocusStreet}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
            mode === "street"
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <CarFront size={14} />
          Fokus Jalan
        </button>

        <button
          type="button"
          onClick={onToggleNetworkOnly}
          aria-pressed={networkOnly}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
            networkOnly
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Network size={14} />
          {networkOnly ? "Tampilkan MAT" : "Jaringan TMD saja"}
        </button>

        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label={playing ? "Jeda kendaraan" : "Jalankan kendaraan"}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Reset peta"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="absolute right-2 top-[105px] z-[1000] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md sm:right-4 sm:top-20">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn(0.5, { animate: false })}
          className="grid h-10 w-10 place-items-center text-slate-800 hover:bg-slate-50"
          aria-label="Zoom in"
        >
          <Plus size={18} />
        </button>

        <div className="mx-2 h-px bg-slate-200" />

        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut(0.5, { animate: false })}
          className="grid h-10 w-10 place-items-center text-slate-800 hover:bg-slate-50"
          aria-label="Zoom out"
        >
          <Minus size={18} />
        </button>
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-[1100] flex items-center justify-center bg-white/70 p-4">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#B91C1C]" />
            <p className="text-xs font-semibold text-slate-800">
              Memuat jaringan jalan Denpasar...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-14 left-3 right-3 z-[1100] rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-900 shadow-sm sm:right-auto sm:max-w-lg">
          <Info size={14} className="mr-1 inline" />
          {error}
        </div>
      )}

      {networkOnly ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[900] flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm">
          <BusFront size={15} className="text-[#B91C1C]" />
          6 Koridor Trans Metro Dewata
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute bottom-3 left-3 z-[900] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm">
            {formatNumber(visibleCount)} kendaraan terlihat
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 z-[900] hidden rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-sm sm:block">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              Asal dominan MAT
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Tujuan dominan MAT
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Zona lainnya
            </div>
          </div>
        </>
      )}
    </div>
  );
}
