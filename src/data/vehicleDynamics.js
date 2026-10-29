const MAX_DECELERATION = 6;
const EXPONENT = 4;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function updateIdm(vehicle, targetSpeed, leaderSpeed, gap, dt) {
  const speed = Math.max(0, vehicle.speed || 0);
  const desiredSpeed = Math.max(0.5, targetSpeed);
  const acceleration = vehicle.maxAcceleration || 1.2;
  const comfortableDeceleration = vehicle.comfortableDeceleration || 2;
  const minimumGap = vehicle.minGap || 2;
  const timeHeadway = vehicle.timeHeadway || 1.5;
  const safeGap = Math.max(0.1, gap);
  const closingSpeed = speed - Math.max(0, leaderSpeed ?? speed);
  const desiredGap = Math.max(
    minimumGap,
    minimumGap +
      speed * timeHeadway +
      (speed * closingSpeed) /
        (2 * Math.sqrt(acceleration * comfortableDeceleration)),
  );
  const freeRoadTerm = 1 - (speed / desiredSpeed) ** EXPONENT;
  const interactionTerm = (desiredGap / safeGap) ** 2;
  const rate = clamp(
    acceleration * (freeRoadTerm - interactionTerm),
    -MAX_DECELERATION,
    acceleration,
  );
  const nextSpeed = clamp(speed + rate * dt, 0, desiredSpeed);

  return {
    speed: nextSpeed,
    distance: ((speed + nextSpeed) / 2) * dt,
  };
}