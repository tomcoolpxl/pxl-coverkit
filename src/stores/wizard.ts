import { defineStore } from 'pinia';
import type { CardFormFields } from '@/domain/cardFactory';
import type { AcademicYear, Language } from '@/domain/types';

export type WizardStep = 'programme' | 'source' | 'review';

export interface WizardDraft {
  courseCode: string;
  courseName: string;
  examChance: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  vaklector: string;
  lecturers: string[];
  allowedResources: string;
  maxScore: number;
  partsCount: number;
  partIndex: number;
  partWeights: number[];
  roomPlaceCode: string;
  templateId: string;
  language: Language;
}

interface WizardState {
  step: WizardStep;
  programmeCode: string | null;
  seedEntryId: string | null;
  manual: boolean;
  dirty: boolean;
  draft: WizardDraft | null;
}

const INITIAL: WizardState = {
  step: 'programme',
  programmeCode: null,
  seedEntryId: null,
  manual: false,
  dirty: false,
  draft: null,
};

const STEP_ORDER: WizardStep[] = ['programme', 'source', 'review'];

export const useWizardStore = defineStore('wizard', {
  state: (): WizardState => ({ ...INITIAL }),
  getters: {
    sourceSelected: (state) => state.manual || state.seedEntryId !== null,
    canAdvanceFromProgramme: (state) => state.programmeCode !== null,
    canAdvanceFromSource: (state) => state.manual || state.seedEntryId !== null,
    canGotoStep: (state) => (target: WizardStep) => {
      if (target === 'programme') return true;
      if (target === 'source') return state.programmeCode !== null;
      if (target === 'review') {
        return state.programmeCode !== null && (state.manual || state.seedEntryId !== null);
      }
      return false;
    },
  },
  actions: {
    reset() {
      this.step = INITIAL.step;
      this.programmeCode = INITIAL.programmeCode;
      this.seedEntryId = INITIAL.seedEntryId;
      this.manual = INITIAL.manual;
      this.dirty = INITIAL.dirty;
      this.draft = null;
    },
    setProgramme(code: string) {
      if (this.programmeCode !== code) {
        this.seedEntryId = null;
        this.manual = false;
        this.draft = null;
      }
      this.programmeCode = code;
      this.dirty = true;
    },
    pickSeed(id: string) {
      this.seedEntryId = id;
      this.manual = false;
      this.draft = null;
      this.dirty = true;
    },
    pickManual() {
      this.seedEntryId = null;
      this.manual = true;
      this.draft = null;
      this.dirty = true;
    },
    goto(step: WizardStep) {
      this.step = step;
    },
    next() {
      const idx = STEP_ORDER.indexOf(this.step);
      if (idx === -1 || idx === STEP_ORDER.length - 1) return;
      if (this.step === 'programme' && !this.canAdvanceFromProgramme) return;
      if (this.step === 'source' && !this.canAdvanceFromSource) return;
      this.step = STEP_ORDER[idx + 1];
    },
    back() {
      const idx = STEP_ORDER.indexOf(this.step);
      if (idx <= 0) return;
      this.step = STEP_ORDER[idx - 1];
    },
    saveDraft(draft: WizardDraft) {
      this.draft = {
        ...draft,
        lecturers: [...draft.lecturers],
        partWeights: [...draft.partWeights],
      };
      this.dirty = true;
    },
    markDirty() {
      this.dirty = true;
    },
    markClean() {
      this.dirty = false;
    },
  },
  persist: false,
});

export function draftToFormFields(
  draft: WizardDraft,
  programmeCode: string,
  seedEntryId: string | null,
  academicYear: AcademicYear,
): CardFormFields {
  return {
    programmeCode,
    seedEntryId,
    courseCode: draft.courseCode,
    courseName: draft.courseName,
    academicYear,
    examChance: draft.examChance,
    language: draft.language,
    examDate: draft.examDate,
    startTime: draft.startTime,
    durationMinutes: draft.durationMinutes,
    vaklector: draft.vaklector,
    lecturers: [...draft.lecturers],
    roomPlaceCode: draft.roomPlaceCode ? draft.roomPlaceCode : null,
    maxScore: draft.maxScore,
    allowedResources: draft.allowedResources,
    partsCount: draft.partsCount,
    partIndex: draft.partIndex,
    partWeights: [...draft.partWeights],
    templateId: draft.templateId,
  };
}
