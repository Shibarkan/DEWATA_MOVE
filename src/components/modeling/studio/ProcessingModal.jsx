import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const ANALYSIS_STEPS = [
  {
    title: "Memuat data dasar",
    detail:
      "Menyiapkan MAT 2026 dan parameter proyeksi.",
  },
  {
    title: "Menghitung dampak kebijakan",
    detail:
      "Menghitung matriks Before dan After pada horizon 2041.",
  },
  {
    title: "Mensimulasikan arus perjalanan",
    detail:
      "Membebankan OD pada koridor sampel, jika jaringan tersedia.",
  },
  {
    title: "Mengkaji hasil simulasi",
    detail:
      "Memeriksa konsistensi total dan menyiapkan hasil.",
  },
];

export default function ProcessingModal({ phase, graphAvailable }) {
  const dialogRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const phases = ANALYSIS_STEPS.map(
    (step, index) =>
      index === 2 && !graphAvailable
        ? {
            ...step,
            detail:
              "Matriks siap; jaringan jalan sampel belum tersedia.",
          }
        : step
  );

  const index = Math.max(
    0,
    Math.min(phase, phases.length - 1)
  );

  const current = phases[index];
  const progress =
    ((index + 1) / phases.length) * 100;

  useEffect(() => {
    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, []);

  return (
    <motion.div
      key="model-processing-overlay"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[8400] flex items-center justify-center bg-slate-950/15 px-4 py-5 backdrop-blur-[3px]"
    >
      <motion.section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-process-title"
        aria-describedby="dm-process-desc"
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            dialogRef.current?.focus();
          }
        }}
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 24,
                scale: 0.97,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 12,
          scale: 0.98,
        }}
        transition={{
          type: "spring",
          stiffness: 330,
          damping: 29,
        }}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white px-6 pb-7 pt-8 shadow-[0_24px_100px_rgba(15,23,42,.13)] outline-none sm:px-9 sm:pb-9 sm:pt-10"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B91C1C]">
            DEWATAMOVE 2041
          </span>

          <div className="flex items-center gap-1.5">
            {phases.map((_, i) => (
              <motion.span
                key={i}
                animate={{
                  backgroundColor:
                    i <= index
                      ? "#B91C1C"
                      : "#E2E8F0",
                  width: i === index ? 22 : 6,
                }}
                transition={{ duration: 0.32 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>

        <div
          className="relative mb-8 flex h-20 items-center justify-center"
          aria-hidden="true"
        >
          <motion.div
            className="absolute h-[74px] w-[74px] rounded-full border border-[#B91C1C]/15"
            animate={
              reduceMotion
                ? {}
                : {
                    scale: [0.95, 1.16, 0.95],
                    opacity: [0.7, 0.25, 0.7],
                  }
            }
            transition={{
              duration: 2.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="h-[48px] w-[48px] rounded-full border-[3px] border-[#FCE8E8] border-t-[#B91C1C]"
            animate={
              reduceMotion
                ? {}
                : { rotate: 360 }
            }
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <h2
          id="dm-process-title"
          className="text-center text-[23px] font-bold tracking-[-0.045em] text-slate-900 sm:text-[28px]"
        >
          Memproses skenario
        </h2>

        <div className="mt-4 min-h-[86px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 10,
                      filter: "blur(4px)",
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={
                reduceMotion
                  ? {}
                  : {
                      opacity: 0,
                      y: -8,
                      filter: "blur(4px)",
                    }
              }
              transition={{
                duration: 0.26,
                ease: "easeOut",
              }}
              className="text-center"
              aria-live="polite"
            >
              <p
                id="dm-process-desc"
                className="text-[14px] font-semibold text-slate-800"
              >
                {current.title}
              </p>

              <p className="mt-1.5 text-[12px] leading-6 text-slate-500">
                {current.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100"
          aria-label="Progres perhitungan"
        >
          <motion.div
            className="h-full rounded-full bg-[#B91C1C]"
            initial={{ width: "6%" }}
            animate={{ width: `${progress}%` }}
            transition={{
              type: "spring",
              stiffness: 105,
              damping: 21,
            }}
          />
        </div>

        <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
          Model MAT dan pembebanan jaringan sampel
        </p>
      </motion.section>
    </motion.div>
  );
}
