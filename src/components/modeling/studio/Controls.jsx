import { POLICY_REFERENCES } from "../../../data/policyEngine";
import { format } from "./helpers";

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
  policyKey,
}) {
  const reference = POLICY_REFERENCES[policyKey];
  const inputId = `dm-policy-${policyKey}`;

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <label
        htmlFor={inputId}
        className="mb-2 flex items-center justify-between gap-3 text-[12px] font-medium text-slate-700"
      >
        <span>{label}</span>
        <strong className="shrink-0 font-semibold tabular-nums text-[#B91C1C]">
          {format(value, step < 1 ? 2 : 0)}{unit}
        </strong>
      </label>

      <input
        id={inputId}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="block h-1.5 w-full cursor-pointer accent-[#B91C1C]"
      />

      {reference && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3 text-[11px] leading-5 text-slate-600">
          <p>
            <span className="font-bold text-slate-800">
              Dasar preset {reference.preset}: {" "}
            </span>
            {reference.reason}
          </p>

          {reference.sources?.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {reference.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${source.role}. Buka rujukan resmi di tab baru.`}
                  className="font-semibold text-[#B91C1C] underline decoration-[#B91C1C]/30 underline-offset-2 hover:text-[#991B1B]"
                >
                  Lihat sumber: {source.label} ↗
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 font-semibold text-amber-800">
              Referensi numerik khusus Denpasar belum tersedia.
            </p>
          )}

          <details className="mt-2 border-t border-slate-200/80 pt-2">
            <summary className="cursor-pointer select-none font-medium text-slate-700 hover:text-[#B91C1C]">
              Status angka dan keterbatasan penelitian
            </summary>
            <p className="mt-2">{reference.status}</p>
            <p className="mt-1">{reference.evidence}</p>
            <p className="mt-1 font-medium text-slate-700">
              Saat slider diubah, angka baru adalah nilai uji pengguna dan belum otomatis menjadi angka terkalibrasi.
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

export function SectionHeading({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-[-0.035em] text-slate-900 sm:text-[26px]">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
      <span className="font-medium text-slate-600">
        Tekanan arus relatif
      </span>

      {[
        ["#0F766E", "Rendah"],
        ["#D3AC4A", "Sedang"],
        ["#E48C36", "Tinggi"],
        ["#B91C1C", "Sangat tinggi"],
      ].map(([color, label]) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {label}
        </span>
      ))}

    </div>
  );
}
