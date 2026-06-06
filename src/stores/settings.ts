import { defineStore } from 'pinia';
import { CURRENT_SCHEMA_VERSION, type AppSettings } from '@/domain/types';

interface SettingsState extends AppSettings {
  schemaVersion: number;
}

const DEFAULTS: SettingsState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  defaultTemplateId: 'template-nl-blackboard-v1',
  defaultMaxScore: 20,
  defaultExamChance: 'S1',
  defaultDurationMinutes: 90,
  userName: '',
  activeSeedYear: null,
};

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({ ...DEFAULTS }),
  actions: {
    replaceWith(settings: AppSettings) {
      this.defaultTemplateId = settings.defaultTemplateId;
      this.defaultMaxScore = settings.defaultMaxScore;
      this.defaultExamChance = settings.defaultExamChance;
      this.defaultDurationMinutes = settings.defaultDurationMinutes;
      this.userName = settings.userName ?? '';
      this.activeSeedYear = settings.activeSeedYear ?? null;
    },
    reset() {
      Object.assign(this, { ...DEFAULTS });
    },
    asExportable(): AppSettings {
      return {
        defaultTemplateId: this.defaultTemplateId,
        defaultMaxScore: this.defaultMaxScore,
        defaultExamChance: this.defaultExamChance,
        defaultDurationMinutes: this.defaultDurationMinutes,
        userName: this.userName,
        activeSeedYear: this.activeSeedYear,
      };
    },
  },
  persist: true,
});
