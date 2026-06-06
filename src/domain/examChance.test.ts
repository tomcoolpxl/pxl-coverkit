import { describe, it, expect } from 'vitest';
import { EXAM_CHANCE_OPTIONS, EXAM_CHANCE_CODES } from './examChance';

describe('examChance options', () => {
  it('stores bare codes as values', () => {
    expect(EXAM_CHANCE_CODES).toEqual(['S1', 'S2', 'EK1', 'EK2', 'HE']);
  });

  it('shows a description for known codes but not for HE', () => {
    const byValue = Object.fromEntries(EXAM_CHANCE_OPTIONS.map((o) => [o.value, o.title]));
    expect(byValue.S1).toBe('S1 — semester 1');
    expect(byValue.EK2).toBe('EK2 — examenkans 2');
    expect(byValue.HE).toBe('HE');
  });
});
