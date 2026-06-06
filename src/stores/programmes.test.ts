import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { AcademicYear, ProgrammesSeedFile } from '@/domain/types';
import { useProgrammesStore } from './programmes';

const seedMocks = vi.hoisted(() => {
  class MockSeedLoadError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SeedLoadError';
    }
  }
  return {
    loadProgrammesSeed: vi.fn(),
    SeedLoadError: MockSeedLoadError,
  };
});

vi.mock('@/data/seed', () => seedMocks);

function makeSeed(year: AcademicYear, suffix: string): ProgrammesSeedFile {
  return {
    version: 1,
    generatedAt: '2026-06-06T00:00:00.000Z',
    academicYear: year,
    programmes: [
      {
        id: `programme-${suffix}`,
        code: `P${suffix}`,
        name: `Programme ${suffix}`,
        active: true,
      },
    ],
    seedEntries: [
      {
        id: `seed-${suffix}`,
        programmeId: `programme-${suffix}`,
        programmeCode: `P${suffix}`,
        label: `42TIN${suffix} Course ${suffix}`,
        defaultVaklector: null,
        defaultLecturers: [],
        defaultStartTime: null,
        defaultDurationMinutes: null,
        defaultAllowedResources: null,
        defaultMaxScore: 20,
        active: true,
      },
    ],
  };
}

describe('programmes store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    seedMocks.loadProgrammesSeed.mockReset();
  });

  it('loads one seed year into the helper data store', async () => {
    seedMocks.loadProgrammesSeed.mockResolvedValueOnce(makeSeed('2025-26', '2526'));
    const programmes = useProgrammesStore();

    await expect(programmes.loadForYear('2025-26')).resolves.toBe(true);

    expect(programmes.loadedYear).toBe('2025-26');
    expect(programmes.programmes).toHaveLength(1);
    expect(programmes.seedEntries[0].id).toBe('seed-2526');
  });

  it('falls back to the built-in year when the requested helper year fails', async () => {
    seedMocks.loadProgrammesSeed
      .mockRejectedValueOnce(new seedMocks.SeedLoadError('Seedbestand voor 2024-25 niet gevonden.'))
      .mockResolvedValueOnce(makeSeed('2025-26', '2526'));
    const programmes = useProgrammesStore();
    const log: string[] = [];

    await expect(
      programmes.loadWithFallback('2024-25', '2025-26', { force: true, log: (line) => log.push(line) }),
    ).resolves.toBe('2025-26');

    expect(programmes.loadedYear).toBe('2025-26');
    expect(programmes.seedEntries[0].id).toBe('seed-2526');
    expect(log.some((line) => line.includes('Val terug op ingebouwde standaard 2025-26'))).toBe(
      true,
    );
  });

  it('keeps existing helper data while a non-fallback year fails', async () => {
    seedMocks.loadProgrammesSeed
      .mockResolvedValueOnce(makeSeed('2025-26', '2526'))
      .mockRejectedValueOnce(new seedMocks.SeedLoadError('Seedbestand voor 2024-25 niet gevonden.'));
    const programmes = useProgrammesStore();

    await programmes.loadForYear('2025-26');
    await expect(
      programmes.loadForYear('2024-25', { force: true, keepPreviousOnError: true }),
    ).resolves.toBe(false);

    expect(programmes.loadedYear).toBe('2025-26');
    expect(programmes.seedEntries[0].id).toBe('seed-2526');
    expect(programmes.error).toContain('2024-25');
  });
});
