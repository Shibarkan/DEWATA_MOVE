
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  MapPin,
  BusFront,
  Route,
  ExternalLink,
} from "lucide-react";

import Reveal from "../ui/Reveal";

// =====================================
// FOOTER NAVIGATION
// =====================================

const footerLinks = {
  platform: [
    { label: "Beranda", id: "home" },
    { label: "Solusi TDM", id: "problems" },
    { label: "Data Explorer", id: "data" },
    { label: "Metodologi", id: "methodology" },
  ],

  modeling: [
    { label: "Before TDM", id: "before" },
    { label: "After TDM", id: "after" },
    { label: "Model Comparison", id: "comparison" },
  ],

  transit: [
    { label: "Operator App", id: "transit-operator" },
    { label: "Driver / Feeder", id: "transit-driver" },
    { label: "Passenger App", id: "transit-passenger" },
  ],
};

// =====================================
// FOOTER LINK COMPONENT
// =====================================

function FooterLink({ label, id, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate?.(id)}
      className="group flex w-fit items-center gap-2 text-left text-[13px] text-slate-500 transition-all duration-300 hover:translate-x-1 hover:text-[#B91C1C]"
    >
      <ArrowUpRight
        size={14}
        className="text-slate-400 transition-colors duration-300 group-hover:text-[#B91C1C]"
      />

      <span>{label}</span>
    </button>
  );
}

