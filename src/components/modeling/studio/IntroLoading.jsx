import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export default function IntroLoading({ onComplete }) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId;

    const start = performance.now();
    const duration = reduceMotion ? 420 : 1450;

    const tick = (now) => {
      const ratio = Math.min(
        1,
        (now - start) / duration
      );

      setProgress(Math.round(ratio * 100));

      if (ratio < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [onComplete, reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={
        reduceMotion
          ? {}
          : { opacity: 0, transition: { duration: 0.22 } }
      }
      className="fixed inset-0 z-[7500] grid place-items-center bg-[#FFFEFD] px-5"
      role="status"
      aria-label="Memuat halaman modeling"
    >
      <div className="w-full max-w-3xl text-center">
        <motion.h2
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                  letterSpacing: "-0.10em",
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            letterSpacing: "-0.065em",
          }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="select-none text-[clamp(3.2rem,11vw,8.5rem)] font-black leading-none text-[#B91C1C]"
        >
          MODELING
        </motion.h2>

        <div className="mx-auto mt-9 h-[3px] w-full max-w-[290px] overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-[#B91C1C]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.08,
              ease: "linear",
            }}
          />
        </div>

        <p className="mt-3 text-[11px] font-semibold tracking-[0.14em] tabular-nums text-slate-400">
          {progress}%
        </p>

        <button
          type="button"
          onClick={onComplete}
          className="mt-6 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-[#B91C1C]"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
