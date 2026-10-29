
import L from "leaflet";

// TRANS METRO DEWATA
// Referensi jaringan: TMD-Transit Network Map Denpasar
// Rute jalan dicocokkan melalui OSRM / OpenStreetMap.

export const TMD_CORRIDORS = [
  {
    id: "1",
    name: "Koridor 1",
    route: "Sentral Parkir Kuta – Terminal Pesiapan",
    color: "#F28C28",
    waypoints: [
      [-8.712636, 115.181090], // Sentral Parkir Kuta
      [-8.7017, 115.1844],     // Abian Base
      [-8.6940, 115.1847],     // Imam Bonjol Kelod
      [-8.6852, 115.1914],     // Pulau Galang
      [-8.6758, 115.1978],     // Simpang Soputan
      [-8.6666, 115.2005],     // Abian Timbul
      [-8.6575, 115.2021],     // Buagan
      [-8.6508, 115.2018],     // Monang Maning
      [-8.6448, 115.2054],     // Tegal Sari
      [-8.635176, 115.206119], // Terminal Ubung
      [-8.6206, 115.2012],     // Petangan Gede
      [-8.6108, 115.1930],     // Pos Kargo
      [-8.60458, 115.17746],   // Puspem Badung
      [-8.5787, 115.1855],     // Darmasaba
      [-8.559502, 115.168154], // Terminal Mengwi
      [-8.5480, 115.1570],     // Abian Tuwung
      [-8.5428, 115.1430],     // Koripan
      [-8.5390, 115.1350],     // Sanggulan
      [-8.5365, 115.1225],     // Simpang Gubug
      [-8.5351205, 115.1130958], // Terminal Pesiapan
    ],
  },

  {
    id: "2",
    name: "Koridor 2",
    route: "Terminal Ubung – Bandara Ngurah Rai",
    color: "#244A8F",
    waypoints: [
      [-8.635176, 115.206119], // Terminal Ubung
      [-8.6450, 115.2090],     // Cokroaminoto
      [-8.6545, 115.2130],     // Kawasan Gajah Mada
      [-8.6570, 115.2190],     // GOR Ngurah Rai
      [-8.6504, 115.2315],     // Terminal Kreneng
      [-8.6530, 115.2250],     // Kayu Mas
      [-8.6702, 115.2160],     // RSAD Udayana
      [-8.6840, 115.2140],     // Sudirman
      [-8.6740, 115.2040],     // Teuku Umar
      [-8.6600, 115.2000],     // Buagan
      [-8.6820, 115.1910],     // Pulau Galang
      [-8.6940, 115.1847],     // Imam Bonjol
      [-8.712636, 115.181090], // Sentral Parkir Kuta
      [-8.7310, 115.1730],     // Tuban
      [-8.7420, 115.1680],     // Akses bandara
      [-8.7483, 115.1671],     // Bandara Ngurah Rai
    ],
  },

  {
    id: "3",
    name: "Koridor 3",
    route: "Terminal Ubung – Dalung – Sanur",
    color: "#36A8DC",
    waypoints: [
      [-8.635176, 115.206119], // Terminal Ubung
      [-8.6305, 115.1940],     // Cokroaminoto / Gatsu Barat
      [-8.6220, 115.1810],     // Arah Dalung
      [-8.6190, 115.1768],     // Dalung
      [-8.6220, 115.1810],     // Jalur kembali
      [-8.6305, 115.1940],
      [-8.635176, 115.206119], // Terminal Ubung
      [-8.6320, 115.2240],     // Gatot Subroto Timur
      [-8.6370, 115.2440],     // Arah Tohpati
      [-8.6492837, 115.254998], // Simpang Titi Banda
      [-8.6670, 115.2600],     // Arah Sanur
      [-8.6800, 115.2630],
      [-8.68676, 115.26379],   // Icon Bali Mall, Sanur
    ],
  },

  {
    id: "4",
    name: "Koridor 4",
    route: "Terminal Ubung – Monkey Forest Ubud",
    color: "#168A65",
    waypoints: [
      [-8.635176, 115.206119], // Terminal Ubung
      [-8.6305, 115.2250],     // Gatot Subroto Timur
      [-8.6313818, 115.260605], // Terminal Batubulan
      [-8.6200, 115.2730],     // Arah Sukawati
      [-8.6090, 115.2850],     // Sukawati
      [-8.5880, 115.2780],     // Arah Mas
      [-8.5660, 115.2760],
      [-8.5440, 115.2690],     // Peliatan
      [-8.51877, 115.25811],   // Monkey Forest Ubud
    ],
  },

  {
    id: "5",
    name: "Koridor 5",
    route: "Sentral Parkir Kuta – Politeknik Negeri Bali via Titi Banda",
    color: "#E6A927",
    waypoints: [
      [-8.712636, 115.181090], // Sentral Parkir Kuta
      [-8.7017, 115.1844],
      [-8.6940, 115.1847],     // Imam Bonjol
      [-8.6820, 115.1950],     // Arah pusat Denpasar
      [-8.6740, 115.2130],     // Gatot Subroto
      [-8.6610, 115.2350],     // Gatot Subroto Timur
      [-8.6492837, 115.254998], // Titi Banda
      [-8.6710, 115.2550],     // Bypass Ngurah Rai
      [-8.7000, 115.2480],     // Arah selatan
      [-8.7310, 115.2300],
      [-8.7580, 115.2010],
      [-8.7790, 115.1800],
      [-8.799735, 115.162138], // Politeknik Negeri Bali
    ],
  },

  {
    id: "6",
    name: "Koridor 6",
    route: "Sentral Parkir Kuta – Nusa Dua via Bandara",
    color: "#65C3DF",
    waypoints: [
      [-8.712636, 115.181090], // Sentral Parkir Kuta
      [-8.7300, 115.1750],     // Tuban
      [-8.7420, 115.1680],     // Akses bandara
      [-8.7483, 115.1671],     // Bandara Ngurah Rai
      [-8.7640, 115.1780],     // Bypass Ngurah Rai
      [-8.7820, 115.1960],     // Jimbaran / Mumbul
      [-8.7900, 115.2110],
      [-8.801572, 115.228303], // Sentral Parkir Nusa Dua
    ],
  },
];