// =====================================
// FOOTER MAIN COMPONENT
// =====================================

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  const go = (id) => {
    onNavigate?.(id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const backToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden border-t border-slate-100 bg-[#FAFAFA]">

      {/* =====================================
          CTA SHOWCASE
      ===================================== */}

      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">

        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[28px] bg-[#B91C1C] px-7 pb-20 pt-12 text-white sm:rounded-[36px] sm:px-12 sm:pt-14 lg:px-16">

            {/* BACKGROUND DECORATIONS */}
            <div className="pointer-events-none absolute -right-24 -top-36 -z-10 h-[400px] w-[400px] rounded-full border border-white/15" />

            <div className="pointer-events-none absolute -right-12 -top-24 -z-10 h-[300px] w-[300px] rounded-full border border-white/10" />

            <div className="pointer-events-none absolute -bottom-48 -left-24 -z-10 h-[340px] w-[340px] rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">

              {/* LEFT CONTENT */}
              <div className="max-w-2xl">

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-red-100">
                  <Route size={14} />
                  DewataMove 2041
                </div>

                <h2 className="text-3xl font-black leading-[1.12] tracking-tight sm:text-4xl lg:text-[46px]">
                  The Future of Mobility
                  <br />
                  Starts Here.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-8 text-red-100/90 sm:text-base">
                  Explore how transportation data,
                  sustainable mobility strategies,
                  and simulation technology can shape
                  a better future for Denpasar.
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">

                <button
                  type="button"
                  onClick={() => go("before")}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#B91C1C] shadow-lg shadow-red-950/10 transition-all duration-300 hover:-translate-y-1 hover:bg-red-50 hover:shadow-xl"
                >
                  Explore Modeling

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => go("problems")}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/20"
                >
                  Explore TDM Solutions

                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </button>
              </div>
            </div>

            {/* ANIMATED BUS ROUTE */}
            <div
              className="pointer-events-none absolute bottom-6 left-6 right-6 h-7 sm:left-12 sm:right-12"
              aria-hidden="true"
            >
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/30" />

              <div className="footer-route-stop absolute left-0 top-1/2" />

              <div className="footer-route-stop absolute right-0 top-1/2" />

              <div className="footer-moving-bus absolute top-1/2 text-white">
                <BusFront size={23} strokeWidth={2.2} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* =====================================
          MAIN FOOTER
      ===================================== */}

      <div className="mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-8 sm:pt-20">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] lg:gap-8">

          {/* =================================
              BRAND INFORMATION
          ================================= */}

          <Reveal>
            <div className="max-w-sm">

              <button
                type="button"
                onClick={() => go("home")}
                className="group text-left text-[26px] font-black tracking-[-0.05em] text-slate-900 transition-transform duration-300 hover:scale-[1.02]"
              >
                DENPASAR
                <span className="text-[#B91C1C]">
                  2041.
                </span>
              </button>

              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Urban Mobility Simulation Laboratory
              </p>

              <p className="mt-6 text-sm leading-8 text-slate-500">
                An integrated platform for exploring
                transportation demand, evaluating
                TDM policies, and designing sustainable
                urban mobility strategies.
              </p>

              {/* TRANS METRO DEWATA */}
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#B91C1C]">
                  <BusFront size={20} />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Trans Metro Dewata
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Transit Integration Concept
                  </p>
                </div>
              </div>

              {/* LOCATION */}
              <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={15} className="text-[#B91C1C]" />
                Denpasar, Bali, Indonesia
              </div>
            </div>
          </Reveal>

          {/* =================================
              PLATFORM LINKS
          ================================= */}

          <Reveal delay={100}>
            <div>
              <h3 className="mb-6 text-sm font-bold text-slate-900">
                Platform
              </h3>

              <div className="flex flex-col gap-4">
                {footerLinks.platform.map((link) => (
                  <FooterLink
                    key={link.id}
                    {...link}
                    onNavigate={go}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          {/* =================================
              MODELING LINKS
          ================================= */}

          <Reveal delay={150}>
            <div>
              <h3 className="mb-6 text-sm font-bold text-slate-900">
                Modeling Lab
              </h3>

              <div className="flex flex-col gap-4">
                {footerLinks.modeling.map((link) => (
                  <FooterLink
                    key={link.id}
                    {...link}
                    onNavigate={go}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          {/* =================================
              TRANSIT LINKS
          ================================= */}

          <Reveal delay={200}>
            <div>
              <h3 className="mb-6 text-sm font-bold text-slate-900">
                Transit Operations
              </h3>

              <div className="flex flex-col gap-4">
                {footerLinks.transit.map((link) => (
                  <FooterLink
                    key={link.id}
                    {...link}
                    onNavigate={go}
                  />
                ))}
              </div>
            </div>
          </Reveal>

        </div>

        {/* =====================================
            RESEARCH INFORMATION
        ===================================== */}

        <Reveal>
          <div className="mt-14 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="max-w-2xl">
              <p className="text-xs font-bold text-slate-900">
                ITEC-U • ICEE ITB 2027
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Research prototype. Observed data,
                modeling assumptions, and simulation
                outputs are identified separately.
                Not an official TMD operational platform.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-red-100 bg-red-50 px-4 py-2.5 sm:self-center">
              <span className="h-2 w-2 rounded-full bg-[#B91C1C]" />

              <span className="text-[11px] font-semibold text-[#B91C1C]">
                Research & Development
              </span>
            </div>
          </div>
        </Reveal>

        {/* =====================================
            BOTTOM BAR
        ===================================== */}

        <div className="mt-12 flex flex-col justify-between gap-5 border-t border-slate-200 pt-7 md:flex-row md:items-center">

          {/* COPYRIGHT */}
          <p className="text-xs leading-6 text-slate-500">
            © {currentYear}{" "}
            <span className="font-semibold text-slate-700">
              DENPASAR 2041.
            </span>{" "}
            All Rights Reserved.
          </p>

          {/* RIGHT */}
          <div className="flex items-center justify-between gap-6 md:justify-end">

            <p className="text-xs text-slate-400">
              Built for Sustainable Urban Mobility
            </p>

            {/* BACK TO TOP */}
            <button
              type="button"
              onClick={backToTop}
              aria-label="Kembali ke atas"
              title="Back to Top"
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#B91C1C] hover:bg-[#B91C1C] hover:text-white hover:shadow-lg"
            >
              <ArrowUp
                size={18}
                className="transition-transform duration-300 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </div>

      {/* RED BOTTOM ACCENT */}
      <div className="h-[3px] w-full bg-[#B91C1C]" />

    </footer>
  );
}
