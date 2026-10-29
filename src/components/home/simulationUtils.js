export const formatNumber = (value) =>
  Math.round(value || 0).toLocaleString("id-ID");

export function getZoneMatInsights(graph) {
  if (
    !graph ||
    !Array.isArray(graph.mat) ||
    !Array.isArray(graph.zones)
  ) {
    return null;
  }

  const matrix = graph.mat;

  const zones = graph.zones.map((zone, fallbackIndex) => {
    const parsedIndex =
      Number(String(zone.id).replace(/[^0-9]/g, "")) - 1;

    const index =
      Number.isInteger(parsedIndex) &&
      parsedIndex >= 0 &&
      parsedIndex < matrix.length
        ? parsedIndex
        : fallbackIndex;

    const out = (matrix[index] || []).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );

    const incoming = matrix.reduce(
      (sum, row) => sum + (Number(row?.[index]) || 0),
      0
    );

    const internal = Number(matrix[index]?.[index]) || 0;

    return {
      ...zone,
      index,
      out,
      incoming,
      internal,
      activity: out + incoming - internal,
    };
  });

  const byOrigin = [...zones].sort((a, b) => b.out - a.out);

  const byDestination = [...zones].sort(
    (a, b) => b.incoming - a.incoming
  );

  const byActivity = [...zones].sort(
    (a, b) => b.activity - a.activity
  );

  const zoneByIndex = new Map(
    zones.map((zone) => [zone.index, zone])
  );

  const odPairs = [];

  matrix.forEach((row, i) => {
    if (!Array.isArray(row)) return;

    row.forEach((raw, j) => {
      const value = Number(raw) || 0;

      if (
        i !== j &&
        value > 0 &&
        zoneByIndex.has(i) &&
        zoneByIndex.has(j)
      ) {
        odPairs.push({
          origin: zoneByIndex.get(i),
          destination: zoneByIndex.get(j),
          value,
        });
      }
    });
  });

  odPairs.sort((a, b) => b.value - a.value);

  const total = matrix.reduce(
    (sum, row) =>
      sum +
      (Array.isArray(row)
        ? row.reduce(
            (acc, value) => acc + (Number(value) || 0),
            0
          )
        : 0),
    0
  );

  return {
    byOrigin,
    byDestination,
    byActivity,
    odPairs,
    total,
  };
}
