<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { CourseCard } from '@/domain/types';

const props = defineProps<{
  modelValue: boolean;
  card: CourseCard | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const confirmationInput = ref('');
const timerElapsed = ref(false);
const secondsLeft = ref(2);
let intervalId: any = null;

const isOpen = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  }
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      confirmationInput.value = '';
      timerElapsed.value = false;
      secondsLeft.value = 2;
      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(() => {
        secondsLeft.value--;
        if (secondsLeft.value <= 0) {
          timerElapsed.value = true;
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  }
);

const isMatched = computed(() => {
  if (!props.card) return false;
  return confirmationInput.value.trim().toLowerCase() === props.card.courseCode.toLowerCase();
});

const canSubmit = computed(() => {
  return isMatched.value || timerElapsed.value;
});

const buttonLabel = computed(() => {
  if (isMatched.value) return 'Verwijder voorblad';
  if (timerElapsed.value) return 'Verwijder voorblad';
  return `Verwijder voorblad (${secondsLeft.value}s)`;
});

function handleConfirm() {
  if (canSubmit.value) {
    emit('confirm');
    isOpen.value = false;
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card v-if="card">
      <v-card-title class="text-h5 bg-error text-white pa-4 d-flex align-center">
        <v-icon class="me-2">mdi-alert-outline</v-icon>
        Voorblad verwijderen
      </v-card-title>
      <v-card-text class="pa-4">
        <p class="mb-4 text-body-1">
          Weet je zeker dat je het voorblad voor
          <strong>{{ card.courseCode }} - {{ card.courseName }}</strong> wilt verwijderen?
        </p>

        <p class="text-body-2 text-medium-emphasis mb-4">
          Typ de vakcode <strong>{{ card.courseCode }}</strong> ter bevestiging, of wacht 2 seconden om de knop vrij te geven.
        </p>

        <v-text-field
          v-model="confirmationInput"
          label="Vakcode ter bevestiging"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-2"
          @keyup.enter="handleConfirm"
        />
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Annuleren</v-btn>
        <v-btn
          color="error"
          variant="elevated"
          :disabled="!canSubmit"
          @click="handleConfirm"
        >
          {{ buttonLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
