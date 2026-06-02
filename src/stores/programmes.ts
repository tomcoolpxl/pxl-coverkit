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
    async loadForYear(year: AcademicYear, opts: { force?: boolean } = {}) {
      if (!opts.force && this.loadedYear === year && this.programmes.length > 0) return;
      this.loading = true;
      this.error = null;
      try {
        const file = await loadProgrammesSeed(year);
        this.programmes = file.programmes;
        this.seedEntries = file.seedEntries;
        this.loadedYear = year;
      } catch (err) {
        const message =
          err instanceof SeedLoadError
            ? err.message
            : 'Onbekende fout bij het laden van seed-data.';
        this.error = message;
        this.programmes = [];
        this.seedEntries = [];
        this.loadedYear = null;
      } finally {
        this.loading = false;
      }
    },
  },
  // Seed data is fetched from public/, not persisted in localStorage.
  persist: false,
});
