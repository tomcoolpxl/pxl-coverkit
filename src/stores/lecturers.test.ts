import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLecturersStore } from './lecturers';

describe('lecturers store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initially has no lecturers', () => {
    const store = useLecturersStore();
    expect(store.lecturers).toEqual([]);
  });

  it('observes and adds a single lecturer, trimmed and sorted', () => {
    const store = useLecturersStore();
    store.observeLecturer('   Peeters K.   ');
    expect(store.lecturers).toEqual(['Peeters K.']);

    // duplicate is ignored
    store.observeLecturer('Peeters K.');
    expect(store.lecturers).toEqual(['Peeters K.']);

    // another lecturer sorts alphabetically
    store.observeLecturer('Aerts J.');
    expect(store.lecturers).toEqual(['Aerts J.', 'Peeters K.']);
  });

  it('observes and adds multiple lecturers', () => {
    const store = useLecturersStore();
    store.observeLecturers(['Willems S.', '  Aerts J. ', 'Willems S.']);
    expect(store.lecturers).toEqual(['Aerts J.', 'Willems S.']);
  });

  it('replaces all lecturers', () => {
    const store = useLecturersStore();
    store.observeLecturers(['A', 'B']);
    store.replaceAll([' C ', 'A', '   ', 'D']);
    expect(store.lecturers).toEqual(['A', 'C', 'D']);
  });

  it('clears all lecturers', () => {
    const store = useLecturersStore();
    store.observeLecturers(['A', 'B']);
    store.clear();
    expect(store.lecturers).toEqual([]);
  });
});
