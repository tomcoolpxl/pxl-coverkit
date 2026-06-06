<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CourseCard } from '@/domain/types';
import { nextAcademicYear } from '@/domain/academicYear';
import { START_TIME_PRESETS } from '@/domain/examTime';

const startTimePresets = START_TIME_PRESETS;

const props = defineProps<{
  modelValue: boolean;
  card: CourseCard | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'confirm',
    data: {
      academicYear: string;
      examDate: string;
      startTime: string;
      durationMinutes: number;
    },
  ): void;
}>();

const academicYear = ref('');
const examDate = ref('');
const startTime = ref('');
const durationMinutes = ref<number>(120);

const isOpen = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.card) {
      academicYear.value = nextAcademicYear(props.card.academicYear);
      examDate.value = '';
      startTime.value = props.card.startTime;
      durationMinutes.value = props.card.durationMinutes;
    }
  },
);

const isValid = computed(() => {
  return !!examDate.value && !!startTime.value && durationMinutes.value > 0;
});

function handleSave() {
  if (isValid.value) {
    emit('confirm', {
      academicYear: academicYear.value,
      examDate: examDate.value,
      startTime: startTime.value,
      durationMinutes: Number(durationMinutes.value),
    });
    isOpen.value = false;
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card v-if="card">
      <v-card-title class="text-h5 bg-primary text-white pa-4 d-flex align-center">
        <v-icon class="me-2">mdi-autorenew</v-icon>
        Voorblad actualiseren
      </v-card-title>
      <v-card-text class="pa-4">
        <p class="mb-4 text-body-2 text-medium-emphasis">
          Verplaats het voorblad naar het volgende academiejaar. De overige velden (zoals lectoren,
          hulpmiddelen en score) blijven behouden.
        </p>

        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="academicYear"
              label="Nieuw academiejaar"
              variant="outlined"
              density="comfortable"
              readonly
              hint="Berekend op basis van het huidige voorblad."
              persistent-hint
              class="mb-3"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="examDate"
              label="Nieuwe examendatum"
              type="date"
              variant="outlined"
              density="comfortable"
              required
              class="mb-3"
            />
          </v-col>

          <v-col cols="6">
            <v-combobox
              v-model="startTime"
              :items="startTimePresets"
              label="Starttijd"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>

          <v-col cols="6">
            <v-text-field
              v-model="durationMinutes"
              label="Duur (minuten)"
              type="number"
              variant="outlined"
              density="comfortable"
              min="1"
              required
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Annuleren</v-btn>
        <v-btn color="primary" variant="elevated" :disabled="!isValid" @click="handleSave">
          Actualiseren
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
