import { useEffect, useState } from "react";

export default function IntroLoading({ onComplete, ready = false }) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [progress, setProgress] = useState(0);
  const [durationElapsed, setDurationElapsed] = useState(false);

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
        setDurationElapsed(true);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [reduceMotion]);

  useEffect(() => {
    if (durationElapsed && ready) {
      onComplete();
    }
  }, [durationElapsed, onComplete, ready]);

  return (
    <div
      className="fixed inset-0 z-[7500] grid place-items-center bg-[#FFFEFD] px-5"
      role="status"
      aria-label="Memuat halaman modeling"
    >
      <div className="w-full max-w-3xl text-center">
        <h2
          className="select-none text-[clamp(3.2rem,11vw,8.5rem)] font-black leading-none text-[#B91C1C]"
        >
          MODELING
        </h2>

        <div className="mx-auto mt-9 h-[3px] w-full max-w-[290px] overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#B91C1C]"
            style={{
              width: `${progress}%`,
              transition: reduceMotion ? "none" : "width 80ms linear",
            }}
          />
        </div>

        <p className="mt-3 text-[11px] font-semibold tracking-[0.14em] tabular-nums text-slate-400">
          {progress}%
        </p>

      </div>
    </div>
  );
}
