import { describe, it, expect } from 'vitest';
import {
  formatAcademicYear,
  nextAcademicYear,
  parseAcademicYear,
  shortAcademicYear,
} from './academicYear';

describe('parseAcademicYear', () => {
  it('parses compact YYYY-YY form', () => {
    expect(parseAcademicYear('2025-26')).toEqual({ startYear: 2025, endYear: 2026 });
  });

  it('handles century rollover in compact form', () => {
    expect(parseAcademicYear('2099-00')).toEqual({ startYear: 2099, endYear: 2100 });
  });

  it('parses verbose YYYY-YYYY form', () => {
    expect(parseAcademicYear('2025-2026')).toEqual({ startYear: 2025, endYear: 2026 });
  });

  it('rejects garbage', () => {
    expect(() => parseAcademicYear('abc')).toThrow();
    expect(() => parseAcademicYear('25-26')).toThrow();
  });
});

describe('nextAcademicYear', () => {
  it('bumps a compact year', () => {
    expect(nextAcademicYear('2025-26')).toBe('2026-27');
  });

  it('bumps a verbose year', () => {
    expect(nextAcademicYear('2025-2026')).toBe('2026-2027');
  });
});

describe('shortAcademicYear', () => {
  it('returns four-digit short form', () => {
    expect(shortAcademicYear('2025-26')).toBe('2526');
    expect(shortAcademicYear('2025-2026')).toBe('2526');
  });
});

describe('formatAcademicYear', () => {
  it('normalises to verbose form', () => {
    expect(formatAcademicYear('2025-26')).toBe('2025-2026');
  });
});
