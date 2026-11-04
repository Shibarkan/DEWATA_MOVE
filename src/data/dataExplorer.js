export const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

export const EMISSION = {
  grk: {
    label: "GRK Transportasi",
    values: [5410.5, 2278.28, 506.35, 652.7, 804.04, 891.97],
    color: "#b91c1c",
  },
  co2: {
    label: "CO₂ Transportasi",
    values: [5416, 2283, 515, 660, 805, 872],
    color: "#dc2626",
  },
  no2: {
    label: "NO₂ (label tabel)",
    values: [0.21, 0.1, 0.1, 0.09, 0.09, 0.04],
    color: "#2563eb",
  },
  nh4: {
    label: "NH₄ (label tabel)",
    values: [1.16, 0.84, 0.83, 0.84, 0.31, 0.33],
    color: "#0f766e",
  },
};

export const SECTORS = [
  { name: "Pembangkit listrik", value: 1645.92, color: "#334155" },
  { name: "Transportasi", value: 891.97, color: "#b91c1c" },
  { name: "Rumah tangga", value: 187.83, color: "#f59e0b" },
];

export const SECTOR_TOTAL = SECTORS.reduce(
  (sum, item) => sum + item.value,
  0,
);

export const MODES = [
  { name: "Sepeda motor", value: 62.25345721582618, color: "#b91c1c" },
  { name: "Mobil", value: 32.84599966262082, color: "#ea580c" },
  { name: "Kendaraan berat", value: 3.4963680173374596, color: "#64748b" },
  { name: "Angkutan umum", value: 0.8910346270376266, color: "#2563eb" },
  { name: "Tidak bermotor", value: 0.5131404771779189, color: "#16a34a" },
];

export const PRIVATE_SHARE = MODES[0].value + MODES[1].value;

export const TMD = [
  { id: 1, route: "Kuta – Pesiapan", passengers: 34810, lf: 38.47 },
  { id: 2, route: "Ubung – Bandara", passengers: 31973, lf: 35.34 },
  { id: 3, route: "Ubung – Sanur", passengers: 15809, lf: 20.19 },
  { id: 4, route: "Ubung – Monkey Forest", passengers: 23909, lf: 28.63 },
  { id: 5, route: "Kuta – PNB", passengers: 28419, lf: 31.41 },
  { id: 6, route: "Kuta – Nusa Dua", passengers: 11737, lf: 14.99 },
];

export const TOTAL_TMD = TMD.reduce(
  (sum, item) => sum + item.passengers,
  0,
);

export const FUELS = {
  ron88: {
    name: "RON 88",
    values: [329874, 154754, 2856, 3208, 0, 0],
  },
  ron90: {
    name: "RON 90",
    values: [504638, 470151, 151882, 197248, 226992, 231340],
  },
  ron92: {
    name: "RON 92",
    values: [157462, 106612, 29854, 29955, 39268, 55900],
  },
  ron95: {
    name: "RON 95",
    values: [2416, 2456, 1380, 1176, 1528, 1852],
  },
  biosolar: {
    name: "Biosolar",
    values: [210548, 154591, 25360, 37976, 53928, 61768],
  },
  avtur: {
    name: "Avtur",
    values: [980000, 37200, 0, 0, 0, 0],
  },
  dex: {
    name: "Dex",
    values: [1956, 1732, 0, 0, 5240, 4361],
  },
  diesel51: {
    name: "Diesel 51 dalam Biosolar",
    values: [0, 0, 0, 0, 0, 6331],
  },
};

export const ROAD_VOLUME = [
  { name: "08.00", value: 225 },
  { name: "10.00", value: 252 },
  { name: "16.00", value: 265.8 },
  { name: "20.00", value: 264 },
  { name: "23.00", value: 42.8 },
];

export const NAVIGATION = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "emisi", label: "Emisi" },
  { id: "energi", label: "BBM" },
  { id: "moda", label: "Moda" },
  { id: "angkutan", label: "TMD" },
  { id: "jalan", label: "Volume Jalan" },
  { id: "mat", label: "MAT 2026" },
  { id: "skenario", label: "Skenario TDM" },
];