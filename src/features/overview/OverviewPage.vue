<script setup lang="ts">
import { computed } from 'vue';
import { useCardsStore } from '@/stores/cards';
import { useProgrammesStore } from '@/stores/programmes';
import { useSettingsStore } from '@/stores/settings';

const cards = useCardsStore();
const programmes = useProgrammesStore();
const settings = useSettingsStore();

const isEmpty = computed(() => cards.cards.length === 0);
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 mr-4">Overzicht</h1>
      <v-chip size="small" variant="tonal" color="primary">
        Academiejaar {{ settings.activeAcademicYear }}
      </v-chip>
      <v-spacer />
      <v-btn color="primary" disabled prepend-icon="mdi-plus">
        Nieuw voorblad
      </v-btn>
    </div>

    <v-alert v-if="programmes.error" type="warning" variant="tonal" class="mb-4">
      {{ programmes.error }}
    </v-alert>

    <v-card v-if="isEmpty" variant="outlined" class="pa-8 text-center">
      <v-icon size="48" color="primary" class="mb-4">mdi-file-document-outline</v-icon>
      <h2 class="text-h5 mb-2">Nog geen voorbladen</h2>
      <p class="text-body-1 mb-4">
        Maak een nieuw voorblad uit de bundelde studiegidsdata, of importeer een eerder geëxporteerd
        JSON-bestand om verder te werken.
      </p>
      <div class="d-flex justify-center ga-3">
        <v-btn color="primary" disabled prepend-icon="mdi-plus">Nieuw voorblad</v-btn>
        <v-btn :to="{ name: 'settings' }" variant="outlined" prepend-icon="mdi-import">
          Importeren
        </v-btn>
      </div>
      <p class="text-caption mt-4 text-medium-emphasis">
        Aanmaken en bewerken komen in een volgende oplevering beschikbaar.
      </p>
    </v-card>

    <div v-else>
      <p class="text-body-1">{{ cards.count }} voorblad(en) opgeslagen.</p>
    </div>
  </div>
</template>
