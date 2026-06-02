<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from './ui/AppShell.vue';
import { useProgrammesStore } from './stores/programmes';
import { useSettingsStore } from './stores/settings';

const programmes = useProgrammesStore();
const settings = useSettingsStore();

onMounted(async () => {
  await programmes.loadForYear(settings.activeAcademicYear);
});
</script>

<template>
  <v-app>
    <AppShell>
      <router-view />
    </AppShell>
  </v-app>
</template>
