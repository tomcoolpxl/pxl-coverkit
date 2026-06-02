import type { CourseCard, OverrideFieldKey, SeedEntry, AppSettings } from './types';

export type OverridableFields = Pick<
  CourseCard,
  | 'courseCode'
  | 'courseName'
  | 'vaklector'
  | 'lecturers'
  | 'startTime'
  | 'durationMinutes'
  | 'allowedResources'
  | 'maxScore'
>;

export function splitSeedLabel(label: string): { courseCode: string; courseName: string } {
  const trimmed = label.trim();
  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) {
    return { courseCode: trimmed, courseName: '' };
  }
  return {
    courseCode: trimmed.slice(0, firstSpace),
    courseName: trimmed.slice(firstSpace + 1).trim(),
  };
}

export function buildOverridableDefaults(
  settings: Pick<AppSettings, 'defaultMaxScore' | 'defaultDurationMinutes'>,
): OverridableFields {
  return {
    courseCode: '',
    courseName: '',
    vaklector: '',
    lecturers: [],
    startTime: '',
    durationMinutes: settings.defaultDurationMinutes,
    allowedResources: '',
    maxScore: settings.defaultMaxScore,
  };
}

export function buildOverridableFromSeed(seed: SeedEntry): Partial<OverridableFields> {
  const { courseCode, courseName } = splitSeedLabel(seed.label);
  const next: Partial<OverridableFields> = { courseCode, courseName };
  if (seed.defaultVaklector !== null) next.vaklector = seed.defaultVaklector;
  if (seed.defaultLecturers.length > 0) next.lecturers = [...seed.defaultLecturers];
  if (seed.defaultStartTime !== null) next.startTime = seed.defaultStartTime;
  if (seed.defaultDurationMinutes !== null) next.durationMinutes = seed.defaultDurationMinutes;
  if (seed.defaultAllowedResources !== null) next.allowedResources = seed.defaultAllowedResources;
  next.maxScore = seed.defaultMaxScore;
  return next;
}

export function mergeOverridable(
  defaults: OverridableFields,
  seed: Partial<OverridableFields> | null,
  overrides: Partial<OverridableFields>,
  overrideKeys: OverrideFieldKey[],
): OverridableFields {
  const keySet = new Set(overrideKeys);
  const merged: OverridableFields = { ...defaults, ...(seed ?? {}) };
  for (const key of keySet) {
    const override = overrides[key];
    if (override !== undefined) {
      (merged as Record<string, unknown>)[key] = override;
    }
  }
  return merged;
}
