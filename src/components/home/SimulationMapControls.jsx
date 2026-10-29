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
  Route,
  RotateCcw,
} from "lucide-react";
import { formatNumber } from "./simulationUtils";

export default function SimulationMapControls({
  mapElement,
  mapRef,
  mapMode,
  networkOnly,
  onSelectMapMode,
  showOD,
  setShowOD,
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

      <div className="absolute left-2 top-2 z-[1000] flex w-fit max-w-[calc(100%-1rem)] flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-md sm:left-4 sm:top-4">
        <button
          type="button"
          onClick={() => onSelectMapMode("roads")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
            mapMode === "roads"
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <CarFront size={14} />
          Jaringan Jalan
        </button>

        <button
          type="button"
          onClick={() => onSelectMapMode("tmd")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
            mapMode === "tmd"
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Network size={14} />
          Jaringan TMD
        </button>

        <button
          type="button"
          onClick={() => onSelectMapMode("all")}
          aria-pressed={mapMode === "all"}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
            mapMode === "all"
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <MapIcon size={14} />
          Denpasar Bali
        </button>

        <button
          type="button"
          onClick={() => setShowOD((visible) => !visible)}
          disabled={networkOnly}
          aria-pressed={showOD}
          title={networkOnly ? "OD tidak ditampilkan pada mode Jaringan TMD" : undefined}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
            showOD
              ? "bg-[#B91C1C] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Route size={14} />
          Tampilkan OD
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

          <div className="pointer-events-none absolute bottom-3 right-3 z-[900] max-w-[190px] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-sm">
            <p className="mb-1.5 font-bold text-slate-700">
              Kepadatan jalan dari MAT
            </p>
            {[
              ["#0F766E", "Rendah"],
              ["#D3AD4C", "Sedang"],
              ["#EA751F", "Tinggi"],
              ["#B91C1C", "Sangat padat"],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </div>
            ))}
            <p className="mt-1.5 border-t border-slate-100 pt-1.5 leading-4">
              Laju kendaraan adalah estimasi visual IDM.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
