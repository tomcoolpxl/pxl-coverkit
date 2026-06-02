import { programmesSeedFileSchema } from '@/domain/schema';
import type { ProgrammesSeedFile, AcademicYear } from '@/domain/types';

const base = import.meta.env.BASE_URL ?? '/';

function seedUrl(year: AcademicYear): string {
  const trimmed = base.endsWith('/') ? base : `${base}/`;
  return `${trimmed}data/programmes.seed.${year}.json`;
}

export class SeedLoadError extends Error {
  constructor(message: string, readonly cause?: unknown) {
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
