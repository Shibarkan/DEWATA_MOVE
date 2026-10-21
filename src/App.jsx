
import { useEffect, useState } from "react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import ProblemSolving from "./pages/ProblemSolving";
import DataExplorer from "./pages/DataExplorer";
import Methodology from "./pages/Methodology";
import ModelOverview from "./pages/ModelOverview";
import Transit from "./pages/Transit";

const allowedPages = [
  "home",
  "problems",
  "data",
  "methodology",
  "before",
  "after",
  "comparison",
  "transit-operator",
  "transit-driver",
  "transit-passenger",
];

function readPageFromURL() {
  if (typeof window === "undefined") return "home";

  const page = window.location.hash.replace(/^#\/?/, "");

  if (page === "simulation") return "before";

  return allowedPages.includes(page) ? page : "home";
}

export default function App() {
  const [page, setPage] = useState(readPageFromURL);

  // Demonstration operational inputs
  const [transitConfig, setTransitConfig] = useState({
    headway: 15,
    fleet: 6,
    capacity: 40,
    cycleTime: 90,
  });

  // Support browser back and forward
  useEffect(() => {
    const syncPage = () => {
      setPage(readPageFromURL());
    };

    window.addEventListener("hashchange", syncPage);

    return () =>
      window.removeEventListener("hashchange", syncPage);
  }, []);

  const navigate = (target) => {
    const nextPage =
      target === "simulation" ? "before" : target;

    if (!allowedPages.includes(nextPage)) return;

    setPage(nextPage);

    window.location.hash = `/${nextPage}`;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isTransit = page.startsWith("transit-");

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">

      <Header
        activePage={page}
        onNavigate={navigate}
      />

      <main className="min-w-0 flex-1">
        {page === "home" && (
          <Home onNavigate={navigate} />
        )}

        {page === "problems" && (
          <ProblemSolving onNavigate={navigate} />
        )}

        {page === "data" && (
          <DataExplorer />
        )}

        {page === "methodology" && (
          <Methodology />
        )}

        {page === "before" && (
          <ModelOverview
            type="before"
            onNavigate={navigate}
            transitConfig={transitConfig}
          />
        )}

        {page === "after" && (
          <ModelOverview
            type="after"
            onNavigate={navigate}
            transitConfig={transitConfig}
          />
        )}

        {page === "comparison" && (
          <ModelOverview
            type="comparison"
            onNavigate={navigate}
            transitConfig={transitConfig}
          />
        )}

        {isTransit && (
          <Transit
            role={page}
            onNavigate={navigate}
            config={transitConfig}
            setConfig={setTransitConfig}
          />
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}
