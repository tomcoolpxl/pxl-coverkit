import { defineStore } from 'pinia';

interface LecturersState {
  lecturers: string[];
}

export const useLecturersStore = defineStore('lecturers', {
  state: (): LecturersState => ({
    lecturers: [],
  }),
  actions: {
    observeLecturer(name: string) {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!this.lecturers.includes(trimmed)) {
        this.lecturers.push(trimmed);
        this.lecturers.sort((a, b) => a.localeCompare(b));
      }
    },
    observeLecturers(names: string[]) {
      let changed = false;
      for (const name of names) {
        const trimmed = name.trim();
        if (trimmed && !this.lecturers.includes(trimmed)) {
          this.lecturers.push(trimmed);
          changed = true;
        }
      }
      if (changed) {
        this.lecturers.sort((a, b) => a.localeCompare(b));
      }
    },
    replaceAll(names: string[]) {
      const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
      this.lecturers = unique.sort((a, b) => a.localeCompare(b));
    },
    clear() {
      this.lecturers = [];
    },
  },
  persist: true,
});
