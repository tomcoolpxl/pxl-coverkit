<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from './ui/AppShell.vue';
import { useProgrammesStore } from './stores/programmes';
import { ACTIVE_ACADEMIC_YEAR } from './app/activeAcademicYear';

const programmes = useProgrammesStore();

onMounted(async () => {
  await programmes.loadForYear(ACTIVE_ACADEMIC_YEAR);
});
</script>

<template>
  <v-app>
    <AppShell>
      <router-view />
    </AppShell>
  </v-app>
</template>
