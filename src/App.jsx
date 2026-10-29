
import { lazy, Suspense, useCallback, useEffect, useState } from "react";

// DEWATAMOVE 2041 — MAIN APPLICATION

// GLOBAL LAYOUT
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import IntroLoading from "./components/modeling/studio/IntroLoading";

// MAIN PAGES
import Home from "./pages/Home";
const ProblemSolving = lazy(() => import("./pages/ProblemSolving"));
const DataExplorer = lazy(() => import("./pages/DataExplorer"));
const Methodology = lazy(() => import("./pages/Methodology"));
const ModelOverview = lazy(() => import("./pages/ModelOverview"));
const Transit = lazy(() => import("./pages/Transit"));

// PAGE CONFIGURATION

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

// READ PAGE FROM URL

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

// APPLICATION COMPONENT

export default function App() {
  // CURRENT PAGE
  const [page, setPage] = useState(
    readPageFromURL
  );
  const [modelingIntro, setModelingIntro] = useState(
    () => MODELING_PAGES.includes(readPageFromURL()),
  );
  const [modelingReady, setModelingReady] = useState(false);

  const closeModelingIntro = useCallback(
    () => setModelingIntro(false),
    [],
  );
  const markModelingReady = useCallback(
    () => setModelingReady(true),
    [],
  );

  // TRANSIT CONFIGURATION

  const [transitConfig, setTransitConfig] =
    useState({
      headway: 15,
      fleet: 6,
      capacity: 40,
      cycleTime: 90,
    });

  // SYNC URL WITH PAGE

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

  // NAVIGATION FUNCTION

  const navigate = (target) => {
    const nextPage =
      target === "simulation"
        ? "before"
        : target;

    if (!ALLOWED_PAGES.includes(nextPage)) {
      return;
    }

    const enteringModeling =
      !MODELING_PAGES.includes(page) &&
      MODELING_PAGES.includes(nextPage);

    if (enteringModeling) {
      setModelingReady(false);
      setModelingIntro(true);
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

  // PAGE DETECTION

  const isModeling =
    MODELING_PAGES.includes(page);

  const isTransit =
    TRANSIT_PAGES.includes(page);

  // RENDER APPLICATION

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

      <Header
        activePage={page}
        onNavigate={navigate}
      />

      <main className="min-w-0 flex-1">
        <Suspense
          fallback={
            <div className="px-5 py-16 text-center text-sm text-slate-600" role="status">
              Memuat halaman...
            </div>
          }
        >
          {page === "home" && <Home onNavigate={navigate} />}
          {page === "problems" && <ProblemSolving onNavigate={navigate} />}
          {page === "data" && <DataExplorer />}
          {page === "methodology" && <Methodology />}
          {isModeling && (
            <ModelOverview
              type={page}
              onNavigate={navigate}
              onReady={markModelingReady}
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
        </Suspense>
      </main>

      <Footer
        onNavigate={navigate}
      />

      {modelingIntro && (
        <IntroLoading
          onComplete={closeModelingIntro}
          ready={modelingReady}
        />
      )}

    </div>
  );
}
