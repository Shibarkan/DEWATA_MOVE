
import { useMemo, useState } from "react";

/*
  DEWATAMOVE 2041
  COMPARISON RESULTS

  - 100% Tailwind CSS
  - Light mode
  - Data langsung dari policyEngine
  - Dot plot hubungan OD
  - Matriks perubahan 13 x 13
  - Interaktif & responsif
  - Tanpa library chart tambahan
*/

const RED = "#B91C1C";

const number = (value) =>
  Math.round(Number(value) || 0).toLocaleString("id-ID");

const decimal = (value) =>
  Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

const percentChange = (before, after) =>
  before > 0 ? ((after - before) / before) * 100 : 0;

const signed = (value) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${decimal(Math.abs(value))}%`;

const zoneCode = (index) =>
  `Z${String(index + 1).padStart(2, "0")}`;

function HeatCell({ before, after, active, onClick, origin, destination }) {
  const change = percentChange(before, after);
  const magnitude = Math.min(1, Math.abs(change) / 25);

  let background = "#F8FAFC";
  let foreground = "#64748B";

  if (before > 0 && change < -0.01) {
    background = `rgba(185, 28, 28, ${0.10 + magnitude * 0.84})`;
    foreground = magnitude > 0.52 ? "#FFFFFF" : "#7F1D1D";
  }

  if (before > 0 && change > 0.01) {
    background = `rgba(180, 83, 9, ${0.12 + magnitude * 0.76})`;
    foreground = magnitude > 0.52 ? "#FFFFFF" : "#92400E";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${origin} → ${destination}: ${signed(change)}`}
      aria-label={`${origin} menuju ${destination}, perubahan ${signed(change)}`}
      aria-pressed={active}
      className={`
        relative aspect-square w-full rounded-[3px]
        transition-[transform,box-shadow] duration-150
        hover:z-10 hover:scale-110
        focus-visible:z-10 focus-visible:outline
        focus-visible:outline-2 focus-visible:outline-[#B91C1C]
        ${active ? "z-10 ring-2 ring-[#B91C1C] ring-offset-2" : ""}
      `}
      style={{ backgroundColor: background, color: foreground }}
    />
  );
}

