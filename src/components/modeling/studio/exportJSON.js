
export default function exportJSON(model, assignment, stage) {
  const before = stage === "before";

  const content = {
    project: "DewataMove 2041",
    scenario: stage,
    year: 2041,
    unit: "smp/jam",
    policy: model.policy,
    total: before
      ? model.beforeTotal
      : model.afterTotal,
    mat: before
      ? model.matrixBefore
      : model.matrixAfter,
    roads:
      assignment?.roads?.map((road) => ({
        id: road.id,
        before: road.before,
        after: road.after,
      })) || null,
    coverage: assignment?.coverage ?? null,
    limitations: [
      model.caveat,
      assignment?.caveat,
    ],
  };

  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify(content, null, 2)],
      { type: "application/json" }
    )
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = `DewataMove_${stage}_2041.json`;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
