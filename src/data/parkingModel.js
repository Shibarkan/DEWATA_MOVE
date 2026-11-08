function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateProgressiveParkingFee({
  parkingDurationHours = 0,
  firstHourRate = 0,
  additionalRate = 0,
  maxDailyRate = Number.POSITIVE_INFINITY,
  vehicleType = "car",
} = {}) {
  const durationHours = toNumber(parkingDurationHours, 0);
  const firstHour = toNumber(firstHourRate, 0);
  const extraRate = toNumber(additionalRate, 0);
  const maxFee = Number.isFinite(Number(maxDailyRate))
    ? Number(maxDailyRate)
    : Number.POSITIVE_INFINITY;

  if (durationHours <= 0 || firstHour <= 0) {
    return {
      total: 0,
      firstHourCharge: 0,
      extraHours: 0,
      additionalCharge: 0,
      maxDailyRate: maxFee,
      effectiveHourlyRate: 0,
      vehicleType,
      status: "not applicable",
    };
  }

  const extraHours = Math.max(durationHours - 1, 0);
  const subtotal = firstHour + extraHours * extraRate;
  const total = subtotal > maxFee ? maxFee : subtotal;

  return {
    total,
    firstHourCharge: firstHour,
    extraHours,
    additionalCharge: extraHours * extraRate,
    maxDailyRate: maxFee,
    effectiveHourlyRate: durationHours > 0 ? total / durationHours : 0,
    vehicleType,
    status: "calculated",
  };
}

export function evaluateParkingImpact({
  beforeCost = 0,
  afterCost = 0,
  parkingDurationHours = 0,
  firstHourRate = 0,
  additionalRate = 0,
  maxDailyRate = Number.POSITIVE_INFINITY,
  vehicleType = "car",
} = {}) {
  const fee = calculateProgressiveParkingFee({
    parkingDurationHours,
    firstHourRate,
    additionalRate,
    maxDailyRate,
    vehicleType,
  });

  const actualAfterCost = afterCost > 0 ? afterCost : fee.total;
  const before = toNumber(beforeCost, 0);
  const after = toNumber(actualAfterCost, 0);
  const delta = after - before;

  return {
    beforeCost: before,
    afterCost: after,
    delta,
    effectiveHourlyRate: fee.effectiveHourlyRate,
    totalParkingCost: fee.total,
    sensitivity: parkingDurationHours > 0 ? delta / parkingDurationHours : 0,
    reason: "Tarif progresif dihitung dari durasi parkir dan tarif tahap awal; bukan tarif umum yang diambil sebagai satu angka nasional.",
    status: fee.status,
  };
}

export const progressiveParking = calculateProgressiveParkingFee;
