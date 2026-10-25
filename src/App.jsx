
import { useEffect, useState } from "react";

// ==========================================
// DEWATAMOVE 2041 — MAIN APPLICATION
// ==========================================

// GLOBAL LAYOUT
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// MAIN PAGES
import Home from "./pages/Home";
import ProblemSolving from "./pages/ProblemSolving";
import DataExplorer from "./pages/DataExplorer";
import Methodology from "./pages/Methodology";

// MODELING STUDIO
import ModelOverview from "./pages/ModelOverview";

// TRANS METRO DEWATA
import Transit from "./pages/Transit";

// ==========================================
// PAGE CONFIGURATION
// ==========================================

const MODELING_PAGES = [
  "before",
  "process",
  "after",
  "comparison",
];

const TRANSIT_PAGES = [
  "transit-operator",
  "transit-driver",
  "transit-passenger",
];

const ALLOWED_PAGES = [
  "home",
  "problems",
  "data",
  "methodology",
  ...MODELING_PAGES,
  ...TRANSIT_PAGES,
];

// ==========================================
// READ PAGE FROM URL
// ==========================================

function readPageFromURL() {
  if (typeof window === "undefined") {
    return "home";
  }

  const hash = window.location.hash;

  const page = hash.replace(/^#\/?/, "");

  // Support previous simulation URL
  if (page === "simulation") {
    return "before";
  }

  if (ALLOWED_PAGES.includes(page)) {
    return page;
  }

  return "home";
}

// ==========================================
// APPLICATION COMPONENT
// ==========================================

export default function App() {
  // CURRENT PAGE
  const [page, setPage] = useState(
    readPageFromURL
  );

  // ========================================
  // TRANSIT CONFIGURATION
  // ========================================

  const [transitConfig, setTransitConfig] =
    useState({
      headway: 15,
      fleet: 6,
      capacity: 40,
      cycleTime: 90,
    });

  // ========================================
  // SYNC URL WITH PAGE
  // ========================================

  useEffect(() => {
    const syncPage = () => {
      setPage(readPageFromURL());
    };

    window.addEventListener(
      "hashchange",
      syncPage
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        syncPage
      );
    };
  }, []);

  // ========================================
  // NAVIGATION FUNCTION
  // ========================================

  const navigate = (target) => {
    const nextPage =
      target === "simulation"
        ? "before"
        : target;

    if (!ALLOWED_PAGES.includes(nextPage)) {
      return;
    }

    // Update current page
    setPage(nextPage);

    // Update URL
    const nextHash = `#/${nextPage}`;

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }

    // Return to top of page
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // PAGE DETECTION
  // ========================================

  const isModeling =
    MODELING_PAGES.includes(page);

  const isTransit =
    TRANSIT_PAGES.includes(page);

  // ========================================
  // RENDER APPLICATION
  // ========================================

  return (
    <div
      className="
        flex
        min-h-screen
        flex-col
        overflow-x-clip
        bg-white
        text-slate-900
      "
    >

      {/* ==================================
          HEADER
          - Original animation remains
          - AnimatedBus remains
          - Tailwind Modeling dropdown
      ================================== */}

      <Header
        activePage={page}
        onNavigate={navigate}
      />

      {/* ==================================
          MAIN CONTENT
      ================================== */}

      <main className="min-w-0 flex-1">

        {/* HOME PAGE */}

        {page === "home" && (
          <Home
            onNavigate={navigate}
          />
        )}

        {/* PROBLEM & TDM SOLUTION */}

        {page === "problems" && (
          <ProblemSolving
            onNavigate={navigate}
          />
        )}

        {/* DATA EXPLORER */}

        {page === "data" && (
          <DataExplorer />
        )}

        {/* METHODOLOGY */}

        {page === "methodology" && (
          <Methodology />
        )}

        {/* ==================================
            MODELING STUDIO

            BEFORE TDM
            PROCESS TDM
            AFTER TDM
            COMPARISON

            All stages share ModelOverview.
            This keeps the modeling system
            consistent during navigation.
        ================================== */}

        {isModeling && (
          <ModelOverview
            type={page}
            onNavigate={navigate}
            transitConfig={transitConfig}
          />
        )}

        {/* ==================================
            TRANS METRO DEWATA

            OPERATOR
            DRIVER / FEEDER
            PASSENGER
        ================================== */}

        {isTransit && (
          <Transit
            role={page}
            onNavigate={navigate}
            config={transitConfig}
            setConfig={setTransitConfig}
          />
        )}

      </main>

      {/* ==================================
          FOOTER
      ================================== */}

      <Footer
        onNavigate={navigate}
      />

    </div>
  );
}
