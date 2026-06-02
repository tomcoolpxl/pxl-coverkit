import { describe, it, expect } from 'vitest';
import { buildCourseCard, diffOverrides, buildBaselineFor } from './cardFactory';
import type { SeedEntry } from './types';

const seed: SeedEntry = {
  id: 'seed-x',
  programmeId: 'programme-4-pbtin',
  programmeCode: 'PBTIN',
  label: '42TIN2260 Automation I',
  defaultVaklector: null,
  defaultLecturers: ['Tom Cool'],
  defaultStartTime: null,
  defaultDurationMinutes: 120,
  defaultAllowedResources: null,
  defaultMaxScore: 20,
  active: true,
};

const baseFields = {
  programmeCode: 'PBTIN',
  seedEntryId: 'seed-x',
  courseCode: '42TIN2260',
  courseName: 'Automation I',
  academicYear: '2025-26' as const,
  examChance: 'S2',
  language: 'nl' as const,
  examDate: '2026-06-12',
  startTime: '09:00',
  durationMinutes: 120,
  vaklector: 'A. Lector',
  lecturers: ['Tom Cool', 'A. Lector'],
  roomPlaceCode: null,
  maxScore: 20,
  allowedResources: 'Geen',
  templateId: 'template-nl-blackboard-v1',
};

const settings = { defaultMaxScore: 20, defaultDurationMinutes: 90 };

describe('buildCourseCard', () => {
  it('produces a CourseCard with computed endTime and identical timestamps for createdAt/updatedAt', () => {
    const card = buildCourseCard({
      fields: baseFields,
      seedEntry: seed,
      settings,
      now: () => '2026-06-02T10:00:00.000Z',
      id: () => 'card-1',
    });

    expect(card.id).toBe('card-1');
    expect(card.createdAt).toBe('2026-06-02T10:00:00.000Z');
    expect(card.updatedAt).toBe('2026-06-02T10:00:00.000Z');
    expect(card.endTime).toBe('11:00');
    expect(card.source).toBe('seeded');
  });

  it('records overrides for fields that differ from the seed-derived baseline', () => {
    const card = buildCourseCard({
      fields: { ...baseFields, vaklector: 'Override Lector' },
      seedEntry: seed,
      settings,
      now: () => 'now',
      id: () => 'card-2',
    });
    expect(card.overrides).toContain('vaklector');
    // startTime is empty in baseline (seed has none, default is empty) — picking '09:00' is an override.
    expect(card.overrides).toContain('startTime');
    // courseCode and courseName came from seed split so they should NOT be overrides.
    expect(card.overrides).not.toContain('courseCode');
    expect(card.overrides).not.toContain('courseName');
  });

  it('marks source as "manual" when no seed entry is supplied', () => {
    const card = buildCourseCard({
      fields: { ...baseFields, seedEntryId: null },
      seedEntry: null,
      settings,
      now: () => 'now',
      id: () => 'card-3',
    });
    expect(card.source).toBe('manual');
  });

  it('copies the lecturers array (does not share reference)', () => {
    const lecturers = ['A', 'B'];
    const card = buildCourseCard({
      fields: { ...baseFields, lecturers },
      seedEntry: seed,
      settings,
      now: () => 'now',
      id: () => 'card-4',
    });
    lecturers.push('C');
    expect(card.lecturers).toEqual(['A', 'B']);
  });
});

describe('diffOverrides', () => {
  it('detects array changes', () => {
    const baseline = buildBaselineFor(seed, settings);
    const overrides = diffOverrides(
      {
        courseCode: baseline.courseCode,
        courseName: baseline.courseName,
        vaklector: baseline.vaklector,
        lecturers: ['Tom Cool', 'Extra'],
        startTime: baseline.startTime,
        durationMinutes: baseline.durationMinutes,
        allowedResources: baseline.allowedResources,
        maxScore: baseline.maxScore,
      },
      baseline,
    );
    expect(overrides).toEqual(['lecturers']);
  });

  it('returns empty when snapshot matches baseline', () => {
    const baseline = buildBaselineFor(seed, settings);
    const overrides = diffOverrides({ ...baseline }, baseline);
    expect(overrides).toEqual([]);
  });
});
