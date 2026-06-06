import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSeedIndex, SeedLoadError } from './seed';

function mockFetchJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as unknown as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadSeedIndex', () => {
  it('parses a valid seed index', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        version: 1,
        currentYear: '2025-26',
        years: ['2024-25', '2025-26', '2026-27'],
      }),
    );

    const index = await loadSeedIndex();
    expect(index.currentYear).toBe('2025-26');
    expect(index.years).toEqual(['2024-25', '2025-26', '2026-27']);
  });

  it('throws SeedLoadError on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetchJson(null, false, 404));
    await expect(loadSeedIndex()).rejects.toBeInstanceOf(SeedLoadError);
  });

  it('throws SeedLoadError when the shape is invalid', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ version: 1, years: [] }));
    await expect(loadSeedIndex()).rejects.toBeInstanceOf(SeedLoadError);
  });
});
