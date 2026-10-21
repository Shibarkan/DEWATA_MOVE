
export const zoneNames = [
  "Dangin Puri dan Sumerta",
  "Dauh Puri dan Pemecutan",
  "Ubung dan Peguyangan",
  "Tonja",
  "Kesiman",
  "Sanur, Sanur Kaja, Sanur Kauh",
  "Renon, Panjer, Sesetan, Pedungan, Pemogan",
  "Padangsambian",
  "Padangsambian Kaja / Ubung Kaja",
  "Peguyangan Kaja / Peguyangan Kangin",
  "Penatih / Penatih Dangin Puri",
  "Pulau Serangan dan Pelabuhan Benoa",
  "Bandara Ngurah Rai / Tuban / Kuta",
];

export const mat2026 = [
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

export const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

export const rowTotals = mat2026.map((row) =>
  row.reduce((total, value) => total + value, 0)
);

export const columnTotals = zoneNames.map((_, j) =>
  mat2026.reduce((total, row) => total + row[j], 0)
);

export const matTotal = rowTotals.reduce(
  (total, value) => total + value,
  0
);

export const intraZonalTotal = mat2026.reduce(
  (total, row, i) => total + row[i],
  0
);

export const odPairs = mat2026.flatMap((row, i) =>
  row.map((volume, j) => ({
    origin: i + 1,
    destination: j + 1,
    volume,
  }))
).sort((a, b) => b.volume - a.volume);

export const largestOD = odPairs[0];

export const privateVehicleShareReference = 95.1;

export const dataNotes = {
  mat: "MAT 2026 — data masukan studi kasus ITEC-U",
  share: "Referensi mode share Bali tahun 2024",
  unit: "smp/jam — bukan jumlah penumpang",
};

export function validateMAT(matrix = mat2026) {
  const validShape =
    matrix.length === 13 &&
    matrix.every(
      (row) => Array.isArray(row) && row.length === 13
    );

  const validValues =
    validShape &&
    matrix.every((row) =>
      row.every((value) =>
        Number.isFinite(value) && value >= 0
      )
    );

  return {
    valid: validShape && validValues,
    rows: matrix.length,
    columns: validShape ? matrix[0].length : null,
    total: validValues
      ? matrix.flat().reduce((a, b) => a + b, 0)
      : null,
  };
}
