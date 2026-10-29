import { SectionHeading } from "./Controls";

export default function Explanation({ stage }) {
  const steps = {
    before: [
      "MAT 2026",
      "Proyeksi 2041",
      "Pembebanan ruas",
      "Baseline",
    ],
    process: [
      "Parkir",
      "TMD & feeder",
      "Jam puncak",
      "Pembebanan ulang",
    ],
    after: [
      "Kebijakan terpilih",
      "Permintaan baru",
      "Peta sesudah",
      "Evaluasi",
    ],
    comparison: [
      "Horizon sama",
      "Ringkasan",
      "Perubahan OD",
      "Evaluasi",
    ],
  };

  const description = {
    before:
      "Data asal–tujuan diproyeksikan dan dibebankan pada koridor yang tersambung di jaringan sampel.",
    process:
      "Slider kebijakan mengubah permintaan pada pratinjau secara langsung. Tekan Terapkan untuk menyimpan hasil After.",
    after:
      "Model menghitung ulang permintaan, lalu peta menggambarkan perubahan tekanan arus dan gerak kendaraan.",
    comparison:
      "Ringkasan Before–After dan heatmap OD menyajikan dampak kebijakan dalam angka yang mudah dibandingkan.",
  };

  return (
    <section className="mt-12 border-t border-slate-200 pt-8">
      <SectionHeading
        title="Alur simulasi"
        description={description[stage]}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {steps[stage].map((step, i) => (
          <div
            key={step}
            className="border-t-2 border-[#B91C1C] bg-[#F8FAFC] px-4 py-4"
          >
            <p className="text-[13px] font-semibold text-slate-800">
              {step}
            </p>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#B91C1C]/70 motion-safe:animate-pulse"
                style={{
                  width: `${25 + i * 23}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-6 text-slate-500">
        Ilustrasi interaktif di peta memperlihatkan tekanan
        arus relatif; tidak menunjukkan posisi kendaraan,
        kemacetan atau kecepatan hasil pengukuran lapangan.
      </p>
    </section>
  );
}
