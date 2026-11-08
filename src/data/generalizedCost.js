function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateGeneralizedCost({
  operatingCost = 0,
  parkingCost = 0,
  tollCost = 0,
  valueOfTime = 0,
  privateTravelTimeMinutes = 0,
  fare = 0,
  feederCost = 0,
  accessTimeMinutes = 0,
  waitingTimeMinutes = 0,
  inVehicleTimeMinutes = 0,
  transferTimeMinutes = 0,
  egressTimeMinutes = 0,
} = {}) {
  const privateTravelTimeHours = toNumber(privateTravelTimeMinutes, 0) / 60;
  const accessHours = toNumber(accessTimeMinutes, 0) / 60;
  const waitingHours = toNumber(waitingTimeMinutes, 0) / 60;
  const inVehicleHours = toNumber(inVehicleTimeMinutes, 0) / 60;
  const transferHours = toNumber(transferTimeMinutes, 0) / 60;
  const egressHours = toNumber(egressTimeMinutes, 0) / 60;

  const privateCost =
    toNumber(operatingCost, 0) +
    toNumber(parkingCost, 0) +
    toNumber(tollCost, 0) +
    toNumber(valueOfTime, 0) * privateTravelTimeHours;

  const transitCost =
    toNumber(fare, 0) +
    toNumber(feederCost, 0) +
    toNumber(valueOfTime, 0) * (
      accessHours +
      waitingHours +
      inVehicleHours +
      transferHours +
      egressHours
    );

  return {
    privateCost,
    transitCost,
    difference: transitCost - privateCost,
    privateTravelTimeHours,
    transitTravelTimeHours:
      accessHours + waitingHours + inVehicleHours + transferHours + egressHours,
    units: "Rp untuk biaya, jam untuk waktu; valueOfTime harus konsisten dengan satuan waktu.",
  };
}

export function compareModeGeneralizedCost(params = {}) {
  const gc = calculateGeneralizedCost(params);

  return {
    ...gc,
    modePreference: gc.difference < 0 ? "private vehicle is cheaper" : "transit is cheaper",
    degreeOfCompetition: Math.abs(gc.difference) / Math.max(Math.abs(gc.privateCost), 1),
  };
}
