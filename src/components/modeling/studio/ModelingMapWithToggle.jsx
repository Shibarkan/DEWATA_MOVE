import { useState } from "react";
import { Network } from "lucide-react";
import ModelMap from "../ModelMap";

export default function ModelingMapWithToggle({
  compact = false,
  stage = "before",
  label,
  graph,
  model,
  assignment,
  selectedZone,
  onSelectZone,
  syncView,
  onViewChange,
}) {
  const [showTmdLayer, setShowTmdLayer] = useState(false);

  return (
    <div className="relative min-w-0">
      <ModelMap
        compact={compact}
        stage={stage}
        label={label}
        graph={graph}
        model={model}
        assignment={assignment}
        selectedZone={selectedZone}
        onSelectZone={onSelectZone}
        syncView={syncView}
        onViewChange={onViewChange}
        showTmdLayer={showTmdLayer}
      />

      {/* Tombol layer TMD */}

      <button
        type="button"
        onClick={() => setShowTmdLayer((visible) => !visible)}
        aria-pressed={showTmdLayer}
        aria-label={
          showTmdLayer
            ? "Sembunyikan jaringan TMD"
            : "Tampilkan jaringan TMD"
        }
        className={`absolute left-3 top-[60px] z-[1200] flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold shadow-sm transition-colors ${
          showTmdLayer
            ? "border-[#B91C1C] bg-[#B91C1C] text-white"
            : "border-slate-200 bg-white/95 text-slate-700 hover:border-[#B91C1C] hover:text-[#B91C1C]"
        }`}
      >
        <Network size={14} />
        {showTmdLayer ? "Sembunyikan jaringan TMD" : "Jaringan TMD"}
      </button>
    </div>
  );
}
