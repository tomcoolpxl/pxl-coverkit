<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from './ui/AppShell.vue';
import { useProgrammesStore } from './stores/programmes';
import { ACTIVE_SEED_YEAR } from './app/activeAcademicYear';

const programmes = useProgrammesStore();

onMounted(async () => {
  await programmes.loadForYear(ACTIVE_SEED_YEAR);
});
</script>

<template>
  <v-app>
    <AppShell>
      <router-view />
    </AppShell>
  </v-app>
</template>
