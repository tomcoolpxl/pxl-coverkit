import { defineStore } from 'pinia';

type WizardStep = 'programme' | 'source' | 'review';

interface WizardState {
  step: WizardStep;
  programmeCode: string | null;
  seedEntryId: string | null;
  manual: boolean;
  dirty: boolean;
}

const INITIAL: WizardState = {
  step: 'programme',
  programmeCode: null,
  seedEntryId: null,
  manual: false,
  dirty: false,
};

export const useWizardStore = defineStore('wizard', {
  state: (): WizardState => ({ ...INITIAL }),
  actions: {
    reset() {
      Object.assign(this, { ...INITIAL });
    },
    setProgramme(code: string) {
      this.programmeCode = code;
      this.dirty = true;
    },
    pickSeed(id: string) {
      this.seedEntryId = id;
      this.manual = false;
      this.dirty = true;
    },
    pickManual() {
      this.seedEntryId = null;
      this.manual = true;
      this.dirty = true;
    },
    goto(step: WizardStep) {
      this.step = step;
    },
  },
  persist: false,
});
