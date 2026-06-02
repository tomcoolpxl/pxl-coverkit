import { describe, it, expect } from 'vitest';
import {
  academicYearSchema,
  appSettingsSchema,
  courseCardSchema,
  exportedStateSchema,
  programmeSchema,
  programmesSeedFileSchema,
  seedEntrySchema,
} from './schema';
import { CURRENT_SCHEMA_VERSION } from './types';

describe('academicYearSchema', () => {
  it('accepts both forms', () => {
    expect(academicYearSchema.safeParse('2025-26').success).toBe(true);
    expect(academicYearSchema.safeParse('2025-2026').success).toBe(true);
  });

  it('rejects garbage', () => {
    expect(academicYearSchema.safeParse('25-26').success).toBe(false);
    expect(academicYearSchema.safeParse('abc').success).toBe(false);
  });
});

describe('programmeSchema and seedEntrySchema', () => {
  it('accepts minimum-valid programme', () => {
    const ok = programmeSchema.safeParse({
      id: 'programme-4-pbtin',
      code: 'PBTIN',
      name: 'Professionele bachelor in de toegepaste informatica',
      active: true,
    });
    expect(ok.success).toBe(true);
  });

  it('accepts a seed entry shaped like the studiegids output', () => {
    const ok = seedEntrySchema.safeParse({
      id: 'seed-pbtin-42tin2260-x',
      programmeId: 'programme-4-pbtin',
      programmeCode: 'PBTIN',
      label: '42TIN2260 Automation I',
      defaultVaklector: null,
      defaultLecturers: [],
      defaultStartTime: null,
      defaultDurationMinutes: null,
      defaultAllowedResources: null,
      defaultMaxScore: 20,
      active: true,
    });
    expect(ok.success).toBe(true);
  });
});

describe('programmesSeedFileSchema', () => {
  it('accepts a v2 file', () => {
    const ok = programmesSeedFileSchema.safeParse({
      version: 2,
      generatedAt: '2026-06-02T15:08:08.222107+00:00',
      academicYear: '2025-26',
      source: { type: 'studiegids' },
      programmes: [{ id: 'programme-4-pbtin', code: 'PBTIN', name: 'PBTIN', active: true }],
      seedEntries: [],
    });
    expect(ok.success).toBe(true);
  });
});

describe('courseCardSchema validation messages', () => {
  it('flags every required field on an empty card', () => {
    const result = courseCardSchema.safeParse({
      id: 'card-1',
      programmeCode: '',
      seedEntryId: null,
      courseCode: '',
      courseName: '',
      academicYear: '2025-26',
      examChance: '',
      language: 'nl',
      examDate: '',
      startTime: '',
      durationMinutes: 0,
      endTime: null,
      vaklector: '',
      lecturers: [],
      roomPlaceCode: null,
      maxScore: 0,
      allowedResources: '',
      templateId: '',
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: '2026-06-02T00:00:00Z',
      lastGeneratedAt: null,
      source: 'manual',
      overrides: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Opleiding is verplicht.');
      expect(messages).toContain('Vakcode is verplicht.');
      expect(messages).toContain('Vaknaam is verplicht.');
      expect(messages).toContain('Examenkans is verplicht.');
      expect(messages).toContain('Examendatum is verplicht.');
      expect(messages).toContain('Starttijd is verplicht.');
      expect(messages).toContain('Vaklector is verplicht.');
      expect(messages).toContain('Minstens één lector is verplicht.');
    }
  });
});

describe('appSettingsSchema + exportedStateSchema', () => {
  it('roundtrips an empty export', () => {
    const settings = {
      defaultTemplateId: 'template-nl-blackboard-v1',
      defaultMaxScore: 20,
      defaultExamChance: 'S1',
      defaultDurationMinutes: 120,
    };
    expect(appSettingsSchema.safeParse(settings).success).toBe(true);
    const exported = exportedStateSchema.safeParse({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: '2026-06-02T00:00:00Z',
      settings,
      cards: [],
    });
    expect(exported.success).toBe(true);
  });

  it('rejects mismatched schemaVersion', () => {
    const bad = exportedStateSchema.safeParse({
      schemaVersion: 999,
      exportedAt: '2026-06-02T00:00:00Z',
      settings: {
        defaultTemplateId: 't',
        defaultMaxScore: 20,
        defaultExamChance: 'S1',
        defaultDurationMinutes: 120,
      },
      cards: [],
    });
    expect(bad.success).toBe(false);
  });
});
