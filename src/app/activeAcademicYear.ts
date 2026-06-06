import type { AcademicYear } from '@/domain/types';

// Fallback academiejaar, used only if the static seed index
// (`public/data/programmes.seed.index.json`) can't be loaded at startup.
//
// Normally the app discovers the bundled years and the active year dynamically
// from that index (see App.vue + `useProgrammesStore().setIndex`). The index is
// regenerated together with the seed files, so this constant is just a safety net.
//
// Everywhere else (overview chip, settings, wizard, new card stamping) reads the
// academic year from the loaded seed file via `useProgrammesStore().loadedYear`,
// so the value visible to the user always reflects the data actually loaded.
export const ACTIVE_SEED_YEAR: AcademicYear = '2025-26';
