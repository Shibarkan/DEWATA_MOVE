
import { useState } from "react";
import {
  BusFront,
  Users,
  Gauge,
  Clock3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MapPin,
} from "lucide-react";

const demoStops = [
  "Halte Rancangan A",
  "Halte Rancangan B",
  "Pusat Aktivitas Rancangan",
  "Halte Rancangan C",
];

const roles = [
  ["transit-operator", "Operator"],
  ["transit-driver", "Driver / Feeder"],
  ["transit-passenger", "Passenger"],
];

function NumberField({ label, value, min, max, onChange, unit }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <div className="flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#B91C1C]">
        <input
          type="number"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(event) => {
            const number = Number(event.target.value);
            if (event.target.value === "") return;
            if (!Number.isFinite(number)) return;
            onChange(Math.max(min, Math.min(max, Math.round(number))));
          }}
          className="w-full min-w-0 px-4 py-3 text-sm text-slate-900 outline-none"
        />

        <span className="pr-4 text-xs text-slate-400">
          {unit}
        </span>
      </div>
    </label>
  );
}

function Operator({ config, setConfig, onNavigate }) {
  const update = (key, value) =>
    setConfig((previous) => ({ ...previous, [key]: value }));

  const minimumFleet = Math.ceil(config.cycleTime / config.headway);
  const departuresPerHour = 60 / config.headway;
  const offeredSeats = departuresPerHour * config.capacity;
  const feasible = config.fleet >= minimumFleet;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B91C1C]">
            Operational Planning
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Service Configuration
          </h2>
        </div>

        <div className="mb-6 rounded-xl bg-[#FAFAFA] p-4">
          <p className="text-xs text-slate-500">
            Selected Service
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            Draft Corridor A — Demonstration Only
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            label="Headway"
            value={config.headway}
            min={1}
            max={120}
            unit="min"
            onChange={(value) => update("headway", value)}
          />

          <NumberField
            label="Available Fleet"
            value={config.fleet}
            min={1}
            max={500}
            unit="bus"
            onChange={(value) => update("fleet", value)}
          />

          <NumberField
            label="Vehicle Capacity"
            value={config.capacity}
            min={1}
            max={200}
            unit="seats"
            onChange={(value) => update("capacity", value)}
          />

          <NumberField
            label="Round-trip Cycle Time"
            value={config.cycleTime}
            min={1}
            max={600}
            unit="min"
            onChange={(value) => update("cycleTime", value)}
          />
        </div>

        <p className="mt-6 text-xs leading-6 text-slate-500">
          Semua nilai awal merupakan asumsi demonstrasi.
          Pengguna dapat mengubahnya untuk menguji
          kelayakan aritmetika rancangan layanan.
        </p>

        <button
          onClick={() => onNavigate("after")}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#B91C1C] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-red-800"
        >
          Evaluate in TDM Framework
          <ArrowRight size={17} />
        </button>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: BusFront,
              value: minimumFleet,
              label: "Minimum Fleet Required",
              unit: "vehicles",
            },
            {
              icon: Clock3,
              value: `${departuresPerHour.toFixed(1)}`,
              label: "Departure Frequency",
              unit: "departures/hour/direction",
            },
            {
              icon: Users,
              value: offeredSeats.toFixed(0),
              label: "Theoretical Seat Supply",
              unit: "seats/hour/direction",
            },
            {
              icon: Gauge,
              value: feasible ? "FEASIBLE" : "SHORTAGE",
              label: "Simple Fleet Feasibility",
              unit: "based on cycle time",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <Icon size={20} className="text-[#B91C1C]" />

                <p className="mt-5 text-2xl font-black text-slate-900">
                  {item.value}
                </p>

                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {item.label}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  {item.unit}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className={`rounded-2xl border p-6 ${
            feasible
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {feasible ? (
              <CheckCircle2 size={19} className="text-green-700" />
            ) : (
              <AlertTriangle size={19} className="text-amber-700" />
            )}

            <p className="font-bold text-slate-900">
              {feasible
                ? "Basic Fleet Requirement Met"
                : "Insufficient Fleet for Target Headway"}
            </p>
          </div>

          <p className="mt-3 text-xs leading-7 text-slate-600">
            Perhitungan sederhana ini menggunakan
            N = ceil(cycle time / headway).
            Belum memperhitungkan armada cadangan,
            gangguan operasi, variasi waktu siklus,
            atau pola jadwal aktual.
          </p>
        </div>
      </div>
    </div>
  );
}

function Driver({ config }) {
  const [progress, setProgress] = useState(0);

  const completed = progress >= demoStops.length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#B91C1C] p-7 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-red-100">
            Driver / Feeder Prototype
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Draft Corridor A
          </h2>

          <p className="mt-2 text-sm text-red-100">
            Demonstration trip — not a live service
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs text-slate-500">
                Planned Headway
              </p>
              <p className="mt-2 text-2xl font-bold">
                {config.headway} min
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs text-slate-500">
                Stops Completed
              </p>
              <p className="mt-2 text-2xl font-bold">
                {progress}/{demoStops.length}
              </p>
            </div>
          </div>

          <h3 className="mb-6 font-bold text-slate-900">
            Stop Sequence
          </h3>

          <div className="space-y-5">
            {demoStops.map((stop, index) => {
              const passed = index < progress;
              const active = index === progress;

              return (
                <div key={stop} className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      passed
                        ? "bg-green-100 text-green-700"
                        : active
                          ? "bg-red-100 text-[#B91C1C]"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <MapPin size={18} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {stop}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {passed
                        ? "Completed in demo"
                        : active
                          ? "Next simulated stop"
                          : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              disabled={completed}
              onClick={() =>
                setProgress((p) =>
                  Math.min(demoStops.length, p + 1)
                )
              }
              className="rounded-full bg-[#B91C1C] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {completed
                ? "Demo Trip Completed"
                : "Complete Next Stop"}
            </button>

            <button
              onClick={() => setProgress(0)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Passenger() {
  const [origin, setOrigin] = useState("0");
  const [destination, setDestination] = useState("2");
  const [checked, setChecked] = useState(false);

  const valid = origin !== destination;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#B91C1C] p-7 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-red-100">
            Passenger Experience
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Plan Your Journey.
          </h2>

          <p className="mt-2 text-sm text-red-100">
            Public transport journey planner prototype
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">
              Origin
            </label>

            <select
              value={origin}
              onChange={(event) => {
                setOrigin(event.target.value);
                setChecked(false);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {demoStops.map((stop, index) => (
                <option key={stop} value={String(index)}>
                  {stop}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">
              Destination
            </label>

            <select
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setChecked(false);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {demoStops.map((stop, index) => (
                <option key={stop} value={String(index)}>
                  {stop}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setChecked(true)}
            className="w-full rounded-full bg-[#B91C1C] py-3.5 text-sm font-bold text-white transition hover:bg-red-800"
          >
            Find Journey
          </button>

          {checked && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-900">
                {valid
                  ? "Route Data Required"
                  : "Choose Different Stops"}
              </p>

              <p className="mt-2 text-xs leading-7 text-amber-900/80">
                {valid
                  ? "Jaringan rute, jadwal, tarif, dan waktu perjalanan belum diintegrasikan. Tidak ada estimasi perjalanan yang dibuat-buat."
                  : "Titik asal dan tujuan harus berbeda."}
              </p>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold text-slate-600">
              Planned Capabilities
            </p>

            <p className="mt-3 text-xs leading-7 text-slate-500">
              Journey planning, transfer information,
              first-mile/last-mile access, waiting time,
              route accessibility, and fare information.
              Real-time tracking membutuhkan integrasi
              data operator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transit({
  role = "transit-operator",
  onNavigate,
  config,
  setConfig,
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <section className="px-5 pb-12 pt-20 text-center sm:pt-28">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B91C1C]">
          DewataMove Ecosystem
        </p>

        <h1 className="text-4xl font-black text-slate-900 sm:text-6xl">
          Transit <span className="text-[#B91C1C]">Operations.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-500">
          Rancangan aplikasi digital untuk menghubungkan
          pengelolaan TMD dan feeder, aktivitas pengemudi,
          serta informasi perjalanan penumpang.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="mb-9 flex flex-wrap justify-center gap-2">
          {roles.map(([id, label]) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                role === id
                  ? "bg-[#B91C1C] text-white shadow-lg"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-red-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {role === "transit-operator" && (
          <Operator
            config={config}
            setConfig={setConfig}
            onNavigate={onNavigate}
          />
        )}

        {role === "transit-driver" && (
          <Driver config={config} />
        )}

        {role === "transit-passenger" && <Passenger />}

        <p className="mt-12 text-center text-xs leading-7 text-slate-400">
          Prototype planning interface — bukan aplikasi
          operasional resmi Trans Metro Dewata.
        </p>
      </section>
    </div>
  );
}
