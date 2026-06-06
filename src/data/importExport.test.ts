import { describe, it, expect } from 'vitest';
import {
  buildExportPayload,
  exportFilename,
  ImportError,
  parseImport,
  serializeExport,
} from './importExport';
import { CURRENT_SCHEMA_VERSION } from '@/domain/types';

const baseSettings = {
  defaultTemplateId: 'template-nl-blackboard-v1',
  defaultMaxScore: 20,
  defaultExamChance: 'S1',
  defaultDurationMinutes: 120,
  userName: '',
};

describe('buildExportPayload', () => {
  it('stamps schemaVersion and exportedAt', () => {
    const fixed = new Date('2026-06-02T12:00:00Z');
    const out = buildExportPayload({ settings: baseSettings, cards: [] }, fixed);
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(out.exportedAt).toBe('2026-06-02T12:00:00.000Z');
    expect(out.cards).toEqual([]);
  });
});

describe('serializeExport + parseImport roundtrip', () => {
  it('survives a roundtrip on empty state', () => {
    const fixed = new Date('2026-06-02T12:00:00Z');
    const payload = buildExportPayload({ settings: baseSettings, cards: [] }, fixed);
    const json = serializeExport(payload);
    const back = parseImport(json);
    expect(back).toEqual(payload);
  });
});

describe('parseImport rejects bad input', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseImport('not json')).toThrow(ImportError);
  });

  it('rejects missing schemaVersion', () => {
    expect(() => parseImport('{"foo":1}')).toThrow(ImportError);
  });

  it('rejects unknown schemaVersion', () => {
    const evilJson = JSON.stringify({
      schemaVersion: 999,
      exportedAt: '2026-06-02T00:00:00Z',
      settings: baseSettings,
      cards: [],
    });
    expect(() => parseImport(evilJson)).toThrow();
  });
});

describe('exportFilename', () => {
  it('uses YYYYMMDD', () => {
    expect(exportFilename(new Date('2026-06-02T12:34:56Z'))).toMatch(
      /^pxl-coverkit-export-2026\d{4}\.json$/,
    );
  });
});
