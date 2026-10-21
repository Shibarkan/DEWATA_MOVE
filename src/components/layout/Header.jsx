
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

const primaryLinks = [
  { id: "home", label: "Beranda" },
  { id: "problems", label: "Solusi TDM" },
  { id: "data", label: "Data" },
  { id: "methodology", label: "Metodologi" },
];

const modelLinks = [
  { id: "before", label: "Before TDM" },
  { id: "after", label: "After TDM" },
  { id: "comparison", label: "Perbandingan" },
];

const transitLinks = [
  { id: "transit-operator", label: "Operator" },
  { id: "transit-driver", label: "Driver / Feeder" },
  { id: "transit-passenger", label: "Penumpang" },
];

export default function Header({ activePage, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState(null);
  const modelingRef = useRef(null);
  const transitRef = useRef(null);

  useEffect(() => {
    const updateScroll = () =>
      setScrolled(window.scrollY > 45);

    updateScroll();
    window.addEventListener("scroll", updateScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        modelingRef.current?.removeAttribute("open");
        transitRef.current?.removeAttribute("open");
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () =>
      window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const go = (id) => {
    setMobileOpen(false);
    setMobileGroup(null);
    modelingRef.current?.removeAttribute("open");
    transitRef.current?.removeAttribute("open");
    onNavigate(id);
  };

  const activeGroup = (links) =>
    links.some((link) => link.id === activePage);

  return (
    <>
      <header
        className={`
          fixed left-1/2 z-50 -translate-x-1/2
          bg-[#B91C1C] text-white
          transition-all duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            scrolled
              ? "top-3 w-[calc(100%-24px)] max-w-[1140px] rounded-full shadow-[0_15px_45px_rgba(0,0,0,0.17)] sm:top-5"
              : "top-0 w-full rounded-none"
          }
        `}
      >
        <div
          className={`
            mx-auto flex items-center justify-between
            gap-5 transition-all duration-500
            ${
              scrolled
                ? "h-[62px] px-5 sm:px-8"
                : "h-[76px] px-5 sm:px-8 lg:px-12"
            }
          `}
        >
          <button
            onClick={() => go("home")}
            className="shrink-0 text-left text-lg font-black tracking-tight sm:text-[22px]"
          >
            DENPASAR2041.
          </button>

          {/* DESKTOP */}
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
            {primaryLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                aria-current={
                  activePage === link.id ? "page" : undefined
                }
                className={`text-[13px] transition-opacity hover:opacity-100 ${
                  activePage === link.id
                    ? "font-bold opacity-100"
                    : "font-medium opacity-80"
                }`}
              >
                {link.label}
              </button>
            ))}

            <details ref={modelingRef} className="group relative">
              <summary
                className={`flex cursor-pointer list-none items-center gap-1 text-[13px] ${
                  activeGroup(modelLinks)
                    ? "font-bold"
                    : "font-medium"
                }`}
              >
                Modeling
                <ChevronDown
                  size={14}
                  className="transition-transform group-open:rotate-180"
                />
              </summary>

              <div className="absolute right-0 top-full mt-5 w-52 rounded-2xl border border-slate-100 bg-white p-2 text-slate-800 shadow-xl">
                {modelLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => go(link.id)}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-red-50 hover:text-[#B91C1C]"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </details>

            <details ref={transitRef} className="group relative">
              <summary
                className={`flex cursor-pointer list-none items-center gap-1 text-[13px] ${
                  activeGroup(transitLinks)
                    ? "font-bold"
                    : "font-medium"
                }`}
              >
                Transit App
                <ChevronDown
                  size={14}
                  className="transition-transform group-open:rotate-180"
                />
              </summary>

              <div className="absolute right-0 top-full mt-5 w-52 rounded-2xl border border-slate-100 bg-white p-2 text-slate-800 shadow-xl">
                {transitLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => go(link.id)}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-red-50 hover:text-[#B91C1C]"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </details>
          </nav>

          {/* MOBILE MENU */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 lg:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div
          id="mobile-menu"
          className={`absolute left-0 right-0 top-full mt-2 grid overflow-hidden rounded-2xl bg-[#B91C1C] shadow-xl transition-all duration-300 lg:hidden ${
            mobileOpen
              ? "visible grid-rows-[1fr] opacity-100"
              : "invisible grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <nav className="max-h-[75vh] space-y-1 overflow-y-auto p-3">
              {primaryLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => go(link.id)}
                  tabIndex={mobileOpen ? 0 : -1}
                  className={`block w-full rounded-xl px-4 py-3 text-left text-sm ${
                    activePage === link.id
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {[
                { name: "Modeling", links: modelLinks },
                { name: "Transit App", links: transitLinks },
              ].map((group) => (
                <div key={group.name}>
                  <button
                    onClick={() =>
                      setMobileGroup(
                        mobileGroup === group.name
                          ? null
                          : group.name
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm hover:bg-white/10"
                  >
                    {group.name}
                    <ChevronDown size={16} />
                  </button>

                  {mobileGroup === group.name && (
                    <div className="ml-3 border-l border-white/25 pl-3">
                      {group.links.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => go(link.id)}
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

      <div className="h-[76px]" aria-hidden="true" />
    </>
  );
}
