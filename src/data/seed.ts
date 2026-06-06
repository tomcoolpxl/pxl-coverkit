import { programmesSeedFileSchema, seedIndexSchema } from '@/domain/schema';
import type { ProgrammesSeedFile, AcademicYear } from '@/domain/types';

const base = import.meta.env.BASE_URL ?? '/';

function dataUrl(file: string): string {
  const trimmed = base.endsWith('/') ? base : `${base}/`;
  return `${trimmed}data/${file}`;
}

export function seedUrl(year: AcademicYear): string {
  return dataUrl(`programmes.seed.${year}.json`);
}

export function seedIndexUrl(): string {
  return dataUrl('programmes.seed.index.json');
}

export interface SeedIndex {
  currentYear: AcademicYear;
  years: AcademicYear[];
}

export class SeedLoadError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SeedLoadError';
  }
}

export async function loadProgrammesSeed(year: AcademicYear): Promise<ProgrammesSeedFile> {
  const url = seedUrl(year);
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (err) {
    throw new SeedLoadError(`Kon seedbestand niet ophalen voor ${year}.`, err);
  }
  if (!response.ok) {
    throw new SeedLoadError(`Seedbestand voor ${year} niet gevonden (HTTP ${response.status}).`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    throw new SeedLoadError(`Seedbestand voor ${year} bevat geen geldige JSON.`, err);
  }
  const parsed = programmesSeedFileSchema.safeParse(body);
  if (!parsed.success) {
    throw new SeedLoadError(
      `Seedbestand voor ${year} voldoet niet aan het verwachte formaat.`,
      parsed.error,
    );
  }
  return parsed.data as ProgrammesSeedFile;
}

export async function loadSeedIndex(): Promise<SeedIndex> {
  const url = seedIndexUrl();
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (err) {
    throw new SeedLoadError('Kon de studiegids-index niet ophalen.', err);
  }
  if (!response.ok) {
    throw new SeedLoadError(`Studiegids-index niet gevonden (HTTP ${response.status}).`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    throw new SeedLoadError('Studiegids-index bevat geen geldige JSON.', err);
  }
  const parsed = seedIndexSchema.safeParse(body);
  if (!parsed.success) {
    throw new SeedLoadError('Studiegids-index voldoet niet aan het verwachte formaat.', parsed.error);
  }
  return {
    currentYear: parsed.data.currentYear as AcademicYear,
    years: parsed.data.years as AcademicYear[],
  };
}
