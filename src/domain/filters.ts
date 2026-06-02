import type { AcademicYear, CourseCard } from './types';

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
