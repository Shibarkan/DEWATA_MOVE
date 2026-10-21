
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import SimulationPreview from "./components/home/SimulationPreview";

const pageContent = {
  data: {
    label: "TRANSPORTATION DATA",
    title: "Data Explorer",
    description:
      "Explore the 13-zone Origin–Destination Matrix, travel generation, attraction, and network input data.",
  },
  methodology: {
    label: "RESEARCH FRAMEWORK",
    title: "Methodology",
    description:
      "Explore the mathematical methods, transportation modeling assumptions, and limitations of this research platform.",
  },
};

function InformationPage({ page, onNavigate }) {
  const content = pageContent[page];

  return (
    <section className="mx-auto min-h-[65vh] max-w-7xl px-5 py-20 sm:px-8 sm:py-28">

      <p className="mb-4 text-xs font-bold tracking-[0.2em] text-[#B91C1C]">
        {content.label}
      </p>

      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
        {content.title}
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500">
        {content.description}
      </p>

      <div className="mt-12 rounded-3xl border border-slate-200 bg-[#FAFAFA] p-8 sm:p-12">
        <p className="text-sm font-semibold text-[#B91C1C]">
          Module in Development
        </p>

        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
          Modul ini akan diintegrasikan dengan data penelitian
          dan komponen pemodelan transportasi pada tahap berikutnya.
        </p>
      </div>

      <button
        onClick={() => onNavigate("home")}
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#B91C1C] hover:underline"
      >
        <ArrowLeft size={16} />
        Kembali ke Beranda
      </button>
    </section>
  );
}

export default function App() {
  const [page, setPage] = useState("home");

  const navigate = (id) => {
    setPage(id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header
        activePage={page}
        onNavigate={navigate}
      />

      <main className="flex-1">
        {page === "home" && (
          <Home onNavigate={navigate} />
        )}

        {page === "simulation" && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#B91C1C]">
                SIMULATION LABORATORY
              </p>

              <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-5xl">
                Explore Urban Mobility.
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                Demonstrasi visual jaringan. Mesin simulasi
                matematis dan peta geografis akan
                diintegrasikan pada tahap berikutnya.
              </p>
            </div>

            <SimulationPreview />
          </section>
        )}

        {(page === "data" || page === "methodology") && (
          <InformationPage
            page={page}
            onNavigate={navigate}
          />
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}