function Summary({ model }) {
  const before = model.beforeTotal || 0;
  const after = model.afterTotal || 0;
  const change = percentChange(before, after);
  const difference = after - before;

  return (
    <section className="border-y border-slate-200 py-8 sm:py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Tanpa kebijakan TDM
          </p>

          <h3 className="mt-3 text-[clamp(2.1rem,5vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums text-slate-900">
            {number(before)}
          </h3>

          <p className="mt-3 text-[13px] text-slate-500">
            Sebelum · 2041
          </p>
        </div>

        <div className="hidden h-20 w-px bg-slate-200 md:block" />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Dengan kebijakan TDM
          </p>

          <h3 className="mt-3 text-[clamp(2.1rem,5vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums text-[#B91C1C]">
            {number(after)}
          </h3>

          <p className="mt-3 text-[13px] text-slate-500">
            Sesudah · 2041
          </p>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-end justify-between gap-5 border-t border-slate-100 pt-7">
        <div>
          <p className="text-[12px] font-medium text-slate-600">
            Perubahan permintaan ekuivalen kendaraan
          </p>

          <p className="mt-2 text-[clamp(2.2rem,6vw,4rem)] font-bold leading-none tracking-[-0.06em] tabular-nums text-[#B91C1C]">
            {signed(change)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[12px] text-slate-500">
            Selisih absolut
          </p>

          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-800">
            {difference < 0 ? "−" : difference > 0 ? "+" : ""}
            {number(Math.abs(difference))}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            smp/jam
          </p>
        </div>
      </div>

      <p className="mt-5 max-w-3xl text-[11px] leading-6 text-slate-500">
        Total merupakan penjumlahan nilai matriks asal–tujuan pada skenario
        jam puncak, bukan volume satu ruas jalan. Respons kebijakan masih
        menggunakan asumsi sensitivitas model.
      </p>
    </section>
  );
}

function DotPlot({ model, selected, onSelect }) {
  const pairs = useMemo(
    () =>
      [...(model.pairs || [])]
        .sort((a, b) => b.before - a.before)
        .slice(0, 7),
    [model]
  );

  const max = Math.max(
    1,
    ...pairs.map((p) => Math.max(p.before, p.after))
  );

  return (
    <section className="py-9 sm:py-12">
      <div className="mb-8">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Arus perjalanan utama
        </h3>

        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">
          Perubahan tujuh hubungan asal–tujuan dengan permintaan terbesar
          pada skenario Sebelum. Setiap garis menghubungkan nilai Sebelum
          dan Sesudah untuk OD yang sama.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-5 text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            Sebelum
          </span>

          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B91C1C]" />
            Sesudah
          </span>
        </div>

        <span className="text-slate-500">smp/jam</span>
      </div>

      <div className="border-t border-slate-200">
        {pairs.map((pair) => {
          const beforeX = (pair.before / max) * 100;
          const afterX = (pair.after / max) * 100;

          const left = Math.min(beforeX, afterX);
          const width = Math.abs(beforeX - afterX);

          const change = percentChange(pair.before, pair.after);

          const isSelected =
            selected[0] === pair.from && selected[1] === pair.to;

          return (
            <button
              key={`${pair.from}-${pair.to}`}
              type="button"
              onClick={() => onSelect([pair.from, pair.to])}
              className={`
                group grid w-full gap-3 border-b border-slate-100
                px-2 py-5 text-left transition-colors
                sm:grid-cols-[88px_minmax(0,1fr)_110px]
                sm:items-center sm:gap-5
                ${isSelected ? "bg-[#FFF7F7]" : "hover:bg-slate-50"}
              `}
            >
              <div className="flex items-center justify-between gap-3 sm:block">
                <span className="whitespace-nowrap text-[12px] font-bold text-slate-800">
                  {zoneCode(pair.from)} → {zoneCode(pair.to)}
                </span>

                <span className="text-[11px] text-slate-500 sm:hidden">
                  {signed(change)}
                </span>
              </div>

              <div className="relative h-7">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />

                <div
                  className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-[#B91C1C]/50"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                  }}
                />

                <div
                  className="absolute top-1/2 z-[1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-500 ring-1 ring-slate-400"
                  style={{ left: `${beforeX}%` }}
                />

                <div
                  className="absolute top-1/2 z-[2] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#B91C1C]"
                  style={{ left: `${afterX}%` }}
                />
              </div>

              <div className="hidden text-right sm:block">
                <span className="text-[13px] font-semibold tabular-nums text-[#B91C1C]">
                  {signed(change)}
                </span>
              </div>

              <span className="sr-only">
                Sebelum {number(pair.before)} dan sesudah {number(pair.after)}
                smp per jam
              </span>
            </button>
          );
        })}
      </div>

      <div className="ml-0 mt-3 flex justify-between text-[10px] text-slate-400 sm:ml-[108px] sm:mr-[125px]">
        <span>0</span>
        <span>{number(max)}</span>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-slate-500">
        Klik hubungan OD untuk melihat angka rinci pada matriks di bawah.
        Skala titik menggunakan batas yang sama untuk seluruh hubungan.
      </p>
    </section>
  );
}

function ODMatrix({ model, selected, onSelect }) {
  const beforeMatrix = model.matrixBefore;
  const afterMatrix = model.matrixAfter;

  const [origin, destination] = selected;

  const cellBefore = beforeMatrix[origin]?.[destination] || 0;
  const cellAfter = afterMatrix[origin]?.[destination] || 0;
  const cellChange = percentChange(cellBefore, cellAfter);

  const zones = model.zones || [];

  return (
    <section className="border-t border-slate-200 py-9 sm:py-12">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Peta perubahan seluruh zona
        </h3>

        <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
          Matriks ini menunjukkan perubahan relatif pada setiap hubungan
          asal–tujuan. Semakin pekat warna merah, semakin besar penurunan
          permintaan yang dihitung oleh skenario.
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] bg-slate-100 ring-1 ring-slate-200" />
          Tetap
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] bg-[#F8C5C5]" />
          Penurunan kecil
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] bg-[#B91C1C]" />
          Penurunan besar
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] bg-amber-600" />
          Kenaikan
        </span>
      </div>

      <div className="mt-7 overflow-x-auto pb-3">
        <div className="min-w-[620px] max-w-[800px]">
          <div
            className="mb-1 grid gap-1"
            style={{
              gridTemplateColumns: "55px repeat(13, minmax(0,1fr))",
            }}
          >
            <div className="flex items-end text-[9px] font-medium text-slate-400">
              ASAL
            </div>

            {Array.from({ length: 13 }, (_, j) => (
              <span
                key={j}
                className="pb-2 text-center text-[10px] font-medium text-slate-500"
              >
                {zoneCode(j)}
              </span>
            ))}
          </div>

          {beforeMatrix.map((row, i) => (
            <div
              key={i}
              className="mb-1 grid gap-1"
              style={{
                gridTemplateColumns: "55px repeat(13, minmax(0,1fr))",
              }}
            >
              <div className="flex items-center text-[11px] font-semibold text-slate-600">
                {zoneCode(i)}
              </div>

              {row.map((value, j) => (
                <HeatCell
                  key={`${i}-${j}`}
                  origin={zoneCode(i)}
                  destination={zoneCode(j)}
                  before={value}
                  after={afterMatrix[i]?.[j] || 0}
                  active={origin === i && destination === j}
                  onClick={() => onSelect([i, j])}
                />
              ))}
            </div>
          ))}

          <p className="mt-3 pl-[55px] text-center text-[10px] tracking-[0.12em] text-slate-400">
            ZONA TUJUAN
          </p>
        </div>
      </div>

      <div className="mt-7 border-l-[3px] border-[#B91C1C] bg-[#FAFAFA] px-5 py-5 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Hubungan terpilih
        </p>

        <h4 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
          {zoneCode(origin)} → {zoneCode(destination)}
        </h4>

        <p className="mt-1 text-[12px] leading-6 text-slate-500">
          {zones[origin]?.name || "Zona asal"} menuju{" "}
          {zones[destination]?.name || "zona tujuan"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-[11px] text-slate-500">
              Sebelum
            </p>

            <p className="mt-1 text-xl font-semibold tabular-nums">
              {number(cellBefore)}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-slate-500">
              Sesudah
            </p>

            <p className="mt-1 text-xl font-semibold tabular-nums">
              {number(cellAfter)}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-[11px] text-slate-500">
              Perubahan
            </p>

            <p className="mt-1 text-xl font-semibold tabular-nums text-[#B91C1C]">
              {signed(cellChange)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-500">
          Satuan nilai perjalanan: smp/jam ekuivalen.
        </p>
      </div>
    </section>
  );
}

export default function ComparisonResults({
  model,
  assignment,
}) {
  const [selected, setSelected] = useState([10, 2]);

  if (
    !model ||
    !Array.isArray(model.matrixBefore) ||
    !Array.isArray(model.matrixAfter)
  ) {
    return null;
  }

  return (
    <div className="w-full bg-white text-slate-900">
      <div className="mb-7 border-b border-slate-200 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#B91C1C]">
          Analisis Hasil Pemodelan
        </p>

        <h2 className="mt-3 max-w-3xl text-[clamp(1.9rem,4vw,3.3rem)] font-bold leading-[1.12] tracking-[-0.055em]">
          Apa yang berubah setelah kebijakan?
        </h2>

        <p className="mt-4 max-w-3xl text-[13px] leading-7 text-slate-500">
          Perbandingan dua skenario pada horizon 2041, dengan
          asumsi pertumbuhan yang sama. Visualisasi ini memperlihatkan
          perubahan permintaan antarzona akibat parameter kebijakan TDM.
        </p>
      </div>

      <Summary model={model} />

      <DotPlot
        model={model}
        selected={selected}
        onSelect={setSelected}
      />

      <ODMatrix
        model={model}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="border-t border-slate-200 py-6">
        <p className="text-[12px] font-semibold text-slate-800">
          Catatan interpretasi
        </p>

        <p className="mt-2 max-w-4xl text-[11px] leading-6 text-slate-500">
          Hasil dihitung dari MAT 2026 yang diproyeksikan ke 2041
          menggunakan koefisien kebijakan eksploratif. Besaran perubahan
          belum dikalibrasi menggunakan survei perilaku perjalanan.
          Perubahan nilai MAT tidak dapat langsung diartikan sebagai
          jumlah penumpang yang berpindah ke TMD.
        </p>

        <p className="mt-2 max-w-4xl text-[11px] leading-6 text-slate-500">
          {assignment
            ? `Cakupan pembebanan OD antarzona pada jaringan jalan sampel: ${decimal(
                assignment.coverage * 100
              )}%. Hasil ini belum mewakili seluruh jaringan jalan Denpasar.`
            : "Pembebanan jaringan jalan belum tersedia. Visualisasi di atas membandingkan matriks OD, bukan hasil volume ruas."}
        </p>
      </div>
    </div>
  );
}
