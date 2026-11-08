export const CONSTRAINT_DIMENSIONS = Object.freeze([
  "time",
  "cost",
  "spatial",
]);

export function classifyPolicyConstraints(policy = {}) {
  const constraints = Array.isArray(policy.constraints)
    ? policy.constraints.filter((dimension) => CONSTRAINT_DIMENSIONS.includes(dimension))
    : [];

  const requiredInputs = Array.isArray(policy.requiredInputs)
    ? policy.requiredInputs
    : [];

  const availableInputs = policy.inputData && typeof policy.inputData === "object"
    ? Object.keys(policy.inputData)
    : [];

  const missingInputs = requiredInputs.filter(
    (field) => !(field in policy.inputData) || policy.inputData[field] === null || policy.inputData[field] === undefined,
  );

  let status = "not applicable";
  let reason = "Tidak ada dimensi constraint yang aktif pada kebijakan ini.";

  if (constraints.length > 0) {
    if (missingInputs.length > 0) {
      status = "unknown due to missing data";
      reason = `Data yang dibutuhkan belum tersedia: ${missingInputs.join(", ")}.`;
    } else {
      status = "feasible";
      reason = "Semua data yang dibutuhkan tersedia dan dapat dipakai untuk evaluasi.";
    }
  }

  if (policy.modelStatus === "infeasible") {
    status = "infeasible";
    reason = policy.reason || "Kebijakan tidak layak untuk lokasi atau kondisi yang ditetapkan.";
  }

  if (
    policy.modelStatus === "assumption-dependent" &&
    missingInputs.length > 0
  ) {
    status = "unknown due to missing data";
  }

  return {
    constraints,
    requiredInputs,
    missingInputs,
    availableInputs,
    status,
    reason,
    dimensions: constraints,
    modelStatus: policy.modelStatus || "assumption-dependent",
  };
}

export function evaluatePolicyFeasibility(policy = {}) {
  return classifyPolicyConstraints(policy);
}

export const classifyConstraints = classifyPolicyConstraints;
