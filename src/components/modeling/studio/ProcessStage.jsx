import { POLICY_SCENARIOS, POLICY_REFERENCES, normalizePolicy } from "../../../data/policyEngine";
import { Slider, SectionHeading } from "./Controls";
import MapPair from "./MapPair";

export default function ProcessStage({
  draft, setDraft, updateDraft, apply, runPhase,
  previewModel, previewAssignment, graph,
  selectedZone, setSelectedZone, view, updateView,
  loading, error,
}) {
  return (
                <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                  {/* PANEL KEBIJAKAN */}

                  <aside className="min-w-0 border-t border-slate-200 pt-5">
                    <h2 className="text-xl font-bold tracking-tight">
                      Atur kebijakan TDM
                    </h2>

                    <p className="mt-2 text-[12px] leading-6 text-slate-500">
                      Geser parameter untuk melihat
                      pratinjau. Perubahan belum menjadi
                      hasil Sesudah sebelum tombol Terapkan
                      skenario ditekan.
                    </p>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[11px] leading-5 text-slate-600">
                      <p className="font-bold text-slate-800">Referensi dan alasan pemilihan nilai</p>
                      <p className="mt-1">
                        Di bawah tiap slider ada alasan preset dan tautan sumber yang dapat dibuka.
                        Referensi menjelaskan mekanisme atau rentang pembanding,
                        bukan mengesahkan semua persentase sebagai hasil survei Denpasar.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-semibold text-[#B91C1C]">
                        <a
                          href="https://peraturan.bpk.go.id/Details/5162/pp-no-32-tahun-2011"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          PP 32/2011 — kebijakan TDM ↗
                        </a>
                        <a
                          href="https://binamarga.pu.go.id/index.php/nspk/detail/09pbm2023-pedoman-kapasitas-jalan-indonesia-"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          PKJI 2023 — kinerja ruas jalan ↗
                        </a>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        PKJI digunakan untuk kapasitas dan derajat kejenuhan; PKJI tidak menetapkan nilai 8%, 25%, atau indeks feeder 30%.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(
                        POLICY_SCENARIOS
                      ).map(([id, preset]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setDraft(
                              normalizePolicy(preset)
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                            JSON.stringify(draft) ===
                            JSON.stringify(
                              normalizePolicy(preset)
                            )
                              ? "border-[#B91C1C] bg-[#FFF1F2] text-[#B91C1C]"
                              : "border-slate-200 text-slate-600 hover:border-[#B91C1C]"
                          }`}
                        >
                          {id === "integrated"
                            ? "Terintegrasi"
                            : id === "pull"
                              ? "TMD + Feeder"
                              : id === "push"
                                ? "Parkir"
                                : "Jam Sibuk"}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3">
                      <Slider
                        label="Pertumbuhan tahunan"
                        policyKey="annualGrowth"
                        min={0}
                        max={5}
                        step={0.25}
                        value={draft.annualGrowth}
                        onChange={(value) =>
                          updateDraft(
                            "annualGrowth",
                            value
                          )
                        }
                      />

                      <Slider
                        label="Kenaikan tarif parkir"
                        policyKey="parkingIncrease"
                        min={0}
                        max={100}
                        step={5}
                        value={draft.parkingIncrease}
                        onChange={(value) =>
                          updateDraft(
                            "parkingIncrease",
                            value
                          )
                        }
                      />

                      <Slider
                        label="Headway TMD"
                        policyKey="targetHeadway"
                        unit=" menit"
                        min={5}
                        max={30}
                        value={draft.targetHeadway}
                        onChange={(value) =>
                          updateDraft(
                            "targetHeadway",
                            value
                          )
                        }
                      />

                      <Slider
                        label="Akses feeder"
                        policyKey="feederAccess"
                        min={0}
                        max={100}
                        step={5}
                        value={draft.feederAccess}
                        onChange={(value) =>
                          updateDraft(
                            "feederAccess",
                            value
                          )
                        }
                      />

                      <Slider
                        label="Pergeseran jam puncak"
                        policyKey="peakShift"
                        min={0}
                        max={30}
                        value={draft.peakShift}
                        onChange={(value) =>
                          updateDraft(
                            "peakShift",
                            value
                          )
                        }
                      />

                      <label className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 text-xs font-medium text-slate-700">
                        Prioritas bus

                        <input
                          type="checkbox"
                          checked={draft.busPriority}
                          onChange={(event) =>
                            updateDraft(
                              "busPriority",
                              event.target.checked
                            )
                          }
                          className="h-4 w-4 accent-[#B91C1C]"
                        />
                      </label>
                      <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3 text-[11px] leading-5 text-slate-600">
                        <p>
                          <strong className="text-slate-800">Mengapa prioritas bus aktif? </strong>
                          {POLICY_REFERENCES.busPriority.reason}
                        </p>
                        <a
                          href={POLICY_REFERENCES.busPriority.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block font-semibold text-[#B91C1C] underline underline-offset-2"
                        >
                          Lihat sumber: NACTO — prioritas bus ↗
                        </a>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {POLICY_REFERENCES.busPriority.status}
                        </p>
                      </div>
                    </div>

                    {/* KEBIJAKAN TAMBAHAN: NILAI AWAL 0 DI SEMUA PRESET */}
                    <section className="mt-6 border-t border-slate-200 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Kebijakan TDM tambahan
                        </h3>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                          Default: 0% · Tidak aktif
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-6 text-slate-500">
                        Ketiganya tersedia untuk uji sensitivitas,
                        tetapi tidak dihitung dalam preset Terintegrasi
                        sampai nilainya kamu ubah. Persentase di bawah
                        adalah proksi perubahan kendaraan ekuivalen
                        dalam MAT, bukan persentase pekerja atau penumpang.
                      </p>

                      <div className="mt-3">
                        <Slider
                          label="Pengurangan perjalanan via WFH"
                          policyKey="wfhReduction"
                          min={0}
                          max={20}
                          step={1}
                          value={draft.wfhReduction ?? 0}
                          onChange={(value) =>
                            updateDraft("wfhReduction", value)
                          }
                        />
                        <Slider
                          label="Peralihan park-and-ride (OD prioritas)"
                          policyKey="parkRideShift"
                          min={0}
                          max={25}
                          step={1}
                          value={draft.parkRideShift ?? 0}
                          onChange={(value) =>
                            updateDraft("parkRideShift", value)
                          }
                        />
                        <Slider
                          label="Peralihan sepeda (OD dekat)"
                          policyKey="bikeShift"
                          min={0}
                          max={25}
                          step={1}
                          value={draft.bikeShift ?? 0}
                          onChange={(value) =>
                            updateDraft("bikeShift", value)
                          }
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-500">
                          Tambahan aktif:{" "}
                          <strong className="text-slate-800">
                            {[
                              draft.wfhReduction,
                              draft.parkRideShift,
                              draft.bikeShift,
                            ].filter((v) => Number(v) > 0).length}
                            /3
                          </strong>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) =>
                              normalizePolicy({
                                ...prev,
                                wfhReduction: 0,
                                parkRideShift: 0,
                                bikeShift: 0,
                              })
                            )
                          }
                          className="text-[11px] font-semibold text-[#B91C1C] hover:underline"
                        >
                          Reset tambahan ke 0%
                        </button>
                      </div>

                      <p className="mt-3 text-[10px] leading-5 text-slate-500">
                        Perhitungan tambahan dilakukan berurutan dari
                        sisa permintaan: WFH → park-and-ride → sepeda.
                        Park-and-ride dibatasi pada OD prioritas;
                        sepeda dibatasi pada pasangan pusat zona
                        dengan jarak garis lurus sampai 5 km.
                        Keduanya belum terkalibrasi.
                      </p>
                    </section>

                    <button
                      type="button"
                      onClick={apply}
                      disabled={runPhase !== null}
                      className="mt-5 w-full rounded-xl bg-[#B91C1C] px-5 py-3.5 text-[13px] font-bold text-white hover:bg-[#991B1B] disabled:cursor-wait disabled:opacity-50"
                    >
                      Terapkan skenario
                    </button>

                    <p className="mt-3 text-[11px] leading-5 text-slate-500">
                      Pratinjau adalah hasil eksplorasi.
                      Hasil akhir disimpan setelah validasi
                      dasar perhitungan selesai.
                    </p>
                  </aside>

                  {/* DUA PETA DENGAN TOMBOL MASING-MASING */}

                  <section className="min-w-0">
                    <SectionHeading
                      title="Sebelum dan pratinjau sesudah"
                      description="Dua peta dengan hasil MAT Before dan pratinjau After yang berbeda. Pilih Jaringan Jalan, Jaringan TMD, atau Denpasar Bali pada tiap peta."
                    />

                    <MapPair
                      model={previewModel}
                      assignment={previewAssignment}
                      graph={graph}
                      labelAfter="Pratinjau sesudah"
                      selectedZone={selectedZone}
                      onSelectZone={setSelectedZone}
                      view={view}
                      onViewChange={updateView}
                    />

                    {loading && (
                      <p className="mt-3 text-xs text-slate-500">
                        Memuat jaringan koridor OSRM...
                      </p>
                    )}

                    {error && (
                      <p className="mt-3 text-xs text-amber-700">
                        Jaringan OSRM gagal dimuat: {error}
                      </p>
                    )}
                  </section>
                </div>
  );
}
