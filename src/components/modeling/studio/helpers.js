
import {
  POLICY_SCENARIOS,
  normalizePolicy,
} from "../../../data/policyEngine";

export const STAGES = [
  { id: "before", label: "Sebelum", title: "SEBELUM" },
  { id: "process", label: "Proses", title: "PROSES" },
  { id: "after", label: "Sesudah", title: "SESUDAH" },
  {
    id: "comparison",
    label: "Perbandingan",
    title: "PERBANDINGAN",
  },
];

export const STORAGE_KEY = "dewata-2041-policy-v2";
export const APPLIED_RUN_KEY = "dewata-2041-applied-run-v3";

export const INITIAL_VIEW = {
  lat: -8.667,
  lng: 115.218,
  zoom: 12,
};

// FORMATTING

export const format = (n, digits = 0) =>
  Number(n || 0).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const sign = (n, digits = 0) => {
  const v = Number(n) || 0;

  return `${
    v > 0 ? "+" : v < 0 ? "−" : ""
  }${format(Math.abs(v), digits)}`;
};

export const percent = (before, after) =>
  before > 0
    ? ((after - before) / before) * 100
    : null;

export const pctLabel = (before, after) => {
  const p = percent(before, after);

  return p === null
    ? after > 0
      ? "BARU"
      : "0,0%"
    : `${sign(p, 1)}%`;
};

export const zoneCode = (i) =>
  `Z${String(i + 1).padStart(2, "0")}`;

// INITIAL POLICY

export function initialPolicy() {
  try {
    const saved =
      typeof window !== "undefined"
        ? JSON.parse(
            window.sessionStorage.getItem(STORAGE_KEY) ||
              "null"
          )
        : null;

    return normalizePolicy(
      saved || POLICY_SCENARIOS.integrated
    );
  } catch {
    return normalizePolicy(
      POLICY_SCENARIOS.integrated
    );
  }
}

// COMPLETED MODELING RUN

export function readCompletedRun() {
  try {
    if (typeof window === "undefined") return null;

    const result = JSON.parse(
      window.sessionStorage.getItem(APPLIED_RUN_KEY) ||
        "null"
    );

    if (result?.completed === true && result.policy) {
      return {
        completed: true,
        policy: normalizePolicy(result.policy),
        savedAt: result.savedAt || null,
        networkAssigned: Boolean(result.networkAssigned),
      };
    }
  } catch {
    // Optional session storage.
  }

  return null;
}

// ANIMATION HELPERS

export const wait = (ms) =>
  new Promise((resolve) =>
    window.setTimeout(resolve, ms)
  );

export const waitPaint = () =>
  new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve())
  );
