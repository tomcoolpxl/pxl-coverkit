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

// The studiegids lists the same course once per traject path, so a course can
// appear many times with identical defaults but different selectionContext. We
// show each course once and stack every occurrence's context as a subtitle line.
interface GroupedCourse {
  id: string; // first occurrence id — defaults are identical across occurrences
  label: string;
  contexts: string[]; // one breadcrumb trail per occurrence
}

function contextTrail(entry: { selectionContext?: Record<string, { label: string }> }): string {
  if (!entry.selectionContext) return '';
  return Object.values(entry.selectionContext)
    .map((ctx) => ctx.label)
    .join(' › ');
}

const groupedCourses = computed<GroupedCourse[]>(() => {
  const byLabel = new Map<string, GroupedCourse>();
  for (const entry of filteredSeedEntries.value) {
    const existing = byLabel.get(entry.label);
    const trail = contextTrail(entry);
    if (existing) {
      if (trail && !existing.contexts.includes(trail)) existing.contexts.push(trail);
    } else {
      byLabel.set(entry.label, {
        id: entry.id,
        label: entry.label,
        contexts: trail ? [trail] : [],
      });
    }
  }
  return Array.from(byLabel.values());
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

    <v-card variant="outlined" class="mb-3" max-height="50vh" style="overflow-y: auto">
      <v-alert v-if="groupedCourses.length === 0" type="info" variant="tonal" class="ma-3">
        Geen OLOD's gevonden voor de huidige zoekopdracht.
      </v-alert>
      <v-list v-else density="comfortable" lines="two">
        <v-list-item
          v-for="course in groupedCourses"
          :key="course.id"
          :title="course.label"
          :active="wizard.seedEntryId === course.id"
          prepend-icon="mdi-book-open-page-variant-outline"
          @click="selectSeed(course.id)"
        >
          <template v-if="course.contexts.length" #subtitle>
            <div v-for="trail in course.contexts" :key="trail" class="text-caption">
              {{ trail }}
            </div>
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
