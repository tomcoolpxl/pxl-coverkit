<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useWizardStore, type WizardStep } from '@/stores/wizard';
import WizardProgrammeStep from './WizardProgrammeStep.vue';
import WizardSourceStep from './WizardSourceStep.vue';
import WizardReviewStep from './WizardReviewStep.vue';

const wizard = useWizardStore();

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
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>

<template>
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
</template>