// TITIK UTAMA DAN TERMINAL
//
// Ini bukan daftar lengkap semua halte resmi.
// Koordinat halte perantara yang belum diverifikasi
// harus dicocokkan lagi dengan data GIS / GTFS resmi.

export const TMD_STOPS = [
  {
    name: "Sentral Parkir Kuta",
    coordinates: [-8.712636, 115.181090],
    routes: ["1", "5", "6"],
  },
  {
    name: "Terminal Ubung",
    coordinates: [-8.635176, 115.206119],
    routes: ["1", "2", "3", "4"],
  },
  {
    name: "Terminal Pesiapan, Tabanan",
    coordinates: [-8.5351205, 115.1130958],
    routes: ["1"],
  },
  {
    name: "Terminal Mengwi",
    coordinates: [-8.559502, 115.168154],
    routes: ["1"],
  },
  {
    name: "Pusat Pemerintahan Badung",
    coordinates: [-8.60458, 115.17746],
    routes: ["1"],
  },
  {
    name: "Bandara Ngurah Rai",
    coordinates: [-8.7483, 115.1671],
    routes: ["2", "6"],
  },
  {
    name: "Dalung",
    coordinates: [-8.6190, 115.1768],
    routes: ["3"],
  },
  {
    name: "Icon Bali Mall, Sanur",
    coordinates: [-8.68676, 115.26379],
    routes: ["3"],
  },
  {
    name: "Terminal Batubulan",
    coordinates: [-8.6313818, 115.260605],
    routes: ["4"],
  },
  {
    name: "Monkey Forest Ubud",
    coordinates: [-8.51877, 115.25811],
    routes: ["4"],
  },
  {
    name: "Titi Banda",
    coordinates: [-8.6492837, 115.254998],
    routes: ["3", "5"],
  },
  {
    name: "Politeknik Negeri Bali",
    coordinates: [-8.799735, 115.162138],
    routes: ["5"],
  },
  {
    name: "Sentral Parkir Nusa Dua",
    coordinates: [-8.801572, 115.228303],
    routes: ["6"],
  },
];

// Wilayah peta yang mencakup Kuta, Denpasar, Tabanan,
// Sanur, Ubud, Jimbaran, dan Nusa Dua.
export const TMD_BOUNDS = [
  [-8.815, 115.105],
  [-8.508, 115.300],
];

// ROAD ROUTING

const ROUTING_APIS = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

let sharedGeometryPromise = null;

const clamp = (n, min, max) =>
  Math.max(min, Math.min(max, n));

function cumulativeLengths(points) {
  const cumulative = [0];

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];

    const meanLat =
      ((a[0] + b[0]) / 2) * Math.PI / 180;

    const dx = (b[1] - a[1]) * Math.cos(meanLat);
    const dy = b[0] - a[0];

    cumulative.push(
      cumulative[i - 1] + Math.hypot(dx, dy)
    );
  }

  return {
    cumulative,
    total: cumulative[cumulative.length - 1] || 1,
  };
}

