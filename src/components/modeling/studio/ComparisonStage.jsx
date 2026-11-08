import ComparisonSummary from "./ComparisonSummary";
import ODHeatmap from "./ODHeatmap";
import { SectionHeading } from "./Controls";
import exportJSON from "./exportJSON";
import { POLICY_REFERENCES } from "../../../data/policyEngine";

const parameterNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(
    Number(value) || 0,
  );

export default function ComparisonStage({ model, assignment, onNavigate }) {
  const policy = model.policy || {};
  const evidenceRows = [
    {
      key: "annualGrowth",
      label: "Pertumbuhan tahunan",
      value: `${parameterNumber(policy.annualGrowth, 2)}%`,
      note: POLICY_REFERENCES.annualGrowth.why,
    },
    {
      key: "peakShift",
      label: "Pengurangan MAT jam puncak",
      value: `${parameterNumber(policy.peakShift)}%`,
      note: "Angka 12% yang pernah dipakai berasal dari preset internal lama tanpa basis data Denpasar dan berada di atas rentang pembanding 5–10%. Nilai 8% sekarang dipakai sebagai sensitivitas di dalam rentang tersebut, bukan hasil kalibrasi. Sumber membahas pendekat pusat kerja; model menerapkannya ke semua sel MAT puncak dan tidak memindahkan perjalanan ke periode nonpuncak.",
    },
    {
      key: "parkingIncrease",
      label: "Uji kenaikan tarif parkir",
      value: `${parameterNumber(policy.parkingIncrease)}%`,
      note: "Rujukan menjelaskan mekanisme/respons parkir, bukan penetapan angka kebijakan Denpasar. Parameter ini belum mengubah MAT atau menghasilkan perpindahan moda.",
    },
    {
      key: "targetHeadway",
      label: "Target headway TMD",
      value: `${parameterNumber(policy.targetHeadway)} menit`,
      note: "Rujukan memberi prinsip layanan transit yang sering; angka target ini bukan headway resmi/terukur TMD dan belum mengubah MAT.",
    },
    {
      key: "feederAccess",
      label: "Indeks akses feeder",
      value: `${parameterNumber(policy.feederAccess)}%`,
      note: "Ini indeks skenario internal, bukan cakupan halte atau peningkatan akses terukur. Sumber mendukung pentingnya akses first/last-mile, bukan nilai indeksnya.",
    },
  ];

  return (
                <section>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <SectionHeading
                      title="Hasil perbandingan skenario"
                      description="Dua skenario pada tahun yang sama. Angka ringkasan dan heatmap menunjukkan perubahan dari sensitivitas yang diinput, bukan dampak kebijakan terkalibrasi."
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          exportJSON(
                            model,
                            assignment,
                            "before"
                          )
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:border-[#B91C1C] hover:text-[#B91C1C]"
                      >
                        Ekspor Before
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          exportJSON(
                            model,
                            assignment,
                            "after"
                          )
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:border-[#B91C1C] hover:text-[#B91C1C]"
                      >
                        Ekspor After
                      </button>
                    </div>
                  </div>

                  <ComparisonSummary model={model} />

                  <section className="mb-10 border-y border-slate-200 py-6">
                    <h3 className="text-base font-bold text-slate-900">
                      Dasar angka dan sumber
                    </h3>
                    <p className="mt-2 max-w-4xl text-xs leading-6 text-slate-600">
                      Catatan ini memisahkan nilai uji dari bukti lokal. Sumber
                      pembanding membantu menjelaskan mekanisme, tetapi tidak
                      mengkalibrasi dampak untuk Denpasar.
                    </p>

                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-7 text-amber-900">
                      <p className="font-bold uppercase tracking-[0.12em] text-amber-800">
                        Interpretasi skenario 8% peak shift
                      </p>
                      <p className="mt-3">
                        Pada skenario ini, angka 8% bukan merupakan hasil survei lapangan atau data empiris yang sudah terkalibrasi. Angka tersebut merupakan asumsi sensitivitas yang digunakan untuk menguji bagaimana perubahan pola perjalanan pada jam puncak dapat memengaruhi total permintaan perjalanan dalam model.
                      </p>
                      <p className="mt-3">
                        Secara logika, kita tidak langsung menyatakan bahwa TMD secara otomatis membuat masyarakat berpindah dari kendaraan pribadi ke angkutan umum. Dalam kondisi realitas Denpasar, perubahan moda bergantung pada beberapa faktor, seperti ketersediaan layanan TMD, jarak akses dari asal ke halte, jarak egress dari halte ke tujuan, waktu tunggu dan waktu perjalanan, jumlah transfer, tarif, keandalan layanan, tingkat kepemilikan kendaraan, dan karakteristik sosial ekonomi pengguna.
                      </p>
                      <p className="mt-3">
                        Karena data operasional dan data perilaku tersebut belum sepenuhnya tersedia, maka model tidak mengklaim hasil itu sebagai prediksi empiris. Sebaliknya, model menggunakan pendekatan skenario sensitivitas: jika 8% perjalanan puncak dapat bergeser keluar jam puncak, bagaimana dampaknya terhadap permintaan total?
                      </p>
                      <p className="mt-4 font-semibold text-amber-900">
                        peakRate = peakShift / 100
                        <br />
                        peakShift = 8
                        <br />
                        peakRate = 0,08
                      </p>
                      <p className="mt-3">
                        Maka perubahan demand pada sel OD yang terdampak dihitung sebagai:
                        <span className="mt-2 block font-mono text-[11px] text-amber-950">
                          after = before × (1 - peakRate)
                          <br />
                          after = before × (1 - 0,08)
                          <br />
                          after = before × 0,92
                        </span>
                      </p>
                      <p className="mt-3">
                        Artinya, sel demand yang terdampak mengalami pengurangan sebesar 8%. Secara agregat, perubahan total permintaan dihitung dengan:
                        <span className="mt-2 block font-mono text-[11px] text-amber-950">
                          reduction = (beforeTotal - afterTotal) / beforeTotal
                        </span>
                      </p>
                      <p className="mt-3">
                        Sehingga, jika seluruh sel yang terdampak mengalami penurunan yang sama, maka hasil akhir akan mendekati 8% penurunan permintaan relatif terhadap baseline.
                      </p>
                    </div>

                    <dl className="mt-4 divide-y divide-slate-100">
                      {evidenceRows.map((row) => {
                        const reference = POLICY_REFERENCES[row.key];
                        return (
                          <div
                            key={row.key}
                            className="grid gap-2 py-4 sm:grid-cols-[210px_minmax(0,1fr)] sm:gap-5"
                          >
                            <dt className="text-xs font-bold text-slate-800">
                              {row.label}: {row.value}
                            </dt>
                            <dd className="text-xs leading-6 text-slate-600">
                              <p>{row.note}</p>
                              {reference.sources.length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  {reference.sources.map((source) => (
                                    <a
                                      key={source.url}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-semibold text-[#B91C1C] underline decoration-[#B91C1C]/30 underline-offset-2"
                                    >
                                      {source.label}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-1 font-medium text-amber-800">
                                  Tidak ada sumber numerik lokal; asumsi internal.
                                </p>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>

                  <ODHeatmap model={model} />

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.("process")
                    }
                    className="mt-5 rounded-full border border-[#B91C1C] px-5 py-2.5 text-[12px] font-semibold text-[#B91C1C] hover:bg-[#FFF1F2]"
                  >
                    Uji kebijakan lain
                  </button>
                </section>
  );
}
