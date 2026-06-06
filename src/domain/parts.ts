// Multi-part (DEEL) exam support. A cover can be split into up to four parts; the
// per-part weights are percentages that must sum to 100. A single-part exam keeps
// the canonical shape `partsCount = 1`, `partIndex = 1`, `partWeights = [100]`.
export const MIN_PARTS = 1;
export const MAX_PARTS = 4;
export const TOTAL_WEIGHT = 100;

export function partWeightsTotal(weights: number[]): number {
  return weights.reduce((sum, w) => sum + (Number(w) || 0), 0);
}

export function isValidPartWeights(weights: number[], partsCount: number): boolean {
  return weights.length === partsCount && partWeightsTotal(weights) === TOTAL_WEIGHT;
}

// Pad with 0 / trim to match the requested part count, preserving existing values.
export function resizePartWeights(weights: number[], partsCount: number): number[] {
  const next = weights.slice(0, partsCount);
  while (next.length < partsCount) next.push(0);
  return next;
}

export function clampPartIndex(partIndex: number, partsCount: number): number {
  if (partIndex < 1) return 1;
  if (partIndex > partsCount) return partsCount;
  return partIndex;
}
