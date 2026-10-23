import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, BusFront, Flower2, Sun } from "lucide-react";

import AnimatedBus from "./AnimatedBus";

/* ==========================================
   DEWATAMOVE 2041 — BALI HERITAGE HEADER
========================================== */

const primaryLinks = [
  { id: "home", label: "Beranda" },
  { id: "problems", label: "Solusi TDM" },
  { id: "data", label: "Data" },
  { id: "methodology", label: "Metodologi" },
];

const groups = [
  {
    id: "modeling",
    label: "Modeling",
    links: [
      { id: "before", label: "Before TDM" },
      { id: "after", label: "After TDM" },
      { id: "comparison", label: "Perbandingan" },
    ],
  },
];

/* ==========================================
   DECORATIVE BALI MANDALA
========================================== */

function BaliHeaderMandala() {
  return (
    <svg viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <circle cx="90" cy="90" r="78" stroke="currentColor" strokeWidth="1" />

      <circle cx="90" cy="90" r="60" stroke="currentColor" strokeWidth="0.8" />

      <circle cx="90" cy="90" r="26" stroke="currentColor" />

      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 30} 90 90)`}>
          <path d="M90 14 Q105 37 90 53 Q75 37 90 14Z" stroke="currentColor" />
          <path d="M90 53 L90 66" stroke="currentColor" />
        </g>
      ))}

      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={i}
          cx="90"
          cy="75"
          rx="8"
          ry="16"
          transform={`rotate(${i * 45} 90 90)`}
          stroke="currentColor"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

/* ==========================================
   MAIN COMPONENT
========================================== */

export default function Header({ activePage = "home", onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState(null);
  const [desktopGroup, setDesktopGroup] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const headerRef = useRef(null);

  /* SCROLL DETECTION */

  useEffect(() => {
    const updateScroll = () => {
      setScrolled(window.scrollY > 45);
    };

    updateScroll();

    window.addEventListener("scroll", updateScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  /* CLOSE MENUS ON OUTSIDE CLICK OR ESCAPE */

  useEffect(() => {
    const closeMenus = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setDesktopGroup(null);
        setMobileOpen(false);
        setMobileGroup(null);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDesktopGroup(null);
        setMobileOpen(false);
        setMobileGroup(null);
      }
    };

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", closeMenus);

      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  /* SUBTLE HEADER PARALLAX */

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) return;

    const onPointerMove = (event) => {
      if (event.pointerType !== "mouse") return;

      const rect = header.getBoundingClientRect();

      const x = (event.clientX - rect.left) / rect.width - 0.5;

      const y = (event.clientY - rect.top) / rect.height - 0.5;

      header.style.setProperty("--dmh-mouse-x", `${x * 18}px`);

      header.style.setProperty("--dmh-mouse-y", `${y * 12}px`);
    };

    const onPointerLeave = () => {
      header.style.setProperty("--dmh-mouse-x", "0px");
      header.style.setProperty("--dmh-mouse-y", "0px");
    };

    header.addEventListener("pointermove", onPointerMove);

    header.addEventListener("pointerleave", onPointerLeave);

    return () => {
      header.removeEventListener("pointermove", onPointerMove);

      header.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  /* NAVIGATION */

  const go = (id) => {
    setMobileOpen(false);
    setMobileGroup(null);
    setDesktopGroup(null);

    onNavigate?.(id);
  };

  const isGroupActive = (links) => links.some((link) => link.id === activePage);

  return (
    <>
      <header
        ref={headerRef}
        data-scrolled={scrolled}
        className={`
          tmd-header dmh-header
          fixed left-1/2 z-50
          -translate-x-1/2
          transition-[top,width,max-width,border-radius,box-shadow]
          duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            scrolled
              ? "top-3 w-[calc(100%-24px)] max-w-[1140px] rounded-full sm:top-5"
              : "top-0 w-full max-w-none rounded-none"
          }
        `}
      >
        {/* BACKGROUND PATTERN */}
        <div
          className="dmh-header-texture pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
        />

        {/* DECORATIVE GOLD GLOW */}
        <div
          className="dmh-header-glow pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
        />

        {/* BALI MANDALA */}
        <div
          className="dmh-header-mandala pointer-events-none absolute -right-5 -top-16 z-0 h-40 w-40 sm:right-[20%]"
          aria-hidden="true"
        >
          <BaliHeaderMandala />
        </div>

        {/* ANIMATED BUS ORBIT */}
        <AnimatedBus />

        {/* MAIN NAVBAR */}
        <div
          className={`
            relative z-10 mx-auto
            flex items-center justify-between gap-3
            transition-all duration-500
            ${
              scrolled
                ? "h-[64px] px-4 sm:px-8"
                : "h-[78px] px-4 sm:px-8 lg:px-10"
            }
          `}
        >
          {/* =================================
              BRAND
          ================================= */}

          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => go("home")}
              className="dmh-brand group flex shrink-0 items-center gap-2.5 text-left"
              aria-label="DewataMove 2041 - Beranda"
            >
              <div className="flex flex-col">
                <span className="dmh-brand-name text-[16px] font-black leading-tight tracking-tight sm:text-[19px]">
                  Dewata
                  <span className="dmh-brand-accent">Move</span>
                </span>

                <span className="dmh-brand-subtitle text-[9px] font-bold uppercase tracking-[0.2em]">
                  Denpasar 2041
                </span>
              </div>
            </button>

            {/* TMD LOGO */}
            <div className="dmh-tmd-logo hidden items-center justify-center rounded-full px-3 py-2 sm:flex">
              {!logoError ? (
                <img
                  src="/tmd-logo.svg"
                  alt="Logo Trans Metro Dewata"
                  className="h-[19px] w-[105px] object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <BusFront size={16} />

                  <span className="text-xs font-black">TMD</span>
                </div>
              )}
            </div>
          </div>

          {/* =================================
              DESKTOP NAVIGATION
          ================================= */}

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 xl:flex"
          >
            {primaryLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                data-active={activePage === link.id}
                aria-current={activePage === link.id ? "page" : undefined}
                className="dmh-nav-link whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold"
              >
                {link.label}
              </button>
            ))}

            {/* DROPDOWN GROUPS */}
            {groups.map((group) => (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setDesktopGroup(desktopGroup === group.id ? null : group.id)
                  }
                  data-active={isGroupActive(group.links)}
                  aria-expanded={desktopGroup === group.id}
                  aria-controls={`dmh-dropdown-${group.id}`}
                  className="dmh-nav-link flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold"
                >
                  {group.label}

                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-300 ${
                      desktopGroup === group.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {desktopGroup === group.id && (
                  <div
                    id={`dmh-dropdown-${group.id}`}
                    className="dmh-dropdown absolute right-0 top-full z-30 mt-5 min-w-[220px] rounded-2xl p-2"
                  >
                    {/* DROPDOWN TITLE */}
                    <div className="dmh-dropdown-heading flex items-center gap-2 px-3 py-3">
                      <Flower2 size={15} />

                      <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                        Mobility Simulation
                      </span>
                    </div>

                    {group.links.map((link) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => go(link.id)}
                        data-active={activePage === link.id}
                        className="dmh-dropdown-link block w-full rounded-xl px-4 py-3 text-left text-sm font-medium"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* =================================
              MOBILE MENU BUTTON
          ================================= */}

          <button
            type="button"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setDesktopGroup(null);
            }}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="dmh-mobile-menu"
            className="dmh-menu-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 xl:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* =================================
            MOBILE DROPDOWN
        ================================= */}

        {mobileOpen && (
          <div
            id="dmh-mobile-menu"
            className="dmh-mobile-panel absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-3xl xl:hidden"
          >
            {/* MOBILE BRAND HEADER */}
            <div className="dmh-mobile-heading flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  DewataMove
                </span>
              </div>
            </div>

            <nav
              aria-label="Navigasi mobile"
              className="max-h-[70vh] space-y-1 overflow-y-auto p-3"
            >
              {primaryLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => go(link.id)}
                  data-active={activePage === link.id}
                  aria-current={activePage === link.id ? "page" : undefined}
                  className="dmh-mobile-link block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold"
                >
                  {link.label}
                </button>
              ))}

              {groups.map((group) => (
                <div key={group.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileGroup(mobileGroup === group.id ? null : group.id)
                    }
                    aria-expanded={mobileGroup === group.id}
                    className="dmh-mobile-link flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    {group.label}

                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        mobileGroup === group.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileGroup === group.id && (
                    <div className="dmh-mobile-submenu ml-4 space-y-1 border-l-2 pl-3">
                      {group.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => go(link.id)}
                          data-active={activePage === link.id}
                          className="dmh-mobile-link block w-full rounded-lg px-4 py-2.5 text-left text-sm"
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* HEADER SPACER */}
      <div className="h-[78px]" aria-hidden="true" />
    </>
  );
}
