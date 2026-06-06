import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { ProgrammesSeedFile } from '@/domain/types';
import SettingsPage from './SettingsPage.vue';
import { useProgrammesStore } from '@/stores/programmes';
import { useSettingsStore } from '@/stores/settings';

const liveMocks = vi.hoisted(() => ({
  scrapeProgrammesSeed: vi.fn(),
  DEFAULT_OLOD_PROGRESS_ESTIMATE: 400,
}));

vi.mock('@/data/studiegidsLive', () => liveMocks);

function seed(year: '2025-26' | '2026-27'): ProgrammesSeedFile {
  return {
    version: 2,
    generatedAt: '2026-06-06T00:00:00.000Z',
    academicYear: year,
    programmes: [{ id: `programme-${year}`, code: 'PBTIN', name: 'TIN', active: true }],
    seedEntries: [
      {
        id: `seed-${year}`,
        programmeId: `programme-${year}`,
        programmeCode: 'PBTIN',
        label: '42TIN2260 Automation I',
        defaultVaklector: null,
        defaultLecturers: [],
        defaultStartTime: null,
        defaultDurationMinutes: null,
        defaultAllowedResources: null,
        defaultMaxScore: 20,
        active: true,
      },
    ],
  };
}

const vuetifyStubs = {
  VCard: { template: '<section><slot /></section>' },
  VSelect: {
    props: ['modelValue', 'items'],
    emits: ['update:modelValue'],
    template:
      '<select @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.title }}</option></select>',
  },
  VBtn: {
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  },
  VProgressLinear: { template: '<div data-test="progress" />' },
  VAlert: { template: '<div role="alert"><slot /></div>' },
  VTextField: { template: '<input />' },
  VDialog: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VTable: { template: '<table><slot /></table>' },
  VListItem: { template: '<div><slot /></div>' },
  VSpacer: { template: '<span />' },
  RouterLink: { template: '<a><slot /></a>' },
};

describe('SettingsPage studiegids helper loading', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    liveMocks.scrapeProgrammesSeed.mockReset();
  });

  it('loads a live helper year on demand and updates programmes', async () => {
    liveMocks.scrapeProgrammesSeed.mockResolvedValueOnce(seed('2026-27'));
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: vuetifyStubs,
      },
    });
    const programmes = useProgrammesStore();
    const replaceSpy = vi.spyOn(programmes, 'replaceWithSeed');

    await wrapper.find('select').setValue('2026-27');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(liveMocks.scrapeProgrammesSeed).toHaveBeenCalledWith(
      '2026-27',
      expect.objectContaining({ estimatedOlods: 400 }),
    );
    expect(replaceSpy).toHaveBeenCalledWith(expect.objectContaining({ academicYear: '2026-27' }));
  });

  it('falls back to built-in values when live scraping fails', async () => {
    liveMocks.scrapeProgrammesSeed.mockRejectedValueOnce(new Error('CORS blocked'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const programmes = useProgrammesStore();
    vi.spyOn(programmes, 'loadWithFallback').mockImplementation(async () => {
      programmes.replaceWithSeed(seed('2025-26'));
      return '2025-26';
    });
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: vuetifyStubs,
      },
    });
    const settings = useSettingsStore();

    await wrapper.find('select').setValue('2026-27');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(programmes.loadWithFallback).toHaveBeenCalledWith(
      '2025-26',
      '2025-26',
      expect.objectContaining({ force: true }),
    );
    expect(programmes.loadedYear).toBe('2025-26');
    expect(settings.activeSeedYear).toBe('2025-26');
    expect(wrapper.text()).toContain('Live import voor 2026-27 mislukte');
    expect(wrapper.text()).toContain('Oorzaak: CORS blocked');
    expect(wrapper.text()).toContain('Val terug op ingebouwde standaard 2025-26.');
    expect(warnSpy).toHaveBeenCalledWith(
      '[pxl-coverkit] Studiegids live import failed',
      expect.objectContaining({
        requestedYear: '2026-27',
        fallbackYear: '2025-26',
        reason: 'CORS blocked',
      }),
    );
    warnSpy.mockRestore();
  });
});
