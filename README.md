# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:


# DewataMove 2041

Platform kajian mobilitas Denpasar berbasis React dan Vite. Aplikasi mencakup data perjalanan, visualisasi jaringan, skenario Transport Demand Management, dan evaluasi layanan transit.

## Struktur Source

- `src/pages/` berisi halaman yang dipilih melalui hash URL.
- `src/components/layout/` berisi header, footer, dan elemen tata letak bersama.
- `src/components/home/` berisi pratinjau peta, kontrolnya, serta pemuatan tertundanya.
- `src/components/modeling/` berisi visualisasi peta dan hasil pemodelan.
- `src/components/modeling/studio/` berisi tahap-tahap antarmuka studio pemodelan.
- `src/components/ui/` berisi komponen UI lintas halaman.
- `src/data/` berisi data sumber dan fungsi perhitungan domain; `dataExplorer.js` khusus untuk dashboard data.

## Menjalankan Aplikasi

```bash
npm install
npm run dev
```

## Pemeriksaan

```bash
npm run lint
npm run build
```

Pratinjau peta beranda dimuat ketika mendekati viewport. Tile peta menggunakan OpenStreetMap dan memerlukan koneksi jaringan.
