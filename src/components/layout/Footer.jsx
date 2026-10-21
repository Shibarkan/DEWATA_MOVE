
import { ArrowUpRight, MapPin } from "lucide-react";

const links = [
  ["Beranda", "home"],
  ["Penyelesaian Masalah", "problems"],
  ["Data Explorer", "data"],
  ["Metodologi", "methodology"],
  ["Before TDM", "before"],
  ["After TDM", "after"],
  ["Model Comparison", "comparison"],
  ["Transit Operations", "transit-operator"],
];

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-slate-200 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">

          <div className="lg:col-span-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              DENPASAR<span className="text-[#B91C1C]">2041.</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
              An integrated urban mobility simulation
              and transportation demand management
              research platform.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs text-slate-600">
              <MapPin size={14} className="text-[#B91C1C]" />
              Denpasar, Bali, Indonesia
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold text-slate-900">
              Explore Platform
            </h3>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {links.map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className="flex items-center gap-1 text-left text-xs text-slate-500 transition-colors hover:text-[#B91C1C]"
                >
                  {label}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold text-slate-900">
              Research Information
            </h3>

            <p className="text-sm leading-7 text-slate-500">
              Innovative Transportation Engineering
              Competition — ICEE ITB 2027.
            </p>

            <p className="mt-4 text-xs leading-6 text-slate-400">
              Data observasi, asumsi, dan hasil simulasi
              dibedakan secara eksplisit.
              Platform ini merupakan proyek penelitian,
              bukan sistem operasional resmi TMD.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-slate-200 pt-7 text-xs text-slate-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} DENPASAR 2041.
          </span>
          <span>
            Built for Sustainable Urban Mobility
          </span>
        </div>
      </div>
    </footer>
  );
}
