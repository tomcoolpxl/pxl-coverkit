import { defineStore } from 'pinia';
import { buildCourseCard, type CardFormFields } from '@/domain/cardFactory';
import type { AppSettings, CourseCard, SeedEntry } from '@/domain/types';
import { useLecturersStore } from './lecturers';

interface CardsState {
  cards: CourseCard[];
}

export interface CreateCardInput {
  fields: CardFormFields;
  seedEntry: SeedEntry | null;
  settings: Pick<AppSettings, 'defaultMaxScore' | 'defaultDurationMinutes'>;
  now?: () => string;
  id?: () => string;
}

const MOCK_CARDS: CourseCard[] = [
  {
    id: 'mock-1',
    programmeCode: 'PBTIN',
    seedEntryId: null,
    courseCode: '42TIN1230',
    courseName: 'Web Development Advanced',
    academicYear: '2025-26',
    examChance: 'S1',
    language: 'nl',
    examDate: '2026-01-15',
    startTime: '08:30',
    durationMinutes: 120,
    endTime: '10:30',
    vaklector: 'Janssens P.',
    lecturers: ['Janssens P.', 'Peeters K.'],
    roomPlaceCode: 'B312',
    maxScore: 20,
    allowedResources: 'Gesloten boek',
    templateId: 'PXL-Dig-2425',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastGeneratedAt: null,
    source: 'manual',
    overrides: [],
  },
  {
    id: 'mock-2',
    programmeCode: 'PBTIN',
    seedEntryId: null,
    courseCode: '42TIN4560',
    courseName: 'Databases II',
    academicYear: '2025-26',
    examChance: 'S2',
    language: 'nl',
    examDate: '2026-06-10',
    startTime: '13:00',
    durationMinutes: 90,
    endTime: '14:30',
    vaklector: 'Willems S.',
    lecturers: ['Willems S.'],
    roomPlaceCode: 'A101',
    maxScore: 40,
    allowedResources: 'Geen',
    templateId: 'PXL-Dig-2425',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastGeneratedAt: null,
    source: 'manual',
    overrides: [],
  },
  {
    id: 'mock-3',
    programmeCode: 'PBTIN',
    seedEntryId: null,
    courseCode: '41TIN7890',
    courseName: 'Security Essentials',
    academicYear: '2026-27',
    examChance: 'EK1',
    language: 'nl',
    examDate: '2027-08-20',
    startTime: '09:00',
    durationMinutes: 180,
    endTime: '12:00',
    vaklector: 'Hermans J.',
    lecturers: ['Hermans J.', 'Claes M.', 'Vermeulen T.'],
    roomPlaceCode: 'Sporthal',
    maxScore: 20,
    allowedResources: 'Rekenmachine, Spiekbriefje',
    templateId: 'PXL-Dig-2425',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastGeneratedAt: null,
    source: 'manual',
    overrides: [],
  },
];

export const useCardsStore = defineStore('cards', {
  state: (): CardsState => ({ cards: [...MOCK_CARDS] }),
  getters: {
    count: (state) => state.cards.length,
    byId:
      (state) =>
      (id: string): CourseCard | undefined =>
        state.cards.find((c) => c.id === id),
  },
  actions: {
    replaceAll(next: CourseCard[]) {
      this.cards = next;
    },
    upsert(card: CourseCard) {
      const i = this.cards.findIndex((c) => c.id === card.id);
      if (i === -1) {
        this.cards = [...this.cards, card];
      } else {
        const next = [...this.cards];
        next[i] = card;
        this.cards = next;
      }
      const lecturersStore = useLecturersStore();
      if (card.vaklector) lecturersStore.observeLecturer(card.vaklector);
      if (card.lecturers) lecturersStore.observeLecturers(card.lecturers);
    },
    create(input: CreateCardInput): CourseCard {
      const card = buildCourseCard(input);
      this.cards = [...this.cards, card];
      const lecturersStore = useLecturersStore();
      if (card.vaklector) lecturersStore.observeLecturer(card.vaklector);
      if (card.lecturers) lecturersStore.observeLecturers(card.lecturers);
      return card;
    },
    remove(id: string) {
      this.cards = this.cards.filter((c) => c.id !== id);
    },
    clear() {
      this.cards = [];
    },
  },
  persist: true,
});
