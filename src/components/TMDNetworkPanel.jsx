
import { BusFront, MapPin, Network } from "lucide-react";
import {
  TMD_CORRIDORS,
  TMD_STOPS,
} from "../data/tmdNetwork";

export default function TMDNetworkPanel({ compact = false }) {
  return (
    <aside
      className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white ${
        compact ? "p-4" : "h-full p-5"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-[#B91C1C]">
          <Network size={18} />
        </span>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Analisis jaringan TMD
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Trans Metro Dewata · Denpasar Raya
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-[#B91C1C]">
            <BusFront size={15} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Koridor
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">6</p>
          <p className="text-[10px] text-slate-500">
            jalur referensi
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-[#B91C1C]">
            <MapPin size={15} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Simpul
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {TMD_STOPS.length}
          </p>
          <p className="text-[10px] text-slate-500">
            halte / hub utama
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Koridor Trans Metro Dewata
        </h4>

        <div className="space-y-1.5">
          {TMD_CORRIDORS.map((corridor) => (
            <div
              key={corridor.id}
              className="flex items-start gap-2.5 rounded-lg px-1 py-1.5"
            >
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: corridor.color }}
              >
                {corridor.id}
              </span>

              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-4 text-slate-800">
                  {corridor.name}
                </p>
                <p className="text-[10px] leading-4 text-slate-500">
                  {corridor.route}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Simpul utama
          </h4>

          <div className="flex flex-wrap gap-1.5">
            {TMD_STOPS.map((stop) => (
              <span
                key={stop.name}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] text-slate-600"
              >
                {stop.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-auto border-t border-slate-100 pt-4 text-[10px] leading-5 text-slate-500">
        Rute merujuk peta jaringan pada ToR dan diselaraskan
        ke jalan OpenStreetMap jika layanan routing tersedia.
        Simbol bus bergerak adalah animasi ilustratif, bukan
        lokasi GPS armada aktual.
      </p>
    </aside>
  );
}
