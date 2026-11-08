export const DEFAULT_MATRIX_METADATA = Object.freeze({
  year: 2026,
  period: "peak",
  unit: "smp/jam",
  coverage: "Kota Denpasar dan hubungan mobilitas terkait",
  source: "ITEC-U case study data",
  datasetType: "MAT",
  qualityStatus: "Verified",
});

export function validateMatrixShape(matrix, expectedSize = 13) {
  if (!Array.isArray(matrix) || matrix.length !== expectedSize) {
    return {
      validShape: false,
      rows: Array.isArray(matrix) ? matrix.length : 0,
      columns: 0,
      values: [],
      expectedSize,
    };
  }

  const rowsAreValid = matrix.every(
    (row) => Array.isArray(row) && row.length === expectedSize,
  );

  return {
    validShape: rowsAreValid,
    rows: matrix.length,
    columns: rowsAreValid ? matrix[0].length : 0,
    values: rowsAreValid ? matrix.flat() : [],
    expectedSize,
  };
}

export function validateMatrixIntegrity(
  matrix,
  metadata = DEFAULT_MATRIX_METADATA,
  expectedTotal = 1316578,
) {
  const shape = validateMatrixShape(matrix, 13);
  const validNumbers =
    shape.validShape &&
    shape.values.every(
      (value) => Number.isFinite(value) && value >= 0,
    );

  const total = validNumbers
    ? shape.values.reduce((sum, value) => sum + value, 0)
    : null;

  const diagonalTotal = validNumbers
    ? matrix.reduce((sum, row, index) => sum + row[index], 0)
    : null;

  const offDiagonalTotal =
    total !== null && diagonalTotal !== null
      ? total - diagonalTotal
      : null;

  const issues = [];

  if (!shape.validShape) {
    issues.push("MAT harus berukuran 13 × 13.");
  }

  if (!validNumbers) {
    issues.push("Semua elemen MAT harus numerik dan tidak negatif.");
  }

  if (typeof total === "number" && Number(total) !== expectedTotal) {
    issues.push(
      `Total MAT tidak konsisten dengan basis yang diharapkan (${expectedTotal}).`,
    );
  }

  if (typeof diagonalTotal === "number" && diagonalTotal !== 173476) {
    issues.push("Total perjalanan intrazona tidak sesuai basis yang terverifikasi.");
  }

  if (typeof offDiagonalTotal === "number" && offDiagonalTotal !== 1143102) {
    issues.push("Total perjalanan antarzona tidak sesuai basis yang terverifikasi.");
  }

  const metadataStatus = metadata?.source ? "Verified" : "Missing";

  return {
    valid: shape.validShape && validNumbers && issues.length === 0,
    shape,
    total,
    diagonalTotal,
    offDiagonalTotal,
    expectedTotal,
    metadata: {
      ...DEFAULT_MATRIX_METADATA,
      ...metadata,
      status: metadataStatus,
    },
    issues,
    qualityStatus: issues.length === 0 ? "Verified" : "Needs review",
  };
}

export function getMatrixDataQualityReport(matrix = null, metadata = null) {
  const sourceMatrix = Array.isArray(matrix) ? matrix : null;
  return validateMatrixIntegrity(
    sourceMatrix ?? Array.from({ length: 13 }, () => Array(13).fill(0)),
    metadata ?? DEFAULT_MATRIX_METADATA,
  );
}

export const MATRIX_QUALITY_BASELINE = Object.freeze({
  expectedSize: 13,
  total: 1316578,
  intraZonalTotal: 173476,
  interZonalTotal: 1143102,
  unit: "smp/jam",
  note: "Data dasar MAT 2026; bukan jumlah penumpang atau orang.",
});
