<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCardsStore } from '@/stores/cards';
import { useProgrammesStore } from '@/stores/programmes';
import { useWizardStore } from '@/stores/wizard';
import { filterCards, uniqueProgrammeCodes } from '@/domain/filters';
import type { CourseCard } from '@/domain/types';

const cards = useCardsStore();
const programmes = useProgrammesStore();
const wizard = useWizardStore();

const programmeFilter = ref<string | null>(null);
const searchText = ref('');

const programmeOptions = computed(() => {
  const codes = uniqueProgrammeCodes(cards.cards);
  return codes.map((code) => {
    const programme = programmes.programmes.find((p) => p.code === code);
    return { code, title: programme ? `${code} — ${programme.name}` : code };
  });
});

const filtered = computed<CourseCard[]>(() =>
  filterCards(cards.cards, {
    programmeCode: programmeFilter.value,
    search: searchText.value,
  }),
);

const isEmptyOverall = computed(() => cards.cards.length === 0);
const isEmptyFiltered = computed(() => !isEmptyOverall.value && filtered.value.length === 0);

function clearFilters() {
  programmeFilter.value = null;
  searchText.value = '';
}

function startWizard() {
  wizard.reset();
}

const dutchMonths = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function formatExamDate(iso: string): string {
  if (!iso) return '—';
  const [yyyy, mm, dd] = iso.split('-');
  const month = dutchMonths[Number(mm) - 1] ?? mm;
  return `${Number(dd)} ${month} ${yyyy}`;
}

function formatUpdated(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center mb-4 ga-3">
      <h1 class="text-h4 mr-2">Overzicht</h1>
      <v-chip v-if="programmes.loadedYear" size="small" variant="tonal" color="primary">
        Actief academiejaar {{ programmes.loadedYear }}
      </v-chip>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'card-new' }" @click="startWizard">
        Nieuw voorblad
      </v-btn>
    </div>

    <v-alert v-if="programmes.error" type="warning" variant="tonal" class="mb-4">
      {{ programmes.error }}
    </v-alert>

    <v-card v-if="!isEmptyOverall" variant="flat" class="mb-4 pa-3 filter-bar">
      <div class="d-flex flex-wrap ga-3 align-center">
        <v-select
          v-model="programmeFilter"
          :items="programmeOptions"
          item-title="title"
          item-value="code"
          label="Opleiding"
          density="compact"
          variant="outlined"
          clearable
          hide-details
          style="min-width: 240px"
        />
        <v-text-field
          v-model="searchText"
          label="Zoek op code of naam"
          density="compact"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          style="min-width: 240px; flex: 1 1 240px"
        />
        <v-btn
          variant="text"
          color="secondary"
          :disabled="!programmeFilter && !searchText"
          @click="clearFilters"
        >
          Wis filters
        </v-btn>
      </div>
      <p class="text-caption text-medium-emphasis mt-2 mb-0">
        {{ filtered.length }} van {{ cards.cards.length }} voorblad(en) getoond.
      </p>
    </v-card>

    <v-card v-if="isEmptyOverall" variant="outlined" class="pa-8 text-center">
      <v-icon size="48" color="primary" class="mb-4">mdi-file-document-outline</v-icon>
      <h2 class="text-h5 mb-2">Nog geen voorbladen</h2>
      <p class="text-body-1 mb-4">
        Maak een nieuw voorblad uit de bundelde studiegidsdata.
      </p>
      <div class="d-flex justify-center">
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'card-new' }" @click="startWizard">
          Nieuw voorblad
        </v-btn>
      </div>
    </v-card>

    <v-card v-else-if="isEmptyFiltered" variant="outlined" class="pa-6 text-center">
      <v-icon size="36" color="secondary" class="mb-2">mdi-filter-off-outline</v-icon>
      <p class="text-body-1 mb-2">Geen voorbladen voor de huidige filters.</p>
      <v-btn variant="text" color="primary" @click="clearFilters">Wis filters</v-btn>
    </v-card>

    <v-row v-else dense>
      <v-col
        v-for="card in filtered"
        :key="card.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <v-card variant="outlined" class="pa-4 h-100 d-flex flex-column">
          <div class="d-flex align-center mb-2 ga-2">
            <v-chip size="small" color="primary" variant="tonal">{{ card.programmeCode }}</v-chip>
            <v-chip size="small" variant="tonal">{{ card.academicYear }}</v-chip>
            <v-spacer />
            <v-chip size="x-small" variant="tonal" color="secondary">{{ card.examChance }}</v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ card.courseCode }}</div>
          <h3 class="text-h6 mb-1 text-truncate">{{ card.courseName }}</h3>
          <div class="text-body-2 mb-3">
            <v-icon size="x-small" class="me-1">mdi-calendar</v-icon>
            {{ formatExamDate(card.examDate) }}
            <span class="text-medium-emphasis">·</span>
            <v-icon size="x-small" class="ms-1 me-1">mdi-clock-outline</v-icon>
            {{ card.startTime }}<span v-if="card.endTime">–{{ card.endTime }}</span>
          </div>
          <v-spacer />
          <div class="d-flex align-center justify-space-between mt-2">
            <span class="text-caption text-medium-emphasis">
              Bijgewerkt {{ formatUpdated(card.updatedAt) }}
            </span>
            <div class="d-flex ga-1">
              <v-tooltip text="Beschikbaar vanaf Phase 4" location="top">
                <template #activator="{ props: tipProps }">
                  <span v-bind="tipProps">
                    <v-btn icon="mdi-file-pdf-box" size="small" variant="text" disabled />
                  </span>
                </template>
              </v-tooltip>
              <v-tooltip text="Beschikbaar vanaf Phase 3" location="top">
                <template #activator="{ props: tipProps }">
                  <span v-bind="tipProps">
                    <v-btn icon="mdi-autorenew" size="small" variant="text" disabled />
                  </span>
                </template>
              </v-tooltip>
              <v-tooltip text="Beschikbaar vanaf Phase 3" location="top">
                <template #activator="{ props: tipProps }">
                  <span v-bind="tipProps">
                    <v-btn icon="mdi-pencil" size="small" variant="text" disabled />
                  </span>
                </template>
              </v-tooltip>
              <v-tooltip text="Beschikbaar vanaf Phase 3" location="top">
                <template #activator="{ props: tipProps }">
                  <span v-bind="tipProps">
                    <v-btn icon="mdi-delete-outline" size="small" variant="text" disabled />
                  </span>
                </template>
              </v-tooltip>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.filter-bar {
  background-color: rgba(174, 154, 100, 0.05);
}
</style>
