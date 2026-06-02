<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useProgrammesStore } from '@/stores/programmes';
import { useWizardStore } from '@/stores/wizard';

const programmes = useProgrammesStore();
const wizard = useWizardStore();

const activeProgrammes = computed(() => programmes.activeProgrammes);

function selectProgramme(code: string) {
  wizard.setProgramme(code);
  wizard.next();
}

function autoAdvanceIfSingle() {
  if (activeProgrammes.value.length === 1) {
    const only = activeProgrammes.value[0];
    if (wizard.programmeCode !== only.code) {
      wizard.setProgramme(only.code);
    }
    wizard.next();
  }
}

onMounted(autoAdvanceIfSingle);
watch(() => activeProgrammes.value.length, autoAdvanceIfSingle);
</script>

<template>
  <div>
    <h2 class="text-h5 mb-2">Kies een opleiding</h2>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Kies de opleiding waarvoor je een voorblad wil aanmaken. Bij één beschikbare opleiding
      springen we automatisch naar de volgende stap.
    </p>

    <v-alert v-if="programmes.loading" type="info" variant="tonal" class="mb-3">
      Studiegidsdata wordt geladen…
    </v-alert>
    <v-alert v-if="programmes.error" type="warning" variant="tonal" class="mb-3">
      {{ programmes.error }}
    </v-alert>
    <v-alert
      v-if="!programmes.loading && activeProgrammes.length === 0"
      type="info"
      variant="tonal"
    >
      Geen actieve opleidingen gevonden in de geladen seed.
    </v-alert>

    <v-list v-else lines="two" select-strategy="single-leaf">
      <v-list-item
        v-for="programme in activeProgrammes"
        :key="programme.id"
        :title="programme.name"
        :subtitle="programme.code"
        :active="wizard.programmeCode === programme.code"
        prepend-icon="mdi-school-outline"
        @click="selectProgramme(programme.code)"
      >
        <template #append>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>
