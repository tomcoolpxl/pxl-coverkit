import { exportedStateSchema } from '@/domain/schema';
import { CURRENT_SCHEMA_VERSION, type ExportedState } from '@/domain/types';
import { migrateImported } from './migrations';

export class ImportError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'ImportError';
  }
}

export function buildExportPayload(
  state: Omit<ExportedState, 'schemaVersion' | 'exportedAt'>,
  now: Date = new Date(),
): ExportedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    settings: state.settings,
    cards: state.cards,
    lecturers: state.lecturers,
  };
}

export function serializeExport(state: ExportedState): string {
  return JSON.stringify(state, null, 2);
}

export function parseImport(raw: string): ExportedState {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    throw new ImportError('Ongeldig JSON-bestand.', err);
  }
  if (typeof body !== 'object' || body === null || !('schemaVersion' in body)) {
    throw new ImportError('Ontbrekend veld "schemaVersion" in importbestand.');
  }
  const migrated = migrateImported(body as Parameters<typeof migrateImported>[0]);
  const parsed = exportedStateSchema.safeParse(migrated);
  if (!parsed.success) {
    throw new ImportError(
      `Importbestand voldoet niet aan het verwachte formaat: ${parsed.error.issues[0]?.message ?? 'onbekend'}.`,
      parsed.error,
    );
  }
  return parsed.data as ExportedState;
}

export function exportFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `pxl-coverkit-export-${yyyy}${mm}${dd}.json`;
}