function pointAt(points, info, progress) {
  const target = clamp(progress, 0, 1) * info.total;

  let index = 0;

  while (
    index < points.length - 2 &&
    target > info.cumulative[index + 1]
  ) {
    index += 1;
  }

  const a = points[index];
  const b = points[index + 1];

  const start = info.cumulative[index];
  const end = info.cumulative[index + 1];

  const t = clamp(
    (target - start) / Math.max(end - start, 1e-12),
    0,
    1
  );

  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
}

// AMBIL GEOMETRI JALAN
//
// radiuses=unlimited membantu titik waypoint yang
// tidak tepat di tengah jalan agar tetap dapat di-snap.
// Jika routing gagal, garis waypoint ditampilkan putus-putus.

async function fetchRoadGeometry(corridor) {
  const locations = corridor.waypoints
    .map(([lat, lng]) =>
      `${lng.toFixed(6)},${lat.toFixed(6)}`
    )
    .join(";");

  const radiuses = corridor.waypoints
    .map(() => "unlimited")
    .join(";");

  let lastError;

  for (const base of ROUTING_APIS) {
    const controller = new AbortController();

    const timeout = window.setTimeout(
      () => controller.abort(),
      7000
    );

    try {
      const url =
        `${base}${locations}` +
        `?overview=full&geometries=geojson&steps=false` +
        `&radiuses=${radiuses}`;

      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const coordinates =
        data?.routes?.[0]?.geometry?.coordinates;

      if (
        data.code !== "Ok" ||
        !Array.isArray(coordinates) ||
        coordinates.length < 3
      ) {
        throw new Error(
          data?.message || data?.code || "Rute kosong"
        );
      }

      return {
        points: coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]),
        roadSnapped: true,
      };
    } catch (error) {
      lastError = error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  console.warn(
    `[TMD] Routing ${corridor.name} gagal; menggunakan waypoint referensi.`,
    lastError?.message
  );

  return {
    points: corridor.waypoints,
    roadSnapped: false,
  };
}

function loadAllGeometry() {
  if (!sharedGeometryPromise) {
    sharedGeometryPromise = Promise.all(
      TMD_CORRIDORS.map(async (corridor) => ({
        id: corridor.id,
        geometry: await fetchRoadGeometry(corridor),
      }))
    ).then((results) =>
      Object.fromEntries(
        results.map(({ id, geometry }) => [
          id,
          geometry,
        ])
      )
    );
  }

  return sharedGeometryPromise;
}

// ICON HALTE

