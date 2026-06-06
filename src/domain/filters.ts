import type { AcademicYear, CourseCard, Programme } from './types';

// Preferred display order for programmes in the wizard. Codes not listed here are
// appended after these, sorted alphabetically by name. Listed codes that are
// absent from the seed are simply skipped, so this stays robust across seeds.
export const PROGRAMME_PRIORITY: readonly string[] = [
  'PBTIN',
  'PBTIW',
  'GRSNE',
  'GRPRO',
  'GRDVO',
];

export function sortProgrammesByPriority<T extends Pick<Programme, 'code' | 'name'>>(
  programmes: readonly T[],
): T[] {
  const priorityIndex = (code: string) => {
    const i = PROGRAMME_PRIORITY.indexOf(code);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  return [...programmes].sort((a, b) => {
    const ai = priorityIndex(a.code);
    const bi = priorityIndex(b.code);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

export interface CardFilterCriteria {
  programmeCode?: string | null;
  academicYear?: AcademicYear | null;
  search?: string | null;
}

export function filterCards(cards: CourseCard[], criteria: CardFilterCriteria): CourseCard[] {
  const programmeCode = criteria.programmeCode?.trim() || null;
  const academicYear = criteria.academicYear?.trim() || null;
  const search = criteria.search?.trim().toLowerCase() || null;

  return cards.filter((card) => {
    if (programmeCode && card.programmeCode !== programmeCode) return false;
    if (academicYear && card.academicYear !== academicYear) return false;
    if (search) {
      const haystack = `${card.courseCode} ${card.courseName}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function uniqueProgrammeCodes(cards: CourseCard[]): string[] {
  return Array.from(new Set(cards.map((c) => c.programmeCode))).sort();
}

export function uniqueAcademicYears(cards: CourseCard[]): AcademicYear[] {
  return Array.from(new Set(cards.map((c) => c.academicYear))).sort();
}
