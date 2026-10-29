import ModelingMapWithToggle from "./ModelingMapWithToggle";
import { MapLegend } from "./Controls";
import { format, percent, sign } from "./helpers";

export default function MapPair({
  model,
  assignment,
  graph,
  labelAfter,
  selectedZone,
  onSelectZone,
  view,
  onViewChange,
}) {
  const change = percent(
    model.beforeTotal,
    model.afterTotal
  );

  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        {/* PETA PERTAMA */}

        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
              Sebelum TDM
            </h3>

            <span className="text-xs tabular-nums text-slate-500">
              {format(model.beforeTotal)} smp/jam
            </span>
          </div>

          <ModelingMapWithToggle
            compact
            stage="before"
            label="SEBELUM"
            graph={graph}
            model={model}
            assignment={assignment}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            syncView={view}
            onViewChange={onViewChange}
          />
        </div>

        {/* PETA KEDUA */}

        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
              {labelAfter}
            </h3>

            <span className="text-xs tabular-nums text-slate-500">
              {format(model.afterTotal)} smp/jam
            </span>
          </div>

          <ModelingMapWithToggle
            compact
            stage="after"
            label="SESUDAH"
            graph={graph}
            model={model}
            assignment={assignment}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            syncView={view}
            onViewChange={onViewChange}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <MapLegend />

        <p
          className={`text-[12px] font-semibold tabular-nums ${
            change > 0
              ? "text-[#B91C1C]"
              : "text-[#0F766E]"
          }`}
        >
          {change === null
            ? "Perubahan belum terdefinisi"
            : `${sign(change, 1)}% permintaan jam puncak`}
        </p>
      </div>

      <p className="mt-3 text-[11px] leading-6 text-slate-500">
        Geser atau zoom salah satu peta: kamera peta
        lainnya mengikuti posisi yang sama. Setiap peta
        memiliki tombol Jaringan TMD sendiri sehingga
        mode tampilannya dapat dipilih secara terpisah.
        Arus ruas, garis OD, dan ukuran lingkaran zona
        mengikuti MAT pada skenario masing-masing.
        Lingkaran menunjukkan aktivitas bangkitan dan
        tarikan relatif, bukan batas wilayah.
        Kendaraan serta warna ruas adalah ilustrasi
        relatif, bukan V/C terukur.
      </p>
    </div>
  );
}
