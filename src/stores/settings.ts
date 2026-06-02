import { defineStore } from 'pinia';
import { CURRENT_SCHEMA_VERSION, type AppSettings, type AcademicYear } from '@/domain/types';

interface SettingsState extends AppSettings {
  schemaVersion: number;
}

const DEFAULTS: SettingsState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  activeAcademicYear: '2025-26',
  defaultTemplateId: 'template-nl-blackboard-v1',
  defaultMaxScore: 20,
  defaultExamChance: 'S1',
  defaultDurationMinutes: 120,
};

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({ ...DEFAULTS }),
  actions: {
    setActiveAcademicYear(year: AcademicYear) {
      this.activeAcademicYear = year;
    },
    replaceWith(settings: AppSettings) {
      this.activeAcademicYear = settings.activeAcademicYear;
      this.defaultTemplateId = settings.defaultTemplateId;
      this.defaultMaxScore = settings.defaultMaxScore;
      this.defaultExamChance = settings.defaultExamChance;
      this.defaultDurationMinutes = settings.defaultDurationMinutes;
    },
    reset() {
      Object.assign(this, { ...DEFAULTS });
    },
    asExportable(): AppSettings {
      return {
        activeAcademicYear: this.activeAcademicYear,
        defaultTemplateId: this.defaultTemplateId,
        defaultMaxScore: this.defaultMaxScore,
        defaultExamChance: this.defaultExamChance,
        defaultDurationMinutes: this.defaultDurationMinutes,
      };
    },
  },
  persist: true,
});
