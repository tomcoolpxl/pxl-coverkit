import { describe, it, expect } from 'vitest';
import {
  partWeightsTotal,
  isValidPartWeights,
  resizePartWeights,
  clampPartIndex,
  partTitleSuffix,
} from './parts';

describe('partWeightsTotal', () => {
  it('sums the weights, treating non-numbers as 0', () => {
    expect(partWeightsTotal([60, 40])).toBe(100);
    expect(partWeightsTotal([])).toBe(0);
    expect(partWeightsTotal([NaN as unknown as number, 50])).toBe(50);
  });
});

describe('isValidPartWeights', () => {
  it('requires the count to match and the total to be 100', () => {
    expect(isValidPartWeights([100], 1)).toBe(true);
    expect(isValidPartWeights([60, 40], 2)).toBe(true);
    expect(isValidPartWeights([60, 30], 2)).toBe(false); // total 90
    expect(isValidPartWeights([50, 50], 3)).toBe(false); // wrong length
  });
});

describe('resizePartWeights', () => {
  it('pads with 0 when growing and preserves existing values', () => {
    expect(resizePartWeights([100], 3)).toEqual([100, 0, 0]);
  });

  it('trims extra entries when shrinking', () => {
    expect(resizePartWeights([60, 40, 0], 2)).toEqual([60, 40]);
  });

  it('returns the same shape when the count is unchanged', () => {
    expect(resizePartWeights([50, 50], 2)).toEqual([50, 50]);
  });
});

describe('clampPartIndex', () => {
  it('clamps the index into the 1..partsCount range', () => {
    expect(clampPartIndex(3, 2)).toBe(2);
    expect(clampPartIndex(0, 4)).toBe(1);
    expect(clampPartIndex(2, 4)).toBe(2);
  });
});

describe('partTitleSuffix', () => {
  it('is empty for a single-part cover', () => {
    expect(partTitleSuffix(1, 1)).toBe('');
  });

  it('renders " - DEEL N" only when there is more than one part', () => {
    expect(partTitleSuffix(2, 1)).toBe(' - DEEL 1');
    expect(partTitleSuffix(3, 2)).toBe(' - DEEL 2');
  });
});
