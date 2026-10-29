import {
  useCallback, useDeferredValue, useEffect, useMemo, useRef, useState,
} from "react";
import { AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { getDenpasarNetwork } from "../data/denpasarNetworkModeling";
import { POLICY_SCENARIOS, createPolicyModel, normalizePolicy } from "../data/policyEngine";
import { assignTraffic } from "../data/trafficAssignment";
import {
  STAGES, STORAGE_KEY, APPLIED_RUN_KEY, INITIAL_VIEW,
  initialPolicy, readCompletedRun, wait, waitPaint,
} from "../components/modeling/studio/helpers";
import IntroLoading from "../components/modeling/studio/IntroLoading";
import { Headline, Tabs } from "../components/modeling/studio/Navigation";
import ProcessingModal from "../components/modeling/studio/ProcessingModal";
import EmptyResults from "../components/modeling/studio/EmptyResults";
import ComparisonStage from "../components/modeling/studio/ComparisonStage";
import ProcessStage from "../components/modeling/studio/ProcessStage";
import SingleMapStage from "../components/modeling/studio/SingleMapStage";
import Explanation from "../components/modeling/studio/Explanation";
import MethodLimits from "../components/modeling/studio/MethodLimits";

export default function ModelOverview({
  type = "before",
  onNavigate,
}) {
  const stage =
    STAGES.some((x) => x.id === type)
      ? type
      : "before";

  const [intro, setIntro] = useState(true);

  const closeIntro = useCallback(
    () => setIntro(false),
    []
  );

  const [runInfo, setRunInfo] = useState(
    readCompletedRun
  );

  const ready = Boolean(runInfo?.completed);

  const [applied, setApplied] = useState(
    () =>
      readCompletedRun()?.policy ||
      normalizePolicy(POLICY_SCENARIOS.integrated)
  );

  const [draft, setDraft] = useState(
    () =>
      readCompletedRun()?.policy ||
      initialPolicy()
  );

  const [runPhase, setRunPhase] = useState(null);
  const runningRef = useRef(false);

  const deferredDraft = useDeferredValue(draft);

  const [selectedZone, setSelectedZone] = useState("Z11");

  const [view, setView] = useState({
    ...INITIAL_VIEW,
  });

  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(false);

  // NOTIFICATION

  useEffect(() => {
    if (intro) return;

    if (
      (stage === "after" || stage === "comparison") &&
      !ready
    ) {
      toast.warning("Kebijakan belum diterapkan", {
        id: "dm-no-scenario",
        duration: 4500,
        description:
          "Atur kebijakan di halaman Proses terlebih dahulu.",
        action: {
          label: "Atur kebijakan",
          onClick: () => onNavigate?.("process"),
        },
        actionButtonStyle: {
          backgroundColor: "#B91C1C",
          color: "#FFFFFF",
        },
      });
    } else {
      toast.dismiss("dm-no-scenario");
    }
  }, [stage, intro, ready, onNavigate]);

  // SYNCHRONIZE TWO MAPS

  const updateView = useCallback((next) => {
    setView((prev) =>
      Math.abs(prev.lat - next.lat) < 0.000008 &&
      Math.abs(prev.lng - next.lng) < 0.000008 &&
      Math.abs(prev.zoom - next.zoom) < 0.05
        ? prev
        : next
    );
  }, []);

  // MODEL AND POLICY

  const updateDraft = (key, value) => {
    setDraft((prev) =>
      normalizePolicy({
        ...prev,
        [key]: value,
      })
    );
  };

  const model = useMemo(
    () => createPolicyModel(applied),
    [applied]
  );

  const previewModel = useMemo(
    () => createPolicyModel(deferredDraft),
    [deferredDraft]
  );

  const assignment = useMemo(
    () =>
      graph
        ? assignTraffic(graph, model)
        : null,
    [graph, model]
  );

  const previewAssignment = useMemo(
    () =>
      graph
        ? assignTraffic(graph, previewModel)
        : null,
    [graph, previewModel]
  );

  // LOAD MODELING ROAD NETWORK

  useEffect(() => {
    let canceled = false;

    getDenpasarNetwork()
      .then((data) => {
        if (canceled) return;

        setGraph(data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (canceled) return;

        setError(
          err?.message ||
            "Jaringan jalan tidak bisa dimuat"
        );

        setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  // APPLY TDM SCENARIO

  async function apply() {
    if (runningRef.current) return;

    runningRef.current = true;
    toast.dismiss("dm-no-scenario");
    setRunPhase(0);

    const next = normalizePolicy(draft);

    try {
      await waitPaint();
      await wait(490);

      setRunPhase(1);
      await waitPaint();

      const computed = createPolicyModel(next);

      await wait(520);

      setRunPhase(2);
      await waitPaint();

      let assigned = false;

      if (graph) {
        const traffic = assignTraffic(graph, computed);
        assigned = Boolean(
          traffic && traffic.coverage > 0
        );
      }

      await wait(550);

      setRunPhase(3);
      await waitPaint();

      const sum = (matrix) =>
        matrix.reduce(
          (a, row) =>
            a +
            row.reduce(
              (b, x) => b + x,
              0
            ),
          0
        );

      const deltaBefore = Math.abs(
        sum(computed.matrixBefore) -
          computed.beforeTotal
      );

      const deltaAfter = Math.abs(
        sum(computed.matrixAfter) -
          computed.afterTotal
      );

      if (
        !Number.isFinite(computed.beforeTotal) ||
        !Number.isFinite(computed.afterTotal) ||
        computed.beforeTotal <= 0 ||
        computed.afterTotal < 0 ||
        deltaBefore > 0.01 ||
        deltaAfter > 0.01
      ) {
        throw new Error(
          "Validasi hasil model tidak berhasil. Periksa data MAT dan parameter."
        );
      }

      await wait(520);

      const completed = {
        completed: true,
        policy: next,
        savedAt: new Date().toISOString(),
        networkAssigned: assigned,
      };

      try {
        window.sessionStorage.setItem(
          APPLIED_RUN_KEY,
          JSON.stringify(completed)
        );

        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // sessionStorage optional.
      }

      setApplied(next);
      setRunInfo(completed);
      setRunPhase(null);

      onNavigate?.("after");

      toast.success(
        "Skenario berhasil diterapkan",
        {
          id: "dm-applied-success",
          description:
            "Hasil Sesudah telah tersedia.",
          duration: 6500,
          action: {
            label: "Lihat perbandingan",
            onClick: () =>
              onNavigate?.("comparison"),
          },
          actionButtonStyle: {
            backgroundColor: "#B91C1C",
            color: "#FFFFFF",
          },
        }
      );
    } catch (cause) {
      setRunPhase(null);

      toast.error(
        "Skenario gagal diterapkan",
        {
          description:
            cause?.message ||
            "Perhitungan gagal. Silakan coba lagi.",
          duration: 6500,
        }
      );
    } finally {
      runningRef.current = false;
    }
  }

  // RENDER

  return (
    <>
      <Toaster
        theme="light"
        position="top-right"
        closeButton
        richColors={false}
        visibleToasts={2}
        offset={{ top: "94px", right: "16px" }}
        mobileOffset={{ top: "80px", right: "12px", left: "12px" }}
        toastOptions={{
          className:
            "!rounded-2xl !border !border-slate-200 !bg-white !text-slate-900 !shadow-[0_18px_45px_rgba(15,23,42,.12)]",
        }}
      />
      <AnimatePresence>
        {intro && <IntroLoading key="dm-intro" onComplete={closeIntro} />}
      </AnimatePresence>
      <AnimatePresence>
        {runPhase !== null && (
          <ProcessingModal
            key="dm-process"
            phase={runPhase}
            graphAvailable={Boolean(graph)}
          />
        )}
      </AnimatePresence>
      <main className="min-h-screen bg-white text-slate-900">
        <Headline stage={stage} />
        <Tabs stage={stage} onNavigate={onNavigate} />
        <div className="mx-auto max-w-[1460px] px-4 pb-20 pt-9 sm:px-7 sm:pt-12 lg:px-10">
          {(stage === "after" || stage === "comparison") && !ready ? (
            <EmptyResults stage={stage} onNavigate={onNavigate} />
          ) : (
            <>
              {stage === "comparison" && (
                <ComparisonStage
                  model={model}
                  assignment={assignment}
                  onNavigate={onNavigate}
                />
              )}
              {stage === "process" && (
                <ProcessStage
                  draft={draft}
                  setDraft={setDraft}
                  updateDraft={updateDraft}
                  apply={apply}
                  runPhase={runPhase}
                  previewModel={previewModel}
                  previewAssignment={previewAssignment}
                  graph={graph}
                  selectedZone={selectedZone}
                  setSelectedZone={setSelectedZone}
                  view={view}
                  updateView={updateView}
                  loading={loading}
                  error={error}
                />
              )}
              {(stage === "before" || stage === "after") && (
                <SingleMapStage
                  stage={stage}
                  model={model}
                  assignment={assignment}
                  graph={graph}
                  selectedZone={selectedZone}
                  setSelectedZone={setSelectedZone}
                  view={view}
                  updateView={updateView}
                  onNavigate={onNavigate}
                  loading={loading}
                  error={error}
                />
              )}
              <Explanation stage={stage} />
              <MethodLimits
                details={details}
                setDetails={setDetails}
                assignment={assignment}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
