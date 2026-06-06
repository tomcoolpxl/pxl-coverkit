import { defineStore } from 'pinia';
import { loadProgrammesSeed, SeedLoadError } from '@/data/seed';
import type { AcademicYear, Programme, SeedEntry } from '@/domain/types';

interface ProgrammesState {
  loadedYear: AcademicYear | null;
  programmes: Programme[];
  seedEntries: SeedEntry[];
  loading: boolean;
  error: string | null;
}

export const useProgrammesStore = defineStore('programmes', {
  state: (): ProgrammesState => ({
    loadedYear: null,
    programmes: [],
    seedEntries: [],
    loading: false,
    error: null,
  }),
  getters: {
    activeProgrammes: (state) => state.programmes.filter((p) => p.active),
    seedEntriesByProgramme: (state) => {
      const map = new Map<string, SeedEntry[]>();
      for (const entry of state.seedEntries) {
        const list = map.get(entry.programmeCode) ?? [];
        list.push(entry);
        map.set(entry.programmeCode, list);
      }
      return map;
    },
  },
  actions: {
    async loadForYear(
      year: AcademicYear,
      opts: { force?: boolean; keepPreviousOnError?: boolean } = {},
    ): Promise<boolean> {
      if (!opts.force && this.loadedYear === year && this.programmes.length > 0) return true;
      this.loading = true;
      this.error = null;
      try {
        const file = await loadProgrammesSeed(year);
        this.programmes = file.programmes;
        this.seedEntries = file.seedEntries;
        this.loadedYear = year;
        return true;
      } catch (err) {
        const message =
          err instanceof SeedLoadError
            ? err.message
            : 'Onbekende fout bij het laden van seed-data.';
        this.error = message;
        if (!opts.keepPreviousOnError) {
          this.programmes = [];
          this.seedEntries = [];
          this.loadedYear = null;
        }
        return false;
      } finally {
        this.loading = false;
      }
    },
    async loadWithFallback(
      year: AcademicYear,
      fallbackYear: AcademicYear,
      opts: { force?: boolean; log?: (message: string) => void } = {},
    ): Promise<AcademicYear | null> {
      opts.log?.(`Seed ${year} laden...`);
      const loaded = await this.loadForYear(year, {
        force: opts.force,
        keepPreviousOnError: year !== fallbackYear,
      });
      if (loaded) {
        opts.log?.(
          `Seed ${year} geladen: ${this.programmes.length} opleiding(en), ${this.seedEntries.length} OLOD(s).`,
        );
        return year;
      }

      opts.log?.(this.error ?? `Seed ${year} kon niet geladen worden.`);
      if (year === fallbackYear) return null;

      opts.log?.(`Val terug op ingebouwde standaard ${fallbackYear}.`);
      const fallbackLoaded = await this.loadForYear(fallbackYear, {
        force: true,
        keepPreviousOnError: false,
      });
      if (!fallbackLoaded) {
        opts.log?.(this.error ?? `Ingebouwde standaard ${fallbackYear} kon niet geladen worden.`);
        return null;
      }
      opts.log?.(
        `Seed ${fallbackYear} geladen: ${this.programmes.length} opleiding(en), ${this.seedEntries.length} OLOD(s).`,
      );
      return fallbackYear;
    },
  },
  // Seed data is fetched from public/, not persisted in localStorage.
  persist: false,
});
