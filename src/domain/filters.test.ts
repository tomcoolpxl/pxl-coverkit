import { describe, it, expect } from 'vitest';
import { filterCards, uniqueAcademicYears, uniqueProgrammeCodes } from './filters';
import type { CourseCard } from './types';

function makeCard(overrides: Partial<CourseCard>): CourseCard {
  return {
    id: 'id-' + Math.random().toString(36).slice(2),
    programmeCode: 'PBTIN',
    seedEntryId: null,
    courseCode: '42TIN2260',
    courseName: 'Automation I',
    academicYear: '2025-26',
    examChance: 'S2',
    language: 'nl',
    examDate: '2026-06-12',
    startTime: '09:00',
    durationMinutes: 120,
    endTime: '11:00',
    vaklector: 'A. Lector',
    lecturers: ['Tom Cool'],
    roomPlaceCode: null,
    maxScore: 20,
    allowedResources: 'Geen',
    templateId: 'template-nl-blackboard-v1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastGeneratedAt: null,
    source: 'seeded',
    overrides: [],
    ...overrides,
  };
}

describe('filterCards', () => {
  const cards: CourseCard[] = [
    makeCard({
      programmeCode: 'PBTIN',
      academicYear: '2025-26',
      courseCode: '42TIN2260',
      courseName: 'Automation I',
    }),
    makeCard({
      programmeCode: 'PBTIN',
      academicYear: '2026-27',
      courseCode: '42TIN1370',
      courseName: 'Cloud Essentials',
    }),
    makeCard({
      programmeCode: 'GRDVO',
      academicYear: '2025-26',
      courseCode: '41DVO1010',
      courseName: 'Web Essentials',
    }),
  ];

  it('returns all cards when no criteria are passed', () => {
    expect(filterCards(cards, {}).length).toBe(3);
  });

  it('filters by programme code', () => {
    const r = filterCards(cards, { programmeCode: 'PBTIN' });
    expect(r.length).toBe(2);
    expect(r.every((c) => c.programmeCode === 'PBTIN')).toBe(true);
  });

  it('filters by academic year', () => {
    const r = filterCards(cards, { academicYear: '2025-26' });
    expect(r.length).toBe(2);
  });

  it('combines programme + year filters', () => {
    const r = filterCards(cards, { programmeCode: 'PBTIN', academicYear: '2025-26' });
    expect(r.length).toBe(1);
    expect(r[0].courseCode).toBe('42TIN2260');
  });

  it('matches search against course code (case-insensitive)', () => {
    const r = filterCards(cards, { search: 'cloud' });
    expect(r.length).toBe(1);
    expect(r[0].courseName).toBe('Cloud Essentials');
  });

  it('matches search against course name', () => {
    const r = filterCards(cards, { search: 'Essentials' });
    expect(r.length).toBe(2);
  });

  it('ignores empty strings as no-filter', () => {
    const r = filterCards(cards, {
      programmeCode: '',
      academicYear: null,
      search: '   ',
    });
    expect(r.length).toBe(3);
  });
});

describe('uniqueProgrammeCodes / uniqueAcademicYears', () => {
  const cards: CourseCard[] = [
    makeCard({ programmeCode: 'PBTIN', academicYear: '2025-26' }),
    makeCard({ programmeCode: 'GRDVO', academicYear: '2025-26' }),
    makeCard({ programmeCode: 'PBTIN', academicYear: '2026-27' }),
  ];

  it('returns sorted unique programme codes', () => {
    expect(uniqueProgrammeCodes(cards)).toEqual(['GRDVO', 'PBTIN']);
  });

  it('returns sorted unique academic years', () => {
    expect(uniqueAcademicYears(cards)).toEqual(['2025-26', '2026-27']);
  });
});
