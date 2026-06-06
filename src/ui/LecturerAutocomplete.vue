<script setup lang="ts">
import { computed } from 'vue';
import { useLecturersStore } from '@/stores/lecturers';

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[] | null;
    multiple?: boolean;
    label?: string;
    errorMessages?: string | string[];
    hint?: string;
    placeholder?: string;
    customItems?: string[];
  }>(),
  {
    multiple: false,
    label: 'Lector',
    errorMessages: undefined,
    hint: undefined,
    placeholder: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void;
}>();

const lecturersStore = useLecturersStore();

const items = computed(() => {
  if (props.customItems) return props.customItems;
  return lecturersStore.lecturers;
});

// In multiple mode each name is committed as a chip, so spell out the interaction:
// type the full name (first + last, even if multi-word) and press Enter to add it.
const effectiveHint = computed(() => {
  if (props.hint) return props.hint;
  return props.multiple ? 'Typ een volledige naam en druk op Enter om toe te voegen.' : undefined;
});

const value = computed({
  get() {
    return props.modelValue;
  },
  set(newVal) {
    emit('update:modelValue', newVal);
  },
});
</script>

<template>
  <v-combobox
    v-model="value"
    :items="items"
    :multiple="multiple"
    :label="label"
    :error-messages="errorMessages"
    :chips="multiple"
    :closable-chips="multiple"
    :hint="effectiveHint"
    :persistent-hint="!!effectiveHint"
    :placeholder="placeholder"
    density="comfortable"
    variant="outlined"
    hide-no-data
  />
</template>
