import { examTimeRange } from './examTime';
import {
  buildOverridableDefaults,
  buildOverridableFromSeed,
  type OverridableFields,
} from './overrides';
import type {
  AcademicYear,
  AppSettings,
  CourseCard,
  Language,
  OverrideFieldKey,
  SeedEntry,
} from './types';

export interface CardFormFields {
  programmeCode: string;
  seedEntryId: string | null;
  courseCode: string;
  courseName: string;
  academicYear: AcademicYear;
  examChance: string;
  language: Language;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  vaklector: string;
  lecturers: string[];
  roomPlaceCode: string | null;
  maxScore: number;
  allowedResources: string;
  partsCount?: number;
  partIndex?: number;
  partWeights?: number[];
  templateId: string;
}

export interface BuildCourseCardInput {
  fields: CardFormFields;
  seedEntry: SeedEntry | null;
  settings: Pick<AppSettings, 'defaultMaxScore' | 'defaultDurationMinutes'>;
  now?: () => string;
  id?: () => string;
}

const OVERRIDABLE_KEYS: OverrideFieldKey[] = [
  'courseCode',
  'courseName',
  'vaklector',
  'lecturers',
  'startTime',
  'durationMinutes',
  'allowedResources',
  'maxScore',
];

type OverridableSnapshot = {
  [K in OverrideFieldKey]: OverridableFields[K];
};

function isFieldEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, i) => value === b[i]);
  }
  return a === b;
}

export function diffOverrides(
  current: OverridableSnapshot,
  baseline: OverridableFields,
): OverrideFieldKey[] {
  const changed: OverrideFieldKey[] = [];
  for (const key of OVERRIDABLE_KEYS) {
    if (!isFieldEqual(current[key], baseline[key])) changed.push(key);
  }
  return changed;
}

export function buildBaselineFor(
  seedEntry: SeedEntry | null,
  settings: Pick<AppSettings, 'defaultMaxScore' | 'defaultDurationMinutes'>,
): OverridableFields {
  const defaults = buildOverridableDefaults(settings);
  const seedDerived = seedEntry ? buildOverridableFromSeed(seedEntry) : null;
  return { ...defaults, ...(seedDerived ?? {}) };
}

function defaultIdGenerator(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildCourseCard(input: BuildCourseCardInput): CourseCard {
  const { fields, seedEntry, settings } = input;
  const generatedAt = (input.now ?? (() => new Date().toISOString()))();
  const newId = (input.id ?? defaultIdGenerator)();

  const baseline = buildBaselineFor(seedEntry, settings);
  const snapshot: OverridableSnapshot = {
    courseCode: fields.courseCode,
    courseName: fields.courseName,
    vaklector: fields.vaklector,
    lecturers: fields.lecturers,
    startTime: fields.startTime,
    durationMinutes: fields.durationMinutes,
    allowedResources: fields.allowedResources,
    maxScore: fields.maxScore,
  };
  const overrides = diffOverrides(snapshot, baseline);
  const range = examTimeRange(fields.startTime, fields.durationMinutes);

  return {
    id: newId,
    programmeCode: fields.programmeCode,
    seedEntryId: fields.seedEntryId,
    courseCode: fields.courseCode,
    courseName: fields.courseName,
    academicYear: fields.academicYear,
    examChance: fields.examChance,
    language: fields.language,
    examDate: fields.examDate,
    startTime: range.startTime,
    durationMinutes: range.durationMinutes,
    endTime: range.endTime,
    vaklector: fields.vaklector,
    lecturers: [...fields.lecturers],
    roomPlaceCode: fields.roomPlaceCode,
    maxScore: fields.maxScore,
    allowedResources: fields.allowedResources,
    partsCount: fields.partsCount ?? 1,
    partIndex: fields.partIndex ?? 1,
    partWeights: fields.partWeights ? [...fields.partWeights] : [100],
    templateId: fields.templateId,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    lastGeneratedAt: null,
    source: seedEntry ? 'seeded' : 'manual',
    overrides,
  };
}
