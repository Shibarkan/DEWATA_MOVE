import { STAGES } from "./helpers";

export function Headline({ stage }) {
  const title =
    STAGES.find((x) => x.id === stage)?.title || "SEBELUM";

  return (
    <section className="flex min-h-[270px] items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,.04),transparent_65%)] px-4 pb-12 pt-32 sm:min-h-[380px] sm:pt-40">
      <div className="text-center">
        <h1 className="break-words text-[clamp(2.5rem,9.2vw,7.7rem)] font-black leading-none tracking-[-0.07em] text-[#B91C1C]">
          {title}
        </h1>

        <div className="mx-auto mt-7 h-[3px] w-16 rounded-full bg-[#B91C1C]" />
      </div>
    </section>
  );
}

export function Tabs({ stage, onNavigate }) {
  return (
    <nav
      aria-label="Tahap modeling"
      className="flex justify-center gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:gap-12"
    >
      {STAGES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={
            stage === item.id ? "page" : undefined
          }
          onClick={() => onNavigate?.(item.id)}
          className={`shrink-0 border-b-2 px-1 py-4 text-[13px] font-semibold transition-colors ${
            stage === item.id
              ? "border-[#B91C1C] text-[#B91C1C]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
