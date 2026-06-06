<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from './ui/AppShell.vue';
import { useProgrammesStore } from './stores/programmes';
import { useCardsStore } from './stores/cards';
import { useLecturersStore } from './stores/lecturers';
import { useNotificationStore } from './stores/notifications';
import { useSettingsStore } from './stores/settings';
import { ACTIVE_SEED_YEAR } from './app/activeAcademicYear';
import { loadSeedIndex } from './data/seed';

const programmes = useProgrammesStore();
const notifications = useNotificationStore();
const settings = useSettingsStore();

onMounted(async () => {
  // Discover which academic years are bundled from the static seed index, so the
  // app picks them up dynamically instead of relying on a single hardcoded year.
  let defaultYear: typeof ACTIVE_SEED_YEAR = ACTIVE_SEED_YEAR;
  try {
    const index = await loadSeedIndex();
    programmes.setIndex(index);
    const remembered = settings.activeSeedYear;
    defaultYear =
      remembered && index.years.includes(remembered) ? remembered : index.currentYear;
  } catch {
    // No index (e.g. older build): fall back to the built-in year constant.
    programmes.setIndex({ currentYear: ACTIVE_SEED_YEAR, years: [ACTIVE_SEED_YEAR] });
  }

  const loadedYear = await programmes.loadWithFallback(defaultYear, ACTIVE_SEED_YEAR);
  if (!loadedYear) {
    notifications.show('Fout bij het laden van studiegids-gegevens.', 10000);
  } else {
    settings.activeSeedYear = loadedYear;
  }

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
