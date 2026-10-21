
import { ArrowUpRight } from "lucide-react";

const links = [
  { id: "home", label: "Beranda" },
  { id: "simulation", label: "Simulasi" },
  { id: "data", label: "Data Explorer" },
  { id: "methodology", label: "Metodologi" },
];

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-slate-200 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              DENPASAR<span className="text-[#B91C1C]">2041.</span>
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
              Urban Mobility Simulation Laboratory.
              Exploring sustainable transportation
              strategies for the future of Denpasar.
            </p>
          </div>

          <div className="md:justify-self-end">
            <p className="mb-4 text-sm font-semibold text-slate-900">
              Navigasi
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate?.(link.id)}
                  className="flex items-center gap-1 text-left text-sm text-slate-500 transition-colors hover:text-[#B91C1C]"
                >
                  {link.label}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} DENPASAR 2041.
          </span>
          <span>
            ITEC-U • ICEE ITB 2027
          </span>
        </div>
      </div>
    </footer>
  );
}
