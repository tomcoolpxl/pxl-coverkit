<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useWizardStore, type WizardStep } from '@/stores/wizard';
import { useSettingsStore } from '@/stores/settings';
import WizardProgrammeStep from './WizardProgrammeStep.vue';
import WizardSourceStep from './WizardSourceStep.vue';
import WizardReviewStep from './WizardReviewStep.vue';

const wizard = useWizardStore();
const settings = useSettingsStore();

// First-run prompt: ask for the user's name once so Vaklector/Lectoren can be
// prefilled on new cards. Shown only when no name has been saved yet.
const showNamePrompt = ref(false);
const nameInput = ref('');

function saveName() {
  const trimmed = nameInput.value.trim();
  if (trimmed) settings.userName = trimmed;
  showNamePrompt.value = false;
}

function skipName() {
  showNamePrompt.value = false;
}

const stepIndex = computed(() => {
  switch (wizard.step) {
    case 'programme':
      return 0;
    case 'source':
      return 1;
    case 'review':
      return 2;
    default:
      return 0;
  }
});

const srAnnouncement = ref('');
watch(() => wizard.step, (newStep) => {
  const stepNames: Record<WizardStep, string> = {
    programme: 'Stap 1 van 3: Selecteer Opleiding.',
    source: 'Stap 2 van 3: Selecteer vak of kies handmatige invoer.',
    review: 'Stap 3 van 3: Controleer en bewaar.',
  };
  srAnnouncement.value = stepNames[newStep] || '';
}, { immediate: true });

function gotoStep(step: WizardStep) {
  if (wizard.canGotoStep(step)) wizard.goto(step);
}

function confirmLeave(): boolean {
  if (!wizard.dirty) return true;
  return window.confirm(
    'Je hebt nog niet-opgeslagen wijzigingen in de wizard. Wil je echt navigeren?',
  );
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (wizard.dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
}

onBeforeRouteLeave((to) => {
  if (to.name === 'overview' && !wizard.dirty) return true;
  if (!wizard.dirty) return true;
  const allow = confirmLeave();
  if (allow) wizard.reset();
  return allow;
});

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload);
  if (!settings.userName.trim()) {
    nameInput.value = '';
    showNamePrompt.value = true;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>

<template>
  <div>
    <!-- Visually hidden element for screen-reader announcements -->
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      {{ srAnnouncement }}
    </div>

    <v-card variant="outlined" class="pa-6">
      <v-stepper :model-value="stepIndex + 1" alt-labels class="mb-4 elevation-0">
        <v-stepper-header>
          <v-stepper-item
            :value="1"
            title="Opleiding"
            :complete="stepIndex > 0"
            :editable="wizard.canGotoStep('programme')"
            @click="gotoStep('programme')"
          />
          <v-divider />
          <v-stepper-item
            :value="2"
            title="Bron"
            :complete="stepIndex > 1"
            :editable="wizard.canGotoStep('source')"
            @click="gotoStep('source')"
          />
          <v-divider />
          <v-stepper-item
            :value="3"
            title="Controleren"
            :complete="false"
            :editable="wizard.canGotoStep('review')"
            @click="gotoStep('review')"
          />
        </v-stepper-header>
      </v-stepper>

      <WizardProgrammeStep v-if="wizard.step === 'programme'" />
      <WizardSourceStep v-else-if="wizard.step === 'source'" />
      <WizardReviewStep v-else-if="wizard.step === 'review'" />
    </v-card>

    <!-- First-run: ask for the user's name (defaults Vaklector + Lectoren) -->
    <v-dialog v-model="showNamePrompt" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-h6">Welkom.</v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-2 text-medium-emphasis">
            Wat is je voor- en achternaam? Die worden automatisch ingevuld als vaklector en lector op nieuwe
            voorbladen. Je kan dit later aanpassen in Instellingen.
          </p>
          <v-text-field
            v-model="nameInput"
            label="Jouw naam"
            variant="outlined"
            density="comfortable"
            autofocus
            @keyup.enter="saveName"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="skipName">Overslaan</v-btn>
          <v-btn color="primary" variant="elevated" @click="saveName">Opslaan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Highlight the active step in the brand color. Vuetify otherwise paints the
   active and completed avatars the same surface-variant grey; completed/past
   valid steps keep that grey, the active one gets primary. */
.v-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar.v-avatar) {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>

