<script setup lang="ts">
import { computed, ref } from 'vue';
import { useProgrammesStore } from '@/stores/programmes';
import { useWizardStore } from '@/stores/wizard';

const programmes = useProgrammesStore();
const wizard = useWizardStore();

const searchText = ref('');

const programmeSeedEntries = computed(() => {
  if (!wizard.programmeCode) return [];
  return programmes.seedEntries.filter(
    (entry) => entry.programmeCode === wizard.programmeCode && entry.active,
  );
});

const filteredSeedEntries = computed(() => {
  const needle = searchText.value.trim().toLowerCase();
  if (!needle) return programmeSeedEntries.value;
  return programmeSeedEntries.value.filter((entry) => entry.label.toLowerCase().includes(needle));
});

const breadcrumbsForSelection = computed(() => {
  const entry = programmeSeedEntries.value.find((e) => e.id === wizard.seedEntryId);
  if (!entry || !entry.selectionContext) return [];
  return Object.entries(entry.selectionContext).map(([key, value]) => ({
    key,
    label: value.label,
  }));
});

function selectSeed(id: string) {
  wizard.pickSeed(id);
  wizard.next();
}

function selectManual() {
  wizard.pickManual();
  wizard.next();
}

function backStep() {
  wizard.back();
}
</script>

<template>
  <div>
    <h2 class="text-h5 mb-2">Kies een bron</h2>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Selecteer een OLOD uit de studiegids van
      <strong>{{ wizard.programmeCode }}</strong> of begin met handmatige invoer.
    </p>

    <v-text-field
      v-model="searchText"
      label="Zoek OLOD op code of naam"
      density="comfortable"
      variant="outlined"
      prepend-inner-icon="mdi-magnify"
      clearable
      class="mb-2"
    />

    <p v-if="breadcrumbsForSelection.length > 0" class="text-caption text-medium-emphasis mb-2">
      <span v-for="(crumb, i) in breadcrumbsForSelection" :key="crumb.key">
        <span>{{ crumb.label }}</span>
        <span v-if="i < breadcrumbsForSelection.length - 1"> › </span>
      </span>
    </p>

    <v-card variant="outlined" class="mb-3" max-height="50vh" style="overflow-y: auto">
      <v-alert v-if="filteredSeedEntries.length === 0" type="info" variant="tonal" class="ma-3">
        Geen OLOD's gevonden voor de huidige zoekopdracht.
      </v-alert>
      <v-list v-else density="comfortable">
        <v-list-item
          v-for="entry in filteredSeedEntries"
          :key="entry.id"
          :title="entry.label"
          :active="wizard.seedEntryId === entry.id"
          prepend-icon="mdi-book-open-page-variant-outline"
          @click="selectSeed(entry.id)"
        >
          <template #subtitle>
            <span v-if="entry.selectionContext">
              <span v-for="(ctx, i) in Object.entries(entry.selectionContext)" :key="ctx[0]">
                <span>{{ ctx[1].label }}</span>
                <span v-if="i < Object.entries(entry.selectionContext).length - 1"> › </span>
              </span>
            </span>
          </template>
          <template #append>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-divider class="my-4" />

    <v-card
      variant="outlined"
      class="d-flex align-center pa-4"
      @click="selectManual"
      style="cursor: pointer"
    >
      <v-icon color="primary" class="me-3">mdi-pencil-plus-outline</v-icon>
      <div>
        <div class="text-subtitle-1">Handmatige invoer</div>
        <div class="text-caption text-medium-emphasis">
          Vul alle velden zelf in; geen studiegidskoppeling.
        </div>
      </div>
      <v-spacer />
      <v-icon>mdi-chevron-right</v-icon>
    </v-card>

    <div class="d-flex justify-space-between mt-4">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backStep">Terug</v-btn>
    </div>
  </div>
</template>
