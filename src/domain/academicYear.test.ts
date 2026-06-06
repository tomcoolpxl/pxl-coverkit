import { describe, it, expect } from 'vitest';
import {
  candidateAcademicYearsForDate,
  currentAcademicYearForDate,
  formatAcademicYear,
  nextAcademicYear,
  parseAcademicYear,
  previousAcademicYear,
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

describe('previousAcademicYear', () => {
  it('moves a compact year back', () => {
    expect(previousAcademicYear('2025-26')).toBe('2024-25');
  });

  it('moves a verbose year back', () => {
    expect(previousAcademicYear('2025-2026')).toBe('2024-2025');
  });
});

describe('currentAcademicYearForDate', () => {
  it('uses the previous calendar year before September 20', () => {
    expect(currentAcademicYearForDate(new Date(2026, 5, 6))).toBe('2025-26');
    expect(currentAcademicYearForDate(new Date(2026, 8, 19))).toBe('2025-26');
  });

  it('rolls over on September 20', () => {
    expect(currentAcademicYearForDate(new Date(2026, 8, 20))).toBe('2026-27');
  });
});

describe('candidateAcademicYearsForDate', () => {
  it('returns only previous, current, and next for the rollover-derived current year', () => {
    expect(candidateAcademicYearsForDate(new Date(2026, 5, 6))).toEqual([
      '2024-25',
      '2025-26',
      '2026-27',
    ]);
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
