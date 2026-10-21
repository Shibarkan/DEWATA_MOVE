
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  BusFront,
} from "lucide-react";

import AnimatedBus from "./AnimatedBus";

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
  {
    id: "transit",
    label: "Transit App",
    links: [
      { id: "transit-operator", label: "Operator" },
      { id: "transit-driver", label: "Driver / Feeder" },
      { id: "transit-passenger", label: "Penumpang" },
    ],
  },
];

export default function Header({
  activePage = "home",
  onNavigate,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState(null);
  const [desktopGroup, setDesktopGroup] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const headerRef = useRef(null);

  // SCROLL DETECTION
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

  // CLOSE MENUS
  useEffect(() => {
    const closeMenus = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setDesktopGroup(null);
        setMobileOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDesktopGroup(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const go = (id) => {
    setMobileOpen(false);
    setMobileGroup(null);
    setDesktopGroup(null);
    onNavigate?.(id);
  };

  const isGroupActive = (links) =>
    links.some((link) => link.id === activePage);

  return (
    <>
      <header
        ref={headerRef}
        data-scrolled={scrolled}
        className={`
          tmd-header
          fixed left-1/2 z-50
          -translate-x-1/2
          bg-[#B91C1C] text-white
          transition-[top,width,max-width,border-radius,box-shadow]
          duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            scrolled
              ? "top-3 w-[calc(100%-24px)] max-w-[1140px] rounded-full shadow-[0_15px_45px_rgba(0,0,0,0.18)] sm:top-5"
              : "top-0 w-full max-w-none rounded-none"
          }
        `}
      >
        {/* MOVING BUSES */}
        <AnimatedBus />

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
          {/* BRAND */}
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <button
              onClick={() => go("home")}
              className="shrink-0 text-left text-[16px] font-black tracking-tight text-white sm:text-[21px]"
            >
              DENPASAR2041.
            </button>

            {/* TMD LOGO */}
            <div className="hidden items-center justify-center rounded-full bg-white px-3 py-2 shadow-sm sm:flex">
              {!logoError ? (
                <img
                  src="/tmd-logo.svg"
                  alt="Logo Trans Metro Dewata"
                  className="h-[19px] w-[105px] object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <BusFront
                    size={16}
                    className="text-[#B91C1C]"
                  />

                  <span className="text-xs font-black text-[#B91C1C]">
                    TMD
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-4 xl:flex 2xl:gap-6">
            {primaryLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                aria-current={
                  activePage === link.id ? "page" : undefined
                }
                className={`
                  whitespace-nowrap text-[13px]
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:opacity-100
                  ${
                    activePage === link.id
                      ? "font-bold opacity-100"
                      : "font-medium opacity-85"
                  }
                `}
              >
                {link.label}
              </button>
            ))}

            {groups.map((group) => (
              <div key={group.id} className="relative">
                <button
                  onClick={() =>
                    setDesktopGroup(
                      desktopGroup === group.id
                        ? null
                        : group.id
                    )
                  }
                  aria-expanded={desktopGroup === group.id}
                  className={`
                    flex items-center gap-1
                    whitespace-nowrap text-[13px]
                    ${
                      isGroupActive(group.links)
                        ? "font-bold"
                        : "font-medium"
                    }
                  `}
                >
                  {group.label}

                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                      desktopGroup === group.id
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {desktopGroup === group.id && (
                  <div className="absolute right-0 top-full z-30 mt-6 min-w-[200px] rounded-2xl border border-slate-100 bg-white p-2 text-slate-800 shadow-xl">
                    {group.links.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => go(link.id)}
                        className="block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-red-50 hover:text-[#B91C1C]"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={
              mobileOpen ? "Tutup menu" : "Buka menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 xl:hidden"
          >
            {mobileOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>

        {/* MOBILE DROPDOWN */}
        <div
          id="mobile-menu"
          aria-hidden={!mobileOpen}
          className={`
            absolute left-0 right-0 top-full z-30 mt-2
            grid overflow-hidden rounded-2xl
            bg-[#B91C1C] shadow-xl
            transition-all duration-300 xl:hidden
            ${
              mobileOpen
                ? "visible grid-rows-[1fr] opacity-100"
                : "invisible grid-rows-[0fr] opacity-0"
            }
          `}
        >
          <div className="min-h-0 overflow-hidden">
            <nav className="max-h-[75vh] space-y-1 overflow-y-auto p-3">

              {primaryLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => go(link.id)}
                  tabIndex={mobileOpen ? 0 : -1}
                  className={`
                    block w-full rounded-xl
                    px-4 py-3 text-left text-sm
                    ${
                      activePage === link.id
                        ? "bg-white/20 font-bold"
                        : "hover:bg-white/10"
                    }
                  `}
                >
                  {link.label}
                </button>
              ))}

              {groups.map((group) => (
                <div key={group.id}>
                  <button
                    onClick={() =>
                      setMobileGroup(
                        mobileGroup === group.id
                          ? null
                          : group.id
                      )
                    }
                    tabIndex={mobileOpen ? 0 : -1}
                    aria-expanded={mobileGroup === group.id}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm hover:bg-white/10"
                  >
                    {group.label}

                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        mobileGroup === group.id
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {mobileGroup === group.id && (
                    <div className="ml-3 border-l border-white/25 pl-3">
                      {group.links.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => go(link.id)}
                          tabIndex={mobileOpen ? 0 : -1}
                          className="block w-full rounded-lg px-4 py-2.5 text-left text-sm hover:bg-white/10"
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
        </div>
      </header>

      {/* HEADER SPACER */}
      <div className="h-[78px]" aria-hidden="true" />
    </>
  );
}
