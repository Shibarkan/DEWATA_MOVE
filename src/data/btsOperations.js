function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateFleetRequirement({
  cycleTimeMinutes = 0,
  targetHeadwayMinutes = 0,
  reserveFactor = 1,
} = {}) {
  const cycleTime = toNumber(cycleTimeMinutes, 0);
  const headway = toNumber(targetHeadwayMinutes, 0);
  const factor = toNumber(reserveFactor, 1);

  if (cycleTime <= 0 || headway <= 0) {
    return {
      requiredFleet: 0,
      cycleTimeMinutes: cycleTime,
      targetHeadwayMinutes: headway,
      reserveFactor: factor,
      status: "invalid",
    };
  }

  return {
    requiredFleet: Math.ceil(cycleTime / headway) * factor,
    cycleTimeMinutes: cycleTime,
    targetHeadwayMinutes: headway,
    reserveFactor: factor,
    status: "calculated",
  };
}

export function calculateBtsCost({
  totalOperatedKilometers = 0,
  contractRatePerKm = 0,
} = {}) {
  const operatedKm = toNumber(totalOperatedKilometers, 0);
  const rate = toNumber(contractRatePerKm, 0);
  return {
    totalOperatedKilometers: operatedKm,
    contractRatePerKm: rate,
    totalCost: operatedKm * rate,
    status: rate > 0 ? "calculated" : "missing contract rate",
  };
}
