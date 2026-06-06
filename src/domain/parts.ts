import type { Language } from './types';

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

const DEFAULT_WEIGHTS_BY_COUNT: Record<number, number[]> = {
  1: [100],
  2: [50, 50],
  3: [40, 30, 30],
  4: [25, 25, 25, 25],
};

export function resizePartWeights(weights: number[], partsCount: number): number[] {
  if (weights.length === partsCount) return weights;
  return [...(DEFAULT_WEIGHTS_BY_COUNT[partsCount] || Array(partsCount).fill(0))];
}

export function clampPartIndex(partIndex: number, partsCount: number): number {
  if (partIndex < 1) return 1;
  if (partIndex > partsCount) return partsCount;
  return partIndex;
}

// Title suffix shown for multi-part covers (e.g. " - DEEL 1" / " - PART 1").
// Empty for single-part. Default language is 'nl' so existing callers are untouched.
export function partTitleSuffix(partsCount: number, partIndex: number, lang: Language = 'nl'): string {
  if (partsCount <= 1) return '';
  const word = lang === 'en' ? 'PART' : 'DEEL';
  return ` - ${word} ${partIndex}`;
}

