import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useWizardStore } from './wizard';

describe('wizard store transitions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts at programme step with no programme selected', () => {
    const wizard = useWizardStore();
    expect(wizard.step).toBe('programme');
    expect(wizard.programmeCode).toBeNull();
    expect(wizard.dirty).toBe(false);
  });

  it('refuses to advance from programme until one is set', () => {
    const wizard = useWizardStore();
    wizard.next();
    expect(wizard.step).toBe('programme');
  });

  it('advances on setProgramme + next, marking dirty', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    expect(wizard.dirty).toBe(true);
    wizard.next();
    expect(wizard.step).toBe('source');
  });

  it('refuses to advance from source until seed or manual is chosen', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.next();
    wizard.next();
    expect(wizard.step).toBe('source');
  });

  it('advances to review after pickSeed', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.next();
    wizard.pickSeed('seed-x');
    wizard.next();
    expect(wizard.step).toBe('review');
    expect(wizard.seedEntryId).toBe('seed-x');
    expect(wizard.manual).toBe(false);
  });

  it('advances to review after pickManual', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.next();
    wizard.pickManual();
    wizard.next();
    expect(wizard.step).toBe('review');
    expect(wizard.manual).toBe(true);
    expect(wizard.seedEntryId).toBeNull();
  });

  it('changing programme clears the seed/manual selection', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.pickSeed('seed-x');
    wizard.setProgramme('GRDVO');
    expect(wizard.seedEntryId).toBeNull();
    expect(wizard.manual).toBe(false);
  });

  it('back() walks the step list and stops at programme', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.next();
    wizard.pickManual();
    wizard.next();
    expect(wizard.step).toBe('review');
    wizard.back();
    expect(wizard.step).toBe('source');
    wizard.back();
    expect(wizard.step).toBe('programme');
    wizard.back();
    expect(wizard.step).toBe('programme');
  });

  it('reset() returns the store to its initial state', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.pickSeed('seed-x');
    wizard.next();
    wizard.reset();
    expect(wizard.step).toBe('programme');
    expect(wizard.programmeCode).toBeNull();
    expect(wizard.seedEntryId).toBeNull();
    expect(wizard.manual).toBe(false);
    expect(wizard.dirty).toBe(false);
  });

  it('markClean() flips the dirty flag without resetting other state', () => {
    const wizard = useWizardStore();
    wizard.setProgramme('PBTIN');
    wizard.markClean();
    expect(wizard.dirty).toBe(false);
    expect(wizard.programmeCode).toBe('PBTIN');
  });
});
