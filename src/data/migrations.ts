import type { ExportedState } from '@/domain/types';
import { CURRENT_SCHEMA_VERSION } from '@/domain/types';

export type RawImported =
  | ExportedState
  | (Omit<ExportedState, 'schemaVersion'> & { schemaVersion: number });

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

export function migrateImported(state: RawImported): ExportedState {
  if (state.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return state as ExportedState;
  }
  throw new MigrationError(
    `Geïmporteerde data heeft schemaversie ${state.schemaVersion}, verwacht ${CURRENT_SCHEMA_VERSION}.`,
  );
}
