
import { useState } from "react";
import {
  Map,
  Box,
  RotateCcw,
  Route,
} from "lucide-react";

export default function SimulationPreview() {
  const [view, setView] = useState("perspective");
  const [showRoutes, setShowRoutes] = useState(true);

  const reset = () => {
    setView("perspective");
    setShowRoutes(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1250px] rounded-[30px] border border-slate-200 bg-white p-2.5 shadow-[0_25px_70px_rgba(15,23,42,0.09)] sm:p-3">

      <div className="relative h-[360px] overflow-hidden rounded-[22px] bg-[#E9EEE9] sm:h-[460px] lg:h-[580px]">

        {/* CONTROL BAR */}
        <div className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-2 rounded-2xl bg-[#252A2E]/95 p-2 text-white shadow-lg backdrop-blur-md sm:left-4 sm:top-4">

          <span className="hidden px-3 text-[11px] font-extrabold tracking-widest sm:block">
            MOBILITY LAB
          </span>

          <button
            onClick={() => setView("top")}
            aria-pressed={view === "top"}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition ${
              view === "top"
                ? "bg-[#B91C1C] text-white"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <Map size={14} />
            2D
          </button>

          <button
            onClick={() => setView("perspective")}
            aria-pressed={view === "perspective"}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition ${
              view === "perspective"
                ? "bg-[#B91C1C] text-white"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <Box size={14} />
            Perspective
          </button>

          <button
            onClick={() => setShowRoutes(!showRoutes)}
            aria-pressed={showRoutes}
            className={`rounded-lg px-3 py-2 text-xs transition ${
              showRoutes
                ? "bg-white/20"
                : "bg-white/10 opacity-65"
            }`}
          >
            <Route size={15} />
          </button>

          <button
            onClick={reset}
            title="Reset view"
            aria-label="Reset view"
            className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* BACKGROUND GRID */}
        <div className="preview-grid absolute inset-0" />

        {/* NETWORK VISUALIZATION */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 1200 650"
            role="img"
            aria-label="Ilustrasi jaringan transportasi demonstrasi"
            className={`network-stage h-full w-full ${
              view === "perspective" ? "network-tilt" : ""
            }`}
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D9E5D7" />
                <stop offset="100%" stopColor="#EDE9DE" />
              </linearGradient>

              <linearGradient id="road" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4E6266" />
                <stop offset="100%" stopColor="#303F46" />
              </linearGradient>

              <filter id="routeGlow">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>

            <rect width="1200" height="650" fill="url(#ground)" />

            {/* CITY BLOCKS */}
            <g fill="#B1C5B0" opacity="0.55">
              <path d="M0 0H420L330 160H0Z" />
              <path d="M860 0H1200V190L1020 155Z" />
              <path d="M0 460L250 490L310 650H0Z" />
              <path d="M850 470L1200 410V650H940Z" />
            </g>

            {/* BUILDING SHADOWS */}
            <g fill="#A3AEA6" opacity="0.35">
              {Array.from({ length: 7 }, (_, i) => (
                <g key={i}>
                  <rect
                    x={90 + i * 135}
                    y={110 + (i % 3) * 19}
                    width="68"
                    height="46"
                    rx="4"
                  />

                  <rect
                    x={80 + i * 143}
                    y={480 + (i % 2) * 23}
                    width="76"
                    height="41"
                    rx="4"
                  />
                </g>
              ))}
            </g>

            {/* SECONDARY ROAD OUTLINES */}
            <g
              stroke="#F8F5EC"
              strokeWidth="45"
              fill="none"
              strokeLinecap="round"
            >
              <path d="M160 -60 L420 720" />
              <path d="M900 -50 L660 730" />
              <path d="M-50 185 L1250 245" />
              <path d="M-50 520 L1250 440" />
            </g>

            {/* SECONDARY ROADS */}
            <g
              stroke="#899994"
              strokeWidth="27"
              fill="none"
              strokeLinecap="round"
            >
              <path d="M160 -60 L420 720" />
              <path d="M900 -50 L660 730" />
              <path d="M-50 185 L1250 245" />
              <path d="M-50 520 L1250 440" />
            </g>

            {/* MAIN ROAD OUTLINE */}
            <path
              d="M-60 330 C300 340 530 260 770 315 S1080 370 1260 310"
              stroke="#F8F5EC"
              strokeWidth="94"
              fill="none"
            />

            {/* MAIN ROAD */}
            <path
              d="M-60 330 C300 340 530 260 770 315 S1080 370 1260 310"
              stroke="url(#road)"
              strokeWidth="76"
              fill="none"
            />

            {/* MAIN ROAD CENTER LINE */}
            <path
              d="M-60 330 C300 340 530 260 770 315 S1080 370 1260 310"
              stroke="#F3D889"
              strokeWidth="2.5"
              strokeDasharray="16 14"
              fill="none"
              opacity="0.9"
            />

            {/* ANIMATED TRANSPORT FLOW */}
            {showRoutes && (
              <g fill="none">
                <path
                  d="M-60 314 C300 324 530 244 770 299 S1080 354 1260 294"
                  stroke="#EF4444"
                  strokeWidth="16"
                  opacity="0.25"
                  filter="url(#routeGlow)"
                />

                <path
                  d="M-60 314 C300 324 530 244 770 299 S1080 354 1260 294"
                  stroke="#EF4444"
                  strokeWidth="5"
                  strokeDasharray="24 28"
                  className="route-flow"
                />

                <path
                  d="M180 -40 L425 700"
                  stroke="#F97316"
                  strokeWidth="5"
                  strokeDasharray="18 26"
                  className="route-flow route-flow-slow"
                />

                <path
                  d="M915 -40 L675 700"
                  stroke="#F97316"
                  strokeWidth="5"
                  strokeDasharray="18 26"
                  className="route-flow"
                />

                {/* ILLUSTRATIVE NETWORK NODES */}
                {[
                  [315, 328],
                  [470, 300],
                  [680, 290],
                  [890, 340],
                  [400, 490],
                  [760, 460],
                ].map(([x, y], index) => (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="16"
                      fill="#EF4444"
                      opacity="0.14"
                      className="node-pulse"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#FFFFFF"
                      stroke="#B91C1C"
                      strokeWidth="3"
                    />
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>

        {/* TOP RIGHT LABEL */}
        <div className="absolute right-4 top-20 hidden rounded-full border border-white/50 bg-white/85 px-4 py-2 text-[11px] font-bold tracking-wider text-slate-700 shadow-sm backdrop-blur sm:right-5 sm:top-5 sm:block">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#B91C1C]" />
          DEMO SCENE
        </div>

        {/* INFORMATION BAR */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6 sm:p-5">

          <div>
            <p className="text-xs font-bold text-slate-900 sm:text-sm">
              Transportation Network Preview
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Demo network — not geographically validated
            </p>
          </div>

          <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-bold text-[#B91C1C]">
            VISUAL CONCEPT
          </span>
        </div>
      </div>
    </div>
  );
}
