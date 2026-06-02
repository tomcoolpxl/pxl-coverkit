import { defineStore } from 'pinia';
import { buildCourseCard, type CardFormFields } from '@/domain/cardFactory';
import type { AppSettings, CourseCard, SeedEntry } from '@/domain/types';

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

export const useCardsStore = defineStore('cards', {
  state: (): CardsState => ({ cards: [] }),
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
      if (i === -1) this.cards.push(card);
      else this.cards[i] = card;
    },
    create(input: CreateCardInput): CourseCard {
      const card = buildCourseCard(input);
      this.cards.push(card);
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
