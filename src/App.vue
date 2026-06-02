<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from './ui/AppShell.vue';
import { useProgrammesStore } from './stores/programmes';
import { useCardsStore } from './stores/cards';
import { useLecturersStore } from './stores/lecturers';
import { ACTIVE_SEED_YEAR } from './app/activeAcademicYear';

const programmes = useProgrammesStore();

onMounted(async () => {
  await programmes.loadForYear(ACTIVE_SEED_YEAR);

  // Seed observed lecturers from existing cards
  const cardsStore = useCardsStore();
  const lecturersStore = useLecturersStore();
  const allObserved = new Set<string>();
  for (const card of cardsStore.cards) {
    if (card.vaklector) {
      allObserved.add(card.vaklector);
    }
    if (card.lecturers) {
      for (const l of card.lecturers) {
        allObserved.add(l);
      }
    }
  }
  if (allObserved.size > 0) {
    lecturersStore.observeLecturers(Array.from(allObserved));
  }
});
</script>

<template>
  <v-app>
    <AppShell>
      <router-view />
    </AppShell>
  </v-app>
</template>
