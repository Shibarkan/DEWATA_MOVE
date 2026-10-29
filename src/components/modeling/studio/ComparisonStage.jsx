import ComparisonSummary from "./ComparisonSummary";
import ODHeatmap from "./ODHeatmap";
import { SectionHeading } from "./Controls";
import exportJSON from "./exportJSON";

export default function ComparisonStage({ model, assignment, onNavigate }) {
  return (
                <section>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <SectionHeading
                      title="Hasil perbandingan skenario"
                      description="Dua skenario pada tahun yang sama. Angka ringkasan dan heatmap OD menunjukkan dampak kebijakan yang sudah diterapkan, tanpa dua peta berdampingan."
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
