import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, BusFront, Flower2, Sun } from "lucide-react";

import AnimatedBus from "./AnimatedBus";

import { ModelingDropdown, ModelingMobileLinks } from "../ModelingDropdown";

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
      { id: "process", label: "Proses TDM" },
      { id: "after", label: "After TDM" },
      { id: "comparison", label: "Perbandingan" },
    ],
  },
];

// Motif jalur transportasi dekoratif
function HeaderRoutePattern() {
  return (
    <svg viewBox="0 0 220 140" fill="none" aria-hidden="true">
      <path
        d="M-12 104C24 104 31 68 67 68H91C119 68 124 105 153 105H181C204 105 207 79 232 79"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M-10 118C30 118 39 82 69 82H88C112 82 119 119 154 119H184C211 119 215 94 231 94"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path
        d="M17 29H54C74 29 77 48 94 48H126C143 48 148 28 168 28H211"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M112 48V68M153 105V119M67 68V82"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <circle cx="54" cy="29" r="2.5" fill="currentColor" />
      <circle cx="94" cy="48" r="2.5" fill="currentColor" />
      <circle cx="153" cy="105" r="2.5" fill="currentColor" />
      <circle cx="184" cy="119" r="2.5" fill="currentColor" />
    </svg>
  );
}

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
          fixed left-1/2 z-[10000]
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

        {/* POLA JALUR TRANSPORTASI */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
          aria-hidden="true"
        >
          <div className="dmh-header-route absolute right-[18%] top-0 h-full w-44">
            <HeaderRoutePattern />
          </div>
        </div>

        {/* ANIMATED BUS ORBIT */}
        <AnimatedBus />

        {/* MAIN NAVBAR */}
        <div
          className={`
            relative z-10 mx-auto
            flex items-center justify-between gap-3
            transition-all duration-500
            z-index-100
            ${
              scrolled
                ? "h-[64px] px-4 sm:px-8"
                : "h-[78px] px-4 sm:px-8 lg:px-10"
            }
          `}
        >

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
          </div>

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
                    className="dmh-dropdown dmh-model-dropdown absolute right-0 top-full z-30 mt-5 rounded-2xl p-2"
                  >
                    <ModelingDropdown
                      links={group.links}
                      activePage={activePage}
                      onSelect={go}
                    />
                  </div>
                )}
              </div>
            ))}
          </nav>

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
                      <ModelingMobileLinks
                        links={group.links}
                        activePage={activePage}
                        onSelect={go}
                      />
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
