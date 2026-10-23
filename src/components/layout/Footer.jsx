import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BusFront,
  Route,
  Flower2,
  Sun,
  Leaf,
  MapPin,
  Database,
  GitCompareArrows,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ==========================================
   BALINESE DECORATIVE COMPONENTS
========================================== */

function BaliMandala() {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="106" stroke="currentColor" strokeWidth="1" />
      <circle
        cx="120"
        cy="120"
        r="92"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <circle cx="120" cy="120" r="61" stroke="currentColor" />
      <circle cx="120" cy="120" r="25" stroke="currentColor" />

      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 30} 120 120)`}>
          <path
            d="M120 15 Q142 43 120 65 Q98 43 120 15Z"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path d="M120 65 L120 94" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="120" cy="8" r="2.5" fill="currentColor" />
        </g>
      ))}

      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={i}
          cx="120"
          cy="101"
          rx="11"
          ry="20"
          transform={`rotate(${i * 45} 120 120)`}
          stroke="currentColor"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

function BaliGate() {
  return (
    <svg
      viewBox="0 0 400 420"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dmf-gate-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE4A8" />
          <stop offset="55%" stopColor="#E5AB58" />
          <stop offset="100%" stopColor="#A96430" />
        </linearGradient>
      </defs>

      {/* LEFT CANDI BENTAR */}
      <path
        d="
          M35 420
          L55 260
          L42 260
          L67 223
          L54 223
          L85 184
          L72 184
          L104 137
          L96 137
          L117 88
          L110 88
          L135 20
          L155 92
          L143 139
          L160 183
          L151 183
          L174 222
          L160 260
          L170 420
          Z
        "
        fill="url(#dmf-gate-gold)"
        fillOpacity="0.6"
        stroke="#FFDB91"
        strokeWidth="2"
      />

      {/* RIGHT CANDI BENTAR */}
      <path
        d="
          M365 420
          L345 260
          L358 260
          L333 223
          L346 223
          L315 184
          L328 184
          L296 137
          L304 137
          L283 88
          L290 88
          L265 20
          L245 92
          L257 139
          L240 183
          L249 183
          L226 222
          L240 260
          L230 420
          Z
        "
        fill="url(#dmf-gate-gold)"
        fillOpacity="0.6"
        stroke="#FFDB91"
        strokeWidth="2"
      />

      {/* ARCHITECTURAL DETAILS */}
      <g stroke="#FFF0C7" strokeWidth="2" opacity="0.7">
        <path d="M55 260 H160" />
        <path d="M67 223 H174" />
        <path d="M85 184 H160" />
        <path d="M104 137 H143" />

        <path d="M345 260 H240" />
        <path d="M333 223 H226" />
        <path d="M315 184 H240" />
        <path d="M296 137 H257" />

        <path d="M78 420 L89 292" />
        <path d="M110 420 L116 292" />

        <path d="M322 420 L311 292" />
        <path d="M290 420 L284 292" />
      </g>
    </svg>
  );
}

function BaliFlower() {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <ellipse
          key={i}
          cx="70"
          cy="40"
          rx="20"
          ry="33"
          transform={`rotate(${i * 72} 70 70)`}
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}

      <circle cx="70" cy="70" r="14" stroke="currentColor" strokeWidth="2" />
      <circle cx="70" cy="70" r="5" fill="currentColor" />
    </svg>
  );
}

/* ==========================================
   FOOTER NAVIGATION DATA
========================================== */

const exploreLinks = [
  { label: "Home", page: "home" },
  { label: "The Problems", page: "problems" },
  { label: "Transportation Data", page: "data" },
  { label: "Methodology", page: "methodology" },
];

const modelingLinks = [
  { label: "Before Modeling", page: "before" },
  { label: "After Modeling", page: "after" },
  { label: "Comparison", page: "comparison" },
  { label: "Transit Integration", page: "transit" },
];

/* ==========================================
   MAIN FOOTER
========================================== */

export default function Footer({ go }) {
  const cardRef = useRef(null);

  /* ========================================
     MULTI-LAYER PARALLAX
  ======================================== */

  useEffect(() => {
    const card = cardRef.current;

    if (!card) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) return;

    let rafId = 0;

    const handlePointerMove = (event) => {
      if (event.pointerType !== "mouse") return;

      const rect = card.getBoundingClientRect();

      const x = (event.clientX - rect.left) / rect.width - 0.5;

      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--dmf-gate-x", `${x * -35}px`);
      card.style.setProperty("--dmf-gate-y", `${y * -24}px`);

      card.style.setProperty("--dmf-mandala-x", `${x * 22}px`);
      card.style.setProperty("--dmf-mandala-y", `${y * 18}px`);

      card.style.setProperty("--dmf-flower-x", `${x * 45}px`);
      card.style.setProperty("--dmf-flower-y", `${y * 32}px`);
    };

    const handlePointerLeave = () => {
      const variables = [
        "--dmf-gate-x",
        "--dmf-gate-y",
        "--dmf-mandala-x",
        "--dmf-mandala-y",
        "--dmf-flower-x",
        "--dmf-flower-y",
      ];

      variables.forEach((variable) => {
        card.style.setProperty(variable, "0px");
      });
    };

    const updateScrollParallax = () => {
      rafId = 0;

      const rect = card.getBoundingClientRect();

      const center = rect.top + rect.height / 2;

      const viewportCenter = window.innerHeight / 2;

      const distance = (center - viewportCenter) / window.innerHeight;

      const progress = Math.max(-1, Math.min(1, distance));

      card.style.setProperty("--dmf-scroll-gate", `${progress * 32}px`);

      card.style.setProperty("--dmf-scroll-mandala", `${progress * -20}px`);

      card.style.setProperty("--dmf-scroll-flower", `${progress * 40}px`);
    };

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(updateScrollParallax);
    };

    card.addEventListener("pointermove", handlePointerMove);

    card.addEventListener("pointerleave", handlePointerLeave);

    window.addEventListener("scroll", handleScroll, { passive: true });

    window.addEventListener("resize", handleScroll);

    updateScrollParallax();

    return () => {
      card.removeEventListener("pointermove", handlePointerMove);

      card.removeEventListener("pointerleave", handlePointerLeave);

      window.removeEventListener("scroll", handleScroll);

      window.removeEventListener("resize", handleScroll);

      cancelAnimationFrame(rafId);
    };
  }, []);

  const navigate = (page) => {
    if (typeof go === "function") {
      go(page);
    }
  };

  return (
    <footer className="mt-20 w-full">
      {/* =====================================
          PREMIUM BALI CTA
      ===================================== */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section
          ref={cardRef}
          className="dmf-cta relative isolate overflow-hidden rounded-[28px] px-7 pb-24 pt-12 text-white sm:rounded-[36px] sm:px-12 sm:pb-28 sm:pt-16 lg:px-16"
          aria-labelledby="dmf-cta-title"
        >
          {/* BACKGROUND PATTERN */}
          <div className="dmf-texture pointer-events-none absolute inset-0 z-0" />

          <div className="pointer-events-none absolute -right-24 -top-36 z-0 h-[400px] w-[400px] rounded-full border border-[#F8D99C]/15" />

          <div className="pointer-events-none absolute -right-12 -top-24 z-0 h-[300px] w-[300px] rounded-full border border-[#F8D99C]/10" />

          <div className="pointer-events-none absolute -bottom-40 -left-24 z-0 h-[340px] w-[340px] rounded-full bg-[#F8D99C]/10 blur-3xl" />

          {/* BALINESE MANDALA */}
          <div
            aria-hidden="true"
            className="dmf-parallax-mandala pointer-events-none absolute -right-20 -top-36 z-0 h-[360px] w-[360px] text-[#F8D99C]/35 sm:right-[13%]"
          >
            <BaliMandala />
          </div>

          {/* CANDI BENTAR */}
          <div
            aria-hidden="true"
            className="dmf-parallax-gate pointer-events-none absolute -bottom-10 right-[2%] z-0 w-[240px] opacity-40 sm:right-[8%] sm:w-[340px] lg:right-[21%] lg:w-[400px]"
          >
            <BaliGate />
          </div>

          {/* FLOATING FLOWER */}
          <div
            aria-hidden="true"
            className="dmf-parallax-flower pointer-events-none absolute right-4 top-6 z-0 h-24 w-24 text-[#F9D895]/50 sm:right-12 sm:top-9 sm:h-32 sm:w-32"
          >
            <BaliFlower />
          </div>

          {/* CONTENT */}
          <div className="relative z-10 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            {/* LEFT CONTENT */}
            <div className="max-w-2xl">
              {/* LABEL */}

              {/* EYEBROW */}
              <div className="mb-4 flex items-center gap-3 text-[#F9D99C]">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">
                  Transforming Urban Mobility
                </span>
              </div>

              {/* TITLE */}
              <h2
                id="dmf-cta-title"
                className="max-w-2xl text-3xl font-black leading-[1.12] tracking-tight sm:text-4xl lg:text-[46px]"
              >
                The Future of Mobility
                <br />
                <span className="dmf-gold-text">Starts Here.</span>
              </h2>

              {/* DESCRIPTION */}
              <p className="mt-5 max-w-xl text-sm leading-8 text-red-100/90 sm:text-base">
                Explore how transportation data, sustainable mobility
                strategies, and simulation technology can shape a smarter,
                greener, and more connected Denpasar.
              </p>

              {/* FEATURE CHIPS */}
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="dmf-feature-chip">
                  <Route size={14} />
                  13 Urban Zones
                </span>

                <span className="dmf-feature-chip">
                  <Leaf size={14} />
                  Sustainable Mobility
                </span>

                <span className="dmf-feature-chip">
                  <Sparkles size={14} />
                  TDM Strategy
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto lg:min-w-[230px]">
              <button
                type="button"
                onClick={() => navigate("before")}
                className="dmf-primary-button group inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#A51B24] shadow-xl shadow-red-950/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFF2DA] hover:shadow-2xl"
              >
                Explore Modeling
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>

              <button
                type="button"
                onClick={() => navigate("problems")}
                className="dmf-secondary-button group inline-flex items-center justify-center gap-2 rounded-full border border-[#F8D99C]/40 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F8D99C] hover:bg-white/20"
              >
                Explore TDM Solutions
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </button>

              <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.17em] text-[#F9D99C]/80">
                <Sun size={14} />
                Bali
              </div>
            </div>
          </div>

          {/* ANIMATED TRANSPORT ROUTE */}
          <div
            className="pointer-events-none absolute bottom-7 left-7 right-7 z-10 h-8 sm:left-12 sm:right-12 lg:left-16 lg:right-16"
            aria-hidden="true"
          >
            <div className="dmf-route-line absolute left-0 right-0 top-1/2" />

            {[0, 33.33, 66.66, 100].map((position) => (
              <span
                key={position}
                className="dmf-route-stop absolute top-1/2"
                style={{ left: `${position}%` }}
              />
            ))}

            <div className="dmf-moving-bus absolute top-1/2 text-[#FFE1A0]">
              <BusFront size={25} strokeWidth={2.2} />
            </div>
          </div>
        </section>
      </div>

      {/* =====================================
          MAIN FOOTER
      ===================================== */}

      <div className="dmf-footer-main mt-14">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            {/* BRAND */}
            <div className="sm:col-span-2 lg:col-span-5">
              <button
                type="button"
                onClick={() => navigate("home")}
                className="group inline-flex items-center gap-3 text-left"
              >
                <div className="dmf-brand-mark flex h-12 w-12 items-center justify-center rounded-2xl">
                  <BusFront size={25} strokeWidth={2} />
                </div>

                <div>
                  <div className="text-xl font-black tracking-tight text-white">
                    Dewata
                    <span className="text-[#E8B967]">Move</span>
                  </div>

                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Denpasar 2041
                  </div>
                </div>
              </button>

              <p className="mt-6 max-w-sm text-sm leading-8 text-slate-400">
                Reimagining Denpasar's transportation future through data-driven
                planning, sustainable mobility, and intelligent urban
                simulations.
              </p>
            </div>

            {/* EXPLORE */}
            <div className="lg:col-span-2">
              <h3 className="dmf-column-title">Explore</h3>

              <div className="mt-5 flex flex-col gap-3">
                {exploreLinks.map((link) => (
                  <button
                    key={link.page}
                    type="button"
                    onClick={() => navigate(link.page)}
                    className="dmf-footer-link group flex items-center gap-2 text-left text-sm text-slate-400"
                  >
                    <ChevronRight
                      size={13}
                      className="text-[#E8B967]/60 transition-transform group-hover:translate-x-1"
                    />

                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MODELING */}
            <div className="lg:col-span-3">
              <h3 className="dmf-column-title">Modeling & Simulation</h3>

              <div className="mt-5 flex flex-col gap-3">
                {modelingLinks.map((link) => (
                  <button
                    key={link.page}
                    type="button"
                    onClick={() => navigate(link.page)}
                    className="dmf-footer-link group flex items-center gap-2 text-left text-sm text-slate-400"
                  >
                    <ChevronRight
                      size={13}
                      className="text-[#E8B967]/60 transition-transform group-hover:translate-x-1"
                    />

                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PROJECT */}
            <div className="lg:col-span-2">
              <h3 className="dmf-column-title">Our Vision</h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <Database size={16} className="mt-0.5 text-[#E8B967]" />
                  Data-Driven Planning
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <Leaf size={16} className="mt-0.5 text-[#E8B967]" />
                  Greener Mobility
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <GitCompareArrows
                    size={16}
                    className="mt-0.5 text-[#E8B967]"
                  />
                  Future Simulation
                </div>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="dmf-footer-divider mt-12" />

          {/* FOOTER BOTTOM */}
          <div className="flex flex-col items-center justify-between gap-5 pt-7 text-center sm:flex-row sm:text-left">
            <p className="text-xs leading-6 text-slate-500">
              © {new Date().getFullYear()} DewataMove 2041. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Flower2 size={15} className="text-[#E8B967]" />
              Inspired by Jembatan Sirotu.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
