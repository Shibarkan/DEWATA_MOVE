import { motion, useReducedMotion } from "motion/react";

export default function EmptyResults({ stage, onNavigate }) {
  const reduceMotion = useReducedMotion();
  const after = stage === "after";

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex min-h-[420px] max-w-[760px] flex-col items-center justify-center py-16 text-center sm:min-h-[510px]"
      aria-labelledby="dm-empty-title"
    >
      <h2
        id="dm-empty-title"
        className="mt-6 max-w-[600px] text-[clamp(1.65rem,4.5vw,2.65rem)] font-bold leading-tight tracking-[-0.05em] text-slate-900"
      >
        Kebijakan belum diterapkan.
      </h2>

      <p className="mt-4 max-w-lg text-[13px] leading-7 text-slate-500 sm:text-[14px]">
        {after
          ? "Untuk melihat kondisi Sesudah, atur parameter kebijakan TDM terlebih dahulu dan jalankan skenarionya pada halaman Proses."
          : "Belum ada hasil yang dapat dibandingkan. Jalankan skenario melalui halaman Proses untuk menampilkan analisis Sebelum dan Sesudah."}
      </p>

      <motion.button
        type="button"
        whileHover={reduceMotion ? {} : { y: -2 }}
        whileTap={reduceMotion ? {} : { scale: 0.98 }}
        onClick={() => onNavigate?.("process")}
        className="mt-7 rounded-full bg-[#B91C1C] px-7 py-3.5 text-[13px] font-bold text-white hover:bg-[#991B1B]"
      >
        Atur kebijakan
      </motion.button>

      <p className="mt-5 text-[11px] text-slate-400">
        Hasil akan tampil setelah perhitungan berhasil.
      </p>
    </motion.section>
  );
}
