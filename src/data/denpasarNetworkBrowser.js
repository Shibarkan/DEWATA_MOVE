
/**
 * DEWATAMOVE 2041
 * OFFLINE ILLUSTRATIVE ROAD NETWORK
 *
 * Tidak menggunakan Overpass API.
 * Tidak menggunakan fetch().
 * Tidak memerlukan JSON tambahan.
 *
 * MAT 2026 berasal dari data ToR panitia.
 * Jaringan jalan dan bobot arus bersifat ilustratif,
 * bukan geometri OSM atau traffic assignment tervalidasi.
 */

// ===========================================
// 13 ZONA DENPASAR
// ===========================================

const ZONES = [
  ["Z01", "Dangin Puri dan Sumerta", -8.6535, 115.235],
  ["Z02", "Dauh Puri dan Pemecutan", -8.6598, 115.203],
  ["Z03", "Ubung dan Peguyangan", -8.625, 115.21],
  ["Z04", "Tonja", -8.64, 115.226],
  ["Z05", "Kesiman", -8.655, 115.257],
  ["Z06", "Sanur Kaja dan Sanur Kauh", -8.694, 115.264],
  ["Z07", "Renon, Panjer, Sesetan, Pedungan, Pemogan", -8.692, 115.219],
  ["Z08", "Padangsambian", -8.669, 115.182],
  ["Z09", "Padangsambian Kaja dan Ubung Kaja", -8.634, 115.187],
  ["Z10", "Peguyangan Kaja dan Peguyangan Kangin", -8.606, 115.229],
  ["Z11", "Penatih dan Penatih Dangin Puri", -8.624, 115.251],
  ["Z12", "Pulau Serangan dan Pelabuhan Benoa", -8.742, 115.244],
  ["Z13", "Bandara Ngurah Rai, Tuban, Kuta", -8.742, 115.181],
].map(([id, name, lat, lng]) => ({
  id,
  name,
  lat,
  lng,
}));

// ===========================================
// MAT 2026 — SMP/JAM
// ===========================================

const MAT = [
  [1014,3349,5676,146,434,573,495,188,1236,396,149,90,414],
  [4368,26719,33564,733,1945,2539,2830,1484,8394,2243,685,513,2887],
  [4682,21225,52500,1110,2585,2704,2430,1348,11296,3482,992,434,2295],
  [842,3262,7810,303,606,553,411,201,1908,796,269,75,360],
  [2004,6890,14480,482,1671,1503,998,398,3205,1273,572,190,818],
  [2546,8656,14576,424,1446,3103,1637,481,3140,1112,536,361,1278],
  [6958,30550,41487,998,3040,5182,6898,1767,9649,2777,1042,1230,5384],
  [1400,8513,12226,259,643,809,940,747,3686,880,234,178,1108],
  [9734,50690,107868,2589,5462,5561,5398,3879,54440,11812,2341,973,5782],
  [2987,12982,31877,1036,2080,1888,1489,888,11324,7097,1137,267,1404],
  [23846,84150,192833,7411,19841,19322,11870,4999,47676,24151,15321,2300,9731],
  [997,4360,5825,143,455,899,969,263,1370,392,159,409,1016],
  [2180,11662,14661,327,933,1514,2015,780,3868,980,320,483,3254],
];

const MAT_TOTAL = MAT
  .flat()
  .reduce((total, value) => total + value, 0);

// ===========================================
// GEOMETRY HELPERS
// ===========================================

const toKm = ([lat, lng]) => [
  lat * 111.2,
  lng * 110.2,
];

function distanceMeters(a, b) {
  return Math.hypot(
    (a[0] - b[0]) * 111200,
    (a[1] - b[1]) * 110200
  );
}

function distanceToLine(point, from, to) {
  const vx = to[0] - from[0];
  const vy = to[1] - from[1];

  const magnitude = vx * vx + vy * vy || 1;

  const t = Math.max(
    0,
    Math.min(
      1,
      (
        (point[0] - from[0]) * vx +
        (point[1] - from[1]) * vy
      ) / magnitude
    )
  );

  return Math.hypot(
    point[0] - from[0] - t * vx,
    point[1] - from[1] - t * vy
  );
}

// ===========================================
// PRIORITAS PERJALANAN BERDASARKAN MAT
// ===========================================

const PRIORITY_OD = [];

for (let i = 0; i < 13; i++) {
  for (let j = 0; j < 13; j++) {
    if (i !== j && MAT[i][j] > 0) {
      PRIORITY_OD.push({
        a: toKm([
          ZONES[i].lat,
          ZONES[i].lng,
        ]),

        b: toKm([
          ZONES[j].lat,
          ZONES[j].lng,
        ]),

        weight: MAT[i][j],
      });
    }
  }
}

PRIORITY_OD.sort((a, b) => b.weight - a.weight);

const TOP_OD = PRIORITY_OD.slice(0, 24);

