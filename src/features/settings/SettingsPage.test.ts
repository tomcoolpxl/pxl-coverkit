import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import SettingsPage from './SettingsPage.vue';
import { useProgrammesStore } from '@/stores/programmes';
import { useSettingsStore } from '@/stores/settings';

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

function mountWithIndex() {
  const programmes = useProgrammesStore();
  programmes.setIndex({ currentYear: '2025-26', years: ['2024-25', '2025-26', '2026-27'] });
  const wrapper = mount(SettingsPage, { global: { stubs: vuetifyStubs } });
  return { wrapper, programmes };
}

describe('SettingsPage studiegids helper loading', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('lists the bundled years and loads the selected one from the static seed', async () => {
    const { wrapper, programmes } = mountWithIndex();
    const loadSpy = vi.spyOn(programmes, 'loadForYear').mockResolvedValue(true);
    const settings = useSettingsStore();

    expect(wrapper.findAll('option').map((o) => o.text())).toEqual([
      '2024-25 - vorig academiejaar',
      '2025-26 - huidig academiejaar',
      '2026-27 - volgend academiejaar',
    ]);

    await wrapper.find('select').setValue('2026-27');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(loadSpy).toHaveBeenCalledWith('2026-27', { force: true });
    expect(settings.activeSeedYear).toBe('2026-27');
    expect(wrapper.text()).toContain('Studiegidszoekhulp geladen voor 2026-27.');
  });

  it('shows an error when the selected seed cannot be loaded', async () => {
    const { wrapper, programmes } = mountWithIndex();
    vi.spyOn(programmes, 'loadForYear').mockImplementation(async () => {
      programmes.error = 'Seedbestand voor 2026-27 niet gevonden (HTTP 404).';
      return false;
    });

    await wrapper.find('select').setValue('2026-27');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Seedbestand voor 2026-27 niet gevonden (HTTP 404).');
  });
});
