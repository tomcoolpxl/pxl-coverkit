import type { AcademicYear } from '@/domain/types';

// The ONLY hardcoded academiejaar in the codebase: tells the seed loader
// which bundled JSON to fetch (`public/data/programmes.seed.<year>.json`).
// Bumped once per year by an explicit maintainer commit.
//
// Everywhere else (overview chip, settings, wizard, new card stamping) reads
// the academic year from the loaded seed file via `useProgrammesStore().loadedYear`,
// so the value visible to the user always reflects the data actually loaded.
export const ACTIVE_SEED_YEAR: AcademicYear = '2025-26';
