import { describe, it, expect } from 'vitest';
import { migrateImported, MigrationError, type RawImported } from './migrations';
import { CURRENT_SCHEMA_VERSION, type ExportedState } from '@/domain/types';

const mockState: ExportedState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  exportedAt: '2026-06-02T12:00:00Z',
  settings: {
    defaultTemplateId: 'template-nl-blackboard-v1',
    defaultMaxScore: 20,
    defaultExamChance: 'S1',
    defaultDurationMinutes: 120,
    userName: '',
    activeSeedYear: null,
  },
  cards: [],
  lecturers: [],
};

describe('migrations.ts', () => {
  it('should pass through state with current schema version', () => {
    const result = migrateImported(mockState);
    expect(result).toEqual(mockState);
  });

  it('should throw MigrationError on future or unsupported schema version', () => {
    const badState = { ...mockState, schemaVersion: 999 };
    expect(() => migrateImported(badState as RawImported)).toThrow(MigrationError);
    expect(() => migrateImported(badState as RawImported)).toThrow(
      `Geïmporteerde data heeft schemaversie 999, verwacht ${CURRENT_SCHEMA_VERSION}.`
    );
  });
});