// ===========================================
// VISUAL TRAFFIC PRESSURE
// ===========================================

function illustrativeFlow(a, b, roadClass) {
  const center = toKm([
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ]);

  let pressure = 0;

  for (const od of TOP_OD) {
    const distance = distanceToLine(
      center,
      od.a,
      od.b
    );

    pressure +=
      Math.sqrt(od.weight / 192833) *
      Math.exp(
        -0.5 * (distance / 1.6) ** 2
      );
  }

  const roadFactor =
    roadClass <= 3
      ? 1.9
      : roadClass === 4
        ? 1.3
        : 0.65;

  return (
    Math.round(
      100 * roadFactor * (0.55 + pressure)
    ) / 100
  );
}

// ===========================================
// APPROXIMATE LAND LIMIT
// ===========================================

function onLand(lat, lng) {
  // Filter kasar agar sebagian jaringan
  // tidak berada jauh di area perairan.
  // BUKAN batas daratan GIS resmi.

  if (
    lat < -8.709 &&
    lng > 115.257
  ) {
    return false;
  }

  if (
    lat < -8.726 &&
    lng > 115.204 &&
    lng < 115.233
  ) {
    return false;
  }

  if (
    lat < -8.733 &&
    lng < 115.172
  ) {
    return false;
  }

  return true;
}

// ===========================================
// BUILD ILLUSTRATIVE ROAD NETWORK
// ===========================================

function buildIllustrativeNetwork() {
  const nodes = [];
  const edges = [];

  const idByCell = new Map();

  const latSteps = 23;
  const lngSteps = 24;

  const cellId = (row, col) =>
    `${row}:${col}`;

  // Membuat titik-titik jaringan ilustratif.

  for (let row = 0; row < latSteps; row++) {
    const lat =
      -8.745 +
      row * (0.146 / (latSteps - 1));

    for (let col = 0; col < lngSteps; col++) {
      const lng =
        115.162 +
        col * (0.114 / (lngSteps - 1));

      if (!onLand(lat, lng)) continue;

      const curvedLat =
        lat +
        Math.sin(
          row * 1.03 + col * 0.4
        ) * 0.00024;

      const curvedLng =
        lng +
        Math.sin(
          col * 0.91 + row * 0.28
        ) * 0.00024;

      idByCell.set(
        cellId(row, col),
        nodes.length
      );

      nodes.push([
        curvedLat,
        curvedLng,
      ]);
    }
  }

  // Menghubungkan titik menjadi dua arah.

  function connect(a, b, roadClass) {
    const length =
      Math.round(
        distanceMeters(
          nodes[a],
          nodes[b]
        ) * 10
      ) / 10;

    const flow = illustrativeFlow(
      nodes[a],
      nodes[b],
      roadClass
    );

    // Contoh visual After TDM:
    // angka 0.88 belum berasal dari
    // model kebijakan TDM tervalidasi.

    const after =
      Math.round(
        flow * 0.88 * 100
      ) / 100;

    edges.push([
      a,
      b,
      length,
      roadClass,
      flow,
      after,
    ]);

    edges.push([
      b,
      a,
      length,
      roadClass,
      flow,
      after,
    ]);
  }

  for (let row = 0; row < latSteps; row++) {
    for (let col = 0; col < lngSteps; col++) {
      const from = idByCell.get(
        cellId(row, col)
      );

      if (from === undefined) continue;

      const roadClass =
        row % 5 === 0 ||
        col % 5 === 0
          ? 3
          : row % 3 === 0 ||
              col % 3 === 0
            ? 4
            : 6;

      const east = idByCell.get(
        cellId(row, col + 1)
      );

      const north = idByCell.get(
        cellId(row + 1, col)
      );

      if (east !== undefined) {
        connect(
          from,
          east,
          roadClass
        );
      }

      if (north !== undefined) {
        connect(
          from,
          north,
          roadClass
        );
      }
    }
  }

  // =========================================
  // METADATA
  // =========================================

  const flows = edges
    .map((edge) => edge[4])
    .sort((a, b) => a - b);

  const p95Index = Math.min(
    flows.length - 1,
    Math.floor(flows.length * 0.95)
  );

  const visualP95 =
    flows[p95Index] || 1;

  return {
    format: 1,

    nodes,

    edges,

    zones: ZONES,

    mat: MAT,

    metadata: {
      matTotal: MAT_TOTAL,

      visualP95,

      source:
        "Jaringan ilustratif internal — tanpa API",

      trafficCalibration:
        "Belum dikalibrasi dengan volume ruas",

      afterNote:
        "After TDM hanya contoh visual dengan faktor 0.88",
    },
  };
}

// ===========================================
// MAIN EXPORT
// ===========================================

let cachedPromise;

export function getDenpasarNetwork() {
  if (!cachedPromise) {
    cachedPromise = Promise.resolve().then(
      buildIllustrativeNetwork
    );
  }

  return cachedPromise;
}
