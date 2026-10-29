import { MODEL_ZONES } from "../../../data/modelEngine";
import { SectionHeading, MapLegend } from "./Controls";
import ModelingMapWithToggle from "./ModelingMapWithToggle";
import { format, pctLabel } from "./helpers";

export default function SingleMapStage({
  stage, model, assignment, graph, selectedZone,
  setSelectedZone, view, updateView, onNavigate, loading, error,
}) {
  return (
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
                  <section className="min-w-0">
                    <SectionHeading
                      title={
                        stage === "before"
                          ? "Jaringan jalan sebelum TDM"
                          : "Jaringan jalan setelah TDM"
                      }
                      description="Gerak kendaraan dan tekanan arus digambarkan berdasarkan koridor jaringan sampel, bukan lalu lintas aktual."
                    />

                    <ModelingMapWithToggle
                      stage={stage}
                      label={
                        stage === "before"
                          ? "SEBELUM"
                          : "SESUDAH"
                      }
                      model={model}
                      assignment={assignment}
                      graph={graph}
                      selectedZone={selectedZone}
                      onSelectZone={setSelectedZone}
                      syncView={view}
                      onViewChange={updateView}
                    />

                    <div className="mt-4">
                      <MapLegend />
                    </div>

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

                  {/* PANEL HASIL */}

                  <aside className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {stage === "before"
                        ? "Kondisi awal"
                        : "Setelah kebijakan"}
                    </h2>

                    <p className="mt-3 text-[13px] leading-7 text-slate-500">
                      {stage === "before"
                        ? "Proyeksi MAT 2041 tanpa tambahan intervensi TDM. Menjadi dasar pembanding seluruh paket kebijakan."
                        : "Model dengan parameter TDM terakhir yang sudah diterapkan. Angka dan peta Sesudah baru tampil setelah skenario berhasil diproses."}
                    </p>

                    <div className="mt-6 border-y border-slate-200 py-5">
                      <p className="text-xs text-slate-500">
                        Permintaan ekuivalen jam puncak
                      </p>

                      <p className="mt-2 break-words text-[clamp(1.8rem,3vw,2.8rem)] font-bold leading-none tracking-tight tabular-nums">
                        {format(
                          stage === "before"
                            ? model.beforeTotal
                            : model.afterTotal
                        )}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        smp/jam · proyeksi 2041
                      </p>

                      {stage === "after" && (
                        <p className="mt-4 text-[15px] font-bold tabular-nums text-[#0F766E]">
                          {pctLabel(
                            model.beforeTotal,
                            model.afterTotal
                          )}{" "}
                          dari Before
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onNavigate?.(
                          stage === "before"
                            ? "process"
                            : "comparison"
                        )
                      }
                      className="mt-6 rounded-full bg-[#B91C1C] px-6 py-3 text-[12px] font-bold text-white hover:bg-[#991B1B]"
                    >
                      {stage === "before"
                        ? "Atur kebijakan TDM"
                        : "Lihat perbandingan"}
                    </button>

                    <div className="mt-8 border-t border-slate-200 pt-5">
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        Pilih zona asal
                      </label>

                      <select
                        value={selectedZone}
                        onChange={(event) =>
                          setSelectedZone(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#B91C1C] focus:outline-none"
                      >
                        {MODEL_ZONES.map((zone) => (
                          <option
                            key={zone.id}
                            value={zone.id}
                          >
                            {zone.id} · {zone.name}
                          </option>
                        ))}
                      </select>

                      <div className="mt-3 divide-y divide-slate-100">
                        {model.pairs
                          .filter(
                            (pair) =>
                              pair.origin.id ===
                              selectedZone
                          )
                          .slice(0, 4)
                          .map((pair) => (
                            <div
                              key={`${pair.from}-${pair.to}`}
                              className="flex justify-between gap-3 py-2.5 text-xs"
                            >
                              <span className="font-medium text-slate-600">
                                {pair.origin.id} →{" "}
                                {pair.destination.id}
                              </span>

                              <span className="font-semibold tabular-nums">
                                {format(
                                  stage === "before"
                                    ? pair.before
                                    : pair.after
                                )}{" "}
                                smp/jam
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </aside>
                </div>
  );
}
