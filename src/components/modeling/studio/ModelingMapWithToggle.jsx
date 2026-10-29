import { useState } from "react";
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
  const [displayMode, setDisplayMode] = useState("all");

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
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />
    </div>
  );
}
