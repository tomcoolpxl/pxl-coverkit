import { describe, it, expect } from 'vitest';
import {
  buildOverridableDefaults,
  buildOverridableFromSeed,
  mergeOverridable,
  splitSeedLabel,
  type OverridableFields,
} from './overrides';
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

describe('splitSeedLabel', () => {
  it('splits "<code> <name>" labels', () => {
    expect(splitSeedLabel('42TIN2260 Automation I')).toEqual({
      courseCode: '42TIN2260',
      courseName: 'Automation I',
    });
  });

  it('handles labels with no space', () => {
    expect(splitSeedLabel('CODE-ONLY')).toEqual({
      courseCode: 'CODE-ONLY',
      courseName: '',
    });
  });
});

describe('buildOverridableFromSeed', () => {
  it('uses seed defaults when present, else stays empty', () => {
    const derived = buildOverridableFromSeed(seed);
    expect(derived.courseCode).toBe('42TIN2260');
    expect(derived.courseName).toBe('Automation I');
    expect(derived.lecturers).toEqual(['Tom Cool']);
    expect(derived.durationMinutes).toBe(120);
    expect(derived.maxScore).toBe(20);
    // null seed values do not populate the override
    expect(derived.vaklector).toBeUndefined();
    expect(derived.startTime).toBeUndefined();
    expect(derived.allowedResources).toBeUndefined();
  });
});

describe('mergeOverridable precedence', () => {
  const defaults: OverridableFields = buildOverridableDefaults({
    defaultMaxScore: 20,
    defaultDurationMinutes: 90,
  });

  it('seed wins over defaults; overrides win over seed', () => {
    const seedDerived = buildOverridableFromSeed(seed);
    const merged = mergeOverridable(defaults, seedDerived, { vaklector: 'Override Lector' }, [
      'vaklector',
    ]);
    expect(merged.durationMinutes).toBe(120); // from seed
    expect(merged.vaklector).toBe('Override Lector'); // overridden
    expect(merged.courseName).toBe('Automation I'); // from seed
  });

  it('overrides ignored when key not in overrides list (defends against stale state)', () => {
    const seedDerived = buildOverridableFromSeed(seed);
    const merged = mergeOverridable(
      defaults,
      seedDerived,
      { vaklector: 'Stale Override' },
      [], // no overrides tracked
    );
    expect(merged.vaklector).toBe(''); // back to defaults
  });

  it('manual card (no seed) returns defaults plus overrides', () => {
    const merged = mergeOverridable(
      defaults,
      null,
      { courseCode: 'NEW123', courseName: 'Manual Cover' },
      ['courseCode', 'courseName'],
    );
    expect(merged.courseCode).toBe('NEW123');
    expect(merged.courseName).toBe('Manual Cover');
    expect(merged.maxScore).toBe(20);
  });
});

describe('buildOverridableDefaults', () => {
  it('reflects settings', () => {
    const out = buildOverridableDefaults({ defaultMaxScore: 25, defaultDurationMinutes: 60 });
    expect(out.maxScore).toBe(25);
    expect(out.durationMinutes).toBe(60);
    expect(out.lecturers).toEqual([]);
  });
});
