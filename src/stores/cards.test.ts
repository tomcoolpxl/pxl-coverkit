import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCardsStore } from './cards';
import type { SeedEntry } from '@/domain/types';

const seed: SeedEntry = {
  id: 'seed-x',
  programmeId: 'programme-4-pbtin',
  programmeCode: 'PBTIN',
  label: '42TIN2260 Automation I',
  defaultVaklector: null,
  defaultLecturers: ['Tom Cool'],
  defaultStartTime: null,
  defaultDurationMinutes: 120,
  defaultAllowedResources: null,
  defaultMaxScore: 20,
  active: true,
};

const baseFields = {
  programmeCode: 'PBTIN',
  seedEntryId: 'seed-x',
  courseCode: '42TIN2260',
  courseName: 'Automation I',
  academicYear: '2025-26' as const,
  examChance: 'S2',
  language: 'nl' as const,
  examDate: '2026-06-12',
  startTime: '09:00',
  durationMinutes: 120,
  vaklector: 'A. Lector',
  lecturers: ['Tom Cool', 'A. Lector'],
  roomPlaceCode: null,
  maxScore: 20,
  allowedResources: 'Geen',
  templateId: 'template-nl-blackboard-v1',
};

const settings = { defaultMaxScore: 20, defaultDurationMinutes: 90 };

describe('cards store create()', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useCardsStore().clear();
  });

  it('appends a new card and returns it', () => {
    const cards = useCardsStore();
    const card = cards.create({
      fields: baseFields,
      seedEntry: seed,
      settings,
      now: () => 'now',
      id: () => 'card-1',
    });
    expect(cards.count).toBe(1);
    expect(card.id).toBe('card-1');
    expect(card.source).toBe('seeded');
  });

  it('tracks override fields after a manual edit relative to seed baseline', () => {
    const cards = useCardsStore();
    cards.create({
      fields: { ...baseFields, vaklector: 'Override Lector' },
      seedEntry: seed,
      settings,
      now: () => 'now',
      id: () => 'card-1',
    });
    const card = cards.byId('card-1');
    expect(card?.overrides).toContain('vaklector');
  });

  it('manual card has source "manual" and overrides reflect non-default fields', () => {
    const cards = useCardsStore();
    cards.create({
      fields: { ...baseFields, seedEntryId: null, courseCode: 'NEW123', courseName: 'New Manual' },
      seedEntry: null,
      settings,
      now: () => 'now',
      id: () => 'manual-1',
    });
    const card = cards.byId('manual-1');
    expect(card?.source).toBe('manual');
    expect(card?.overrides).toContain('courseCode');
    expect(card?.overrides).toContain('courseName');
  });
});