function stopIcon() {
  return L.divIcon({
    className: "dm-tmd-stop-icon",
    html: `
      <span style="
        display:block;
        width:12px;
        height:12px;
        border:3px solid #B91C1C;
        border-radius:50%;
        background:#FFFFFF;
        box-shadow:0 1px 5px #0f172a40;
      "></span>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// ICON BUS

function busIcon(color, routeId) {
  return L.divIcon({
    className: "dm-tmd-bus-icon",
    html: `
      <span style="
        display:flex;
        align-items:center;
        justify-content:center;
        gap:3px;
        width:36px;
        height:24px;
        border:1.5px solid ${color};
        border-radius:8px;
        background:#FFFFFF;
        box-shadow:0 2px 7px #0f172a35;
        white-space:nowrap;
      ">
        <span style="
          position:relative;
          display:block;
          width:18px;
          height:13px;
          border-radius:4px 4px 3px 3px;
          background:#243244;
          box-shadow:inset 0 -3px 0 ${color};
        ">
          <span style="
            position:absolute;
            left:3px;
            right:3px;
            top:2px;
            height:4px;
            border-radius:2px;
            background:linear-gradient(90deg,#9FC6DA 0 43%,#243244 43% 55%,#9FC6DA 55%);
          "></span>
          <span style="
            position:absolute;
            left:3px;
            bottom:-2px;
            width:4px;
            height:4px;
            border:1px solid #FFFFFF;
            border-radius:50%;
            background:#17202E;
            box-shadow:9px 0 0 -1px #17202E,9px 0 0 0 #FFFFFF;
          "></span>
        </span>
        <b style="font-size:9px;line-height:1;color:${color}">${routeId}</b>
      </span>
    `,
    iconSize: [36, 24],
    iconAnchor: [18, 12],
  });
}

// LAYER JARINGAN TMD
// Kompatibel dengan ModelMap dan SimulationPreview.

export function addTmdNetworkLayer(
  map,
  { animateBuses = true, showStops = true } = {}
) {
  if (!map) {
    return {
      layer: null,
      ready: Promise.resolve(),
      destroy() {},
    };
  }

  // Garis koridor berada di atas canvas kendaraan z450.
  const routePane =
    map.getPane("dmTmdRoutePane") ||
    map.createPane("dmTmdRoutePane");

  routePane.style.zIndex = "460";
  routePane.style.pointerEvents = "none";

  const layer = L.layerGroup().addTo(map);

  // KORIDOR DAN BUS

  const states = TMD_CORRIDORS.map(
    (corridor, index) => {
      const points = corridor.waypoints;
      const info = cumulativeLengths(points);

      const halo = L.polyline(points, {
        pane: "dmTmdRoutePane",
        color: "#FFFFFF",
        weight: 7,
        opacity: 0.96,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(layer);

      const line = L.polyline(points, {
        pane: "dmTmdRoutePane",
        color: corridor.color,
        weight: 3.8,
        opacity: 0.96,
        dashArray: "6 6",
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(layer);

      const initialProgress = 0.08 + index * 0.13;

      const bus = L.marker(
        pointAt(points, info, initialProgress),
        {
          icon: busIcon(corridor.color, corridor.id),
          keyboard: false,
          zIndexOffset: 700,
          interactive: true,
          title: `Bus ilustratif Koridor ${corridor.id}`,
        }
      )
        .bindTooltip(
          `<strong>${corridor.name}</strong><br/>` +
          `<small>Posisi bus simulasi, bukan GPS real-time</small>`
        )
        .addTo(layer);

      return {
        corridor,
        points,
        info,
        halo,
        line,
        bus,
        progress: initialProgress,
        direction: index % 2 === 0 ? 1 : -1,
        speed: 0.0035 + index * 0.0003,
      };
    }
  );

  // HALTE DAN TERMINAL UTAMA

  if (showStops) {
    for (const stop of TMD_STOPS) {
      const routeLabel = stop.routes.length
        ? `Koridor ${stop.routes.join(", ")}`
        : "Simpul jaringan";

      L.marker(stop.coordinates, {
        icon: stopIcon(),
        title: stop.name,
        zIndexOffset: 500,
      })
        .bindTooltip(
          `<strong>${stop.name}</strong><br/>${routeLabel}`,
          {
            direction: "top",
            opacity: 0.98,
          }
        )
        .addTo(layer);
    }
  }

  // ANIMASI BUS

  let destroyed = false;
  let raf = 0;
  let lastTime = 0;

  function animate(now) {
    if (destroyed) return;

    const dt = lastTime
      ? Math.min(0.05, (now - lastTime) / 1000)
      : 0;

    lastTime = now;

    const reducedMotion =
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      )?.matches;

    if (animateBuses && !reducedMotion) {
      for (const state of states) {
        state.progress +=
          state.direction * state.speed * dt;

        if (state.progress >= 0.98) {
          state.progress = 0.98;
          state.direction = -1;
        }

        if (state.progress <= 0.02) {
          state.progress = 0.02;
          state.direction = 1;
        }

        state.bus.setLatLng(
          pointAt(
            state.points,
            state.info,
            state.progress
          )
        );
      }
    }

    raf = window.requestAnimationFrame(animate);
  }

  raf = window.requestAnimationFrame(animate);

  // GANTI WAYPOINT DENGAN GEOMETRI JALAN OSRM

  const ready = loadAllGeometry()
    .then((geometries) => {
      if (destroyed) return;

      for (const state of states) {
        const geometry =
          geometries[state.corridor.id];

        if (!geometry?.points?.length) continue;

        state.points = geometry.points;
        state.info = cumulativeLengths(state.points);

        state.halo.setLatLngs(state.points);
        state.line.setLatLngs(state.points);

        state.line.setStyle({
          dashArray: geometry.roadSnapped
            ? null
            : "6 6",
          opacity: geometry.roadSnapped
            ? 0.96
            : 0.78,
        });

        state.bus.setLatLng(
          pointAt(
            state.points,
            state.info,
            state.progress
          )
        );
      }
    })
    .catch((error) => {
      console.warn(
        "[TMD] Tidak dapat memuat geometri jalan.",
        error?.message
      );
    });

  // CLEANUP

  return {
    layer,
    ready,

    destroy() {
      if (destroyed) return;

      destroyed = true;

      if (raf) {
        window.cancelAnimationFrame(raf);
      }

      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    },
  };
}
