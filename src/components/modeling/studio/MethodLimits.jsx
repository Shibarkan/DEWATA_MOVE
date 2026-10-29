import { format } from "./helpers";

export default function MethodLimits({ details, setDetails, assignment }) {
  return (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    setDetails((value) => !value)
                  }
                  className="text-xs font-semibold text-slate-600 hover:text-[#B91C1C]"
                >
                  {details
                    ? "Tutup metode dan batasan"
                    : "Metode dan batasan perhitungan"}
                </button>

                {details && (
                  <div className="mt-5 max-w-4xl space-y-3 text-[12px] leading-7 text-slate-500">
                    <p>
                      MAT 2026 diproyeksikan sampai 2041
                      memakai pertumbuhan majemuk.
                      Kebijakan TDM memengaruhi permintaan
                      menurut koefisien sensitivitas
                      asumsi, bukan hasil kalibrasi survei.
                    </p>

                    <p>
                      Pembebanan jaringan menggunakan rute
                      terpendek all-or-nothing pada koridor
                      OSRM sampel. Ketika data ruas belum
                      cukup, tampilan kendaraan memakai
                      proksi tekanan arus dari penyedia
                      jaringan.
                    </p>

                    <p>
                      Tanpa data kapasitas ruas, warna dan
                      kecepatan kendaraan adalah ilustrasi
                      relatif, bukan kemacetan faktual,
                      V/C, atau kecepatan aktual.{" "}
                      {assignment
                        ? `Cakupan OD yang dibebankan pada jaringan sampel: ${format(
                            assignment.coverage * 100,
                            1
                          )}%.`
                        : "Pembebanan koridor belum tersedia."}
                    </p>
                  </div>
                )}
              </div>
  );
}
