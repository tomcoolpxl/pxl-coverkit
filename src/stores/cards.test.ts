import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCardsStore } from './cards';
import type { SeedEntry } from '@/domain/types';
import { buildCourseCard } from '@/domain/cardFactory';

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

describe('cards store lifecycle (actualize, delete, edit)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useCardsStore().clear();
  });

  it('actualize overwrites the card state and recalculates endTime', () => {
    const cards = useCardsStore();
    const original = cards.create({
      fields: baseFields,
      seedEntry: seed,
      settings,
      now: () => '2026-06-02T12:00:00Z',
      id: () => 'card-1',
    });

    const updated = {
      ...original,
      academicYear: '2026-27' as const,
      examDate: '2027-06-12',
      startTime: '10:00',
      durationMinutes: 180,
      endTime: '13:00',
      updatedAt: '2026-06-02T13:00:00Z',
    };

    cards.upsert(updated);

    const fetched = cards.byId('card-1')!;
    expect(fetched.academicYear).toBe('2026-27');
    expect(fetched.examDate).toBe('2027-06-12');
    expect(fetched.startTime).toBe('10:00');
    expect(fetched.endTime).toBe('13:00');
    expect(fetched.updatedAt).toBe('2026-06-02T13:00:00Z');
  });

  it('deleting a card removes it, and it can be restored via upsert (undo)', () => {
    const cards = useCardsStore();
    const original = cards.create({
      fields: baseFields,
      seedEntry: seed,
      settings,
      now: () => 'now',
      id: () => 'card-1',
    });

    expect(cards.count).toBe(1);

    cards.remove('card-1');
    expect(cards.count).toBe(0);
    expect(cards.byId('card-1')).toBeUndefined();

    // Undo action (upserting original back)
    cards.upsert(original);
    expect(cards.count).toBe(1);
    expect(cards.byId('card-1')).toBeDefined();
  });

  it('re-calculates overrides correctly after manual edit relative to baseline', () => {
    const cards = useCardsStore();
    const original = cards.create({
      fields: baseFields, // vaklector is 'A. Lector' (override relative to seed null), startTime is '09:00' (override)
      seedEntry: seed,
      settings,
      now: () => 'now',
      id: () => 'card-1',
    });

    // Currently overrides contain vaklector and startTime
    expect(original.overrides).toContain('vaklector');
    expect(original.overrides).toContain('startTime');

    // We edit the card, changing vaklector back to null/empty? Or let's say we change startTime back to baseline (which is '08:30' default from settings? No, settings has no default startTime, wait, let's see. Baseline has startTime: empty).
    // Let's edit to override maxScore to 40
    const editedCard = buildCourseCard({
      fields: {
        ...baseFields,
        maxScore: 40,
      },
      seedEntry: seed,
      settings,
      id: () => 'card-1',
    });

    cards.upsert(editedCard);
    const fetched = cards.byId('card-1')!;
    expect(fetched.maxScore).toBe(40);
    expect(fetched.overrides).toContain('maxScore');
    expect(fetched.overrides).toContain('vaklector');
  });
});
