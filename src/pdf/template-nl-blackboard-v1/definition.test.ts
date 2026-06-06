import { describe, it, expect } from 'vitest';
import type { CourseCard } from '@/domain/types';
import { renderExamCoverPdfDefinition, formatDuration, formatPartsBreakdown } from './definition';

const seededCard: CourseCard = {
  id: 'seeded-card-id',
  programmeCode: 'PBTIN',
  seedEntryId: 'seed-id',
  courseCode: '42TIN2260',
  courseName: 'Automation I',
  academicYear: '2025-26',
  examChance: 'S2',
  language: 'nl',
  examDate: '2026-06-03',
  startTime: '08:30',
  durationMinutes: 90,
  endTime: '10:00',
  durationTextOverride: null,
  vaklector: 'Tom Cool',
  lecturers: ['Tom Cool'],
  roomPlaceCode: 'B104',
  maxScore: 20,
  allowedResources:
    'Blackboard lockdownbrowser op laptop, documentatie zoals ingesteld/toegestaan via lockdownbrowser, geen papier, enkel examen op laptop, GEEN Internet, GEEN AI tools',
  partsCount: 1,
  partIndex: 1,
  partWeights: [100],
  templateId: 'template-nl-blackboard-v1',
  createdAt: '2026-06-02T12:00:00.000Z',
  updatedAt: '2026-06-02T12:00:00.000Z',
  lastGeneratedAt: null,
  source: 'seeded',
  overrides: [],
};

const manualCard: CourseCard = {
  id: 'manual-card-id',
  programmeCode: 'PBTIN',
  seedEntryId: null,
  courseCode: '42TIN9999',
  courseName: 'Manual Course',
  academicYear: '2025-26',
  examChance: 'S1',
  language: 'nl',
  examDate: '2026-01-13',
  startTime: '13:30',
  durationMinutes: 120,
  endTime: '15:30',
  durationTextOverride: null,
  vaklector: 'Jane Doe',
  lecturers: ['Jane Doe', 'John Smith'],
  roomPlaceCode: null,
  maxScore: 20,
  allowedResources: 'Geen hulpmiddelen toegestaan',
  partsCount: 1,
  partIndex: 1,
  partWeights: [100],
  templateId: 'template-nl-blackboard-v1',
  createdAt: '2026-06-02T12:00:00.000Z',
  updatedAt: '2026-06-02T12:00:00.000Z',
  lastGeneratedAt: null,
  source: 'manual',
  overrides: [],
};

// Two-part exam: title gains "- DEEL 1", Puntenverdeling lists the split, and the
// duration cell reflects the part count.
const multiPartCard: CourseCard = {
  ...seededCard,
  id: 'multipart-card-id',
  partsCount: 2,
  partIndex: 1,
  partWeights: [60, 40],
};

describe('renderExamCoverPdfDefinition', () => {
  it('should render correct pdf definition for a seeded card', () => {
    const definition = renderExamCoverPdfDefinition(seededCard);
    expect(definition).toMatchSnapshot();
  });

  it('should render correct pdf definition for a manual card', () => {
    const definition = renderExamCoverPdfDefinition(manualCard);
    expect(definition).toMatchSnapshot();
  });

  it('should render a multi-part (DEEL) card with title suffix and split breakdown', () => {
    const definition = renderExamCoverPdfDefinition(multiPartCard);
    expect(definition).toMatchSnapshot();
  });
});

describe('formatDuration', () => {
  it('uses "1 deel" for single-part exams', () => {
    expect(formatDuration(120, 1)).toBe('120 minuten (1 deel)');
    expect(formatDuration(120)).toBe('120 minuten (1 deel)');
  });

  it('reflects the part count for multi-part exams', () => {
    expect(formatDuration(90, 2)).toBe('90 minuten (2 delen)');
    expect(formatDuration(150, 3)).toBe('2 uur 30 minuten (3 delen)');
  });
});

describe('formatPartsBreakdown', () => {
  it('keeps the legacy wording for a single part', () => {
    expect(formatPartsBreakdown(seededCard)).toBe('1 deel, 100%');
  });

  it('lists each deel and marks the current one', () => {
    expect(formatPartsBreakdown(multiPartCard)).toBe('Deel 1: 60% (dit deel) · Deel 2: 40%');
  });
});
