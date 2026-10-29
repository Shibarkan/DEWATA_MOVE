import { Network, SlidersHorizontal } from "lucide-react";
import { TMD_CORRIDORS } from "../../data/tmdNetwork";
import { formatNumber } from "./simulationUtils";

export default function SimulationDataPanel({
  networkOnly,
  showScenarioControls,
  scenario,
  setScenario,
  density,
  setDensity,
  showHeat,
  setShowHeat,
  showHotspots,
  setShowHotspots,
  zones,
  origin,
  setOrigin,
  destination,
  setDestination,
  network,
  insights,
  afterTotal,
  shownOD,
}) {
  if (networkOnly) {
    return (
      <div className="px-3 py-5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Jaringan Trans Metro Dewata
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Peta menampilkan koridor TMD beserta titik
              pemberhentian utama. Posisi bus merupakan
              simulasi visual, bukan lokasi GPS aktual.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
            6 Koridor
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TMD_CORRIDORS.map((corridor) => (
            <div
              key={corridor.id}
              className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3"
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: corridor.color }}
              >
                {corridor.id}
              </span>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">
                  {corridor.name}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {corridor.route}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 p-3 sm:p-5 lg:grid-cols-3">
        <section className="min-w-0 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <SlidersHorizontal size={17} />
            Pengaturan Lalu Lintas
          </h3>

          {showScenarioControls && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScenario("before")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  scenario === "before"
                    ? "bg-[#B91C1C] text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Before TDM
              </button>

              <button
                type="button"
                onClick={() => setScenario("after")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  scenario === "after"
                    ? "bg-[#0F766E] text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                After TDM
              </button>
            </div>
          )}

          <label className="block text-xs font-semibold text-slate-700">
            Kepadatan visual: {density.toFixed(2)}×
            <input
              type="range"
              min="0.4"
              max="1.6"
              step="0.05"
              value={density}
              onChange={(event) => setDensity(Number(event.target.value))}
              className="mt-3 block w-full accent-[#B91C1C]"
            />
          </label>

          <div className="space-y-2.5 text-xs text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHeat}
                onChange={(event) => setShowHeat(event.target.checked)}
                className="accent-[#B91C1C]"
              />
              Intensitas Ruas (Model)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(event) => setShowHotspots(event.target.checked)}
                className="accent-[#B91C1C]"
              />
              Aktivitas MAT per Zona
            </label>
          </div>

          <p className="text-[11px] leading-5 text-slate-500">
            Warna ruas dan kepadatan kendaraan adalah visualisasi
            ilustratif berdasarkan arus model, bukan pengukuran
            kemacetan aktual.
          </p>
        </section>

        <section className="min-w-0 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Network size={17} />
            Matriks Asal Tujuan
          </h3>

          <label className="block text-xs font-medium text-slate-700">
            Zona Asal
            <select
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#B91C1C]"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id} - {zone.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Zona Tujuan
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#B91C1C]"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id} - {zone.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="min-w-0 rounded-xl bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {scenario === "after" ? "MAT Setelah TDM — Asumsi" : "Total MAT 2026"}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {network
              ? formatNumber(
                  scenario === "after" ? afterTotal : insights?.total
                )
              : "-"}
          </p>
          <p className="text-xs text-slate-500">smp/jam</p>

          <div className="my-4 h-px bg-slate-200" />

          <p className="text-xs font-bold text-[#B91C1C]">
            OD {origin} → {destination}
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {shownOD == null ? "-" : formatNumber(shownOD)}
          </p>
          <p className="text-xs text-slate-500">smp/jam</p>

          {scenario === "after" && (
            <p className="mt-3 text-[11px] leading-5 text-amber-800">
              Perubahan OD di pratinjau menggunakan asumsi demonstrasi,
              bukan hasil kalibrasi atau proyeksi resmi.
            </p>
          )}
        </section>
      </div>

      {insights && insights.odPairs.length > 0 && (
        <div className="border-t border-slate-100 px-3 py-5 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Sorotan Pergerakan · MAT 2026
            </h3>
            <span className="text-[11px] text-slate-500">
              Satuan: smp/jam
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Asal terbesar</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {insights.byOrigin[0]?.id}
              </p>
              <p className="text-xs text-slate-600">
                {formatNumber(insights.byOrigin[0]?.out)} smp/jam
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Tujuan terbesar</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {insights.byDestination[0]?.id}
              </p>
              <p className="text-xs text-slate-600">
                {formatNumber(insights.byDestination[0]?.incoming)} smp/jam
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Hubungan OD utama</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {insights.odPairs[0]?.origin.id} →{" "}
                {insights.odPairs[0]?.destination.id}
              </p>
              <p className="text-xs text-slate-600">
                {formatNumber(insights.odPairs[0]?.value)} smp/jam
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
