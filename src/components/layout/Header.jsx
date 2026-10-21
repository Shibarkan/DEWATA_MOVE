
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { id: "home", label: "Beranda" },
  { id: "simulation", label: "Simulasi" },
  { id: "data", label: "Data Explorer" },
  { id: "methodology", label: "Metodologi" },
];

export default function Header({
  activePage = "home",
  onNavigate,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 45);

    update();
    window.addEventListener("scroll", update, { passive: true });

    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () =>
      window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const navigate = (id) => {
    setOpen(false);
    onNavigate?.(id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
              ? "top-3 w-[calc(100%-24px)] max-w-[1050px] rounded-full shadow-[0_15px_45px_rgba(0,0,0,0.16)] sm:top-5"
              : "top-0 w-full max-w-none rounded-none shadow-none"
          }
        `}
      >
        <div
          className={`
            mx-auto flex items-center justify-between
            transition-all duration-500
            ${
              scrolled
                ? "h-[62px] px-5 sm:px-8"
                : "h-[76px] px-5 sm:px-8 lg:px-12"
            }
          `}
        >
          {/* LOGO */}
          <button
            onClick={() => navigate("home")}
            className="shrink-0 text-left text-lg font-extrabold tracking-tight sm:text-2xl"
          >
            DENPASAR<span className="font-black">2041.</span>
          </button>

          {/* DESKTOP MENU */}
          <nav className="hidden items-center gap-7 md:flex lg:gap-10">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(link.id)}
                aria-current={
                  activePage === link.id ? "page" : undefined
                }
                className={`
                  relative py-2 text-sm
                  transition-all duration-300
                  hover:-translate-y-0.5
                  ${
                    activePage === link.id
                      ? "font-semibold opacity-100"
                      : "font-medium opacity-80 hover:opacity-100"
                  }
                `}
              >
                {link.label}

                <span
                  className={`
                    absolute bottom-0 left-0 h-[2px]
                    rounded-full bg-white
                    transition-all duration-300
                    ${
                      activePage === link.id
                        ? "w-full"
                        : "w-0"
                    }
                  `}
                />
              </button>
            ))}
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 md:hidden"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE DROPDOWN */}
        <div
          id="mobile-navigation"
          className={`
            absolute left-0 right-0 top-full mt-2
            grid overflow-hidden rounded-2xl
            bg-[#B91C1C]
            shadow-xl transition-all duration-300 md:hidden
            ${
              open
                ? "visible grid-rows-[1fr] translate-y-0 opacity-100"
                : "invisible grid-rows-[0fr] -translate-y-2 opacity-0"
            }
          `}
        >
          <div className="min-h-0 overflow-hidden">
            <nav className="flex flex-col p-3">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => navigate(link.id)}
                  tabIndex={open ? 0 : -1}
                  className={`
                    rounded-xl px-4 py-3 text-left text-sm
                    transition-colors duration-200
                    ${
                      activePage === link.id
                        ? "bg-white/20 font-semibold"
                        : "hover:bg-white/10"
                    }
                  `}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="h-[76px]" aria-hidden="true" />
    </>
  );
}
