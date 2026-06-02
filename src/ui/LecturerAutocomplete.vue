<script setup lang="ts">
import { computed } from 'vue';
import { useLecturersStore } from '@/stores/lecturers';

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[] | null;
    multiple?: boolean;
    label?: string;
    errorMessages?: string | string[];
  }>(),
  {
    multiple: false,
    label: 'Lector',
    errorMessages: undefined,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void;
}>();

const lecturersStore = useLecturersStore();

const items = computed(() => lecturersStore.lecturers);

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
    density="comfortable"
    variant="outlined"
    hide-no-data
  />
</template>
