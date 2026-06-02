import { describe, it, expect } from 'vitest';
import type { CourseCard } from '@/domain/types';
import { renderExamCoverPdfDefinition } from './definition';

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
  vaklector: 'Tom Cool',
  lecturers: ['Tom Cool'],
  roomPlaceCode: 'B104',
  maxScore: 20,
  allowedResources:
    'Blackboard lockdownbrowser op laptop, documentatie zoals ingesteld/toegestaan via lockdownbrowser, geen papier, enkel examen op laptop, GEEN Internet, GEEN AI tools',
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
  vaklector: 'Jane Doe',
  lecturers: ['Jane Doe', 'John Smith'],
  roomPlaceCode: null,
  maxScore: 20,
  allowedResources: 'Geen hulpmiddelen toegestaan',
  templateId: 'template-nl-blackboard-v1',
  createdAt: '2026-06-02T12:00:00.000Z',
  updatedAt: '2026-06-02T12:00:00.000Z',
  lastGeneratedAt: null,
  source: 'manual',
  overrides: [],
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
});
