import type { AcademicYear } from './types';

const compact = /^(\d{4})-(\d{2})$/;
const verbose = /^(\d{4})-(\d{4})$/;

export interface AcademicYearParts {
  startYear: number;
  endYear: number;
}

export function parseAcademicYear(value: string): AcademicYearParts {
  const compactMatch = compact.exec(value);
  if (compactMatch) {
    const startYear = Number(compactMatch[1]);
    const endTwo = Number(compactMatch[2]);
    const endYear = Math.floor(startYear / 100) * 100 + endTwo;
    const corrected = endYear <= startYear ? endYear + 100 : endYear;
    return { startYear, endYear: corrected };
  }
  const verboseMatch = verbose.exec(value);
  if (verboseMatch) {
    return { startYear: Number(verboseMatch[1]), endYear: Number(verboseMatch[2]) };
  }
  throw new Error(`Onbekend academiejaarformaat: ${value}`);
}

export function nextAcademicYear(current: AcademicYear): AcademicYear {
  const { startYear, endYear } = parseAcademicYear(current);
  if (compact.test(current)) {
    const ny = endYear + 1;
    return `${startYear + 1}-${String(ny).slice(-2).padStart(2, '0')}` as AcademicYear;
  }
  return `${startYear + 1}-${endYear + 1}` as AcademicYear;
}

export function shortAcademicYear(year: AcademicYear): string {
  const { startYear, endYear } = parseAcademicYear(year);
  return `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
}

export function formatAcademicYear(year: AcademicYear): string {
  const { startYear, endYear } = parseAcademicYear(year);
  return `${startYear}-${endYear}`;
}
