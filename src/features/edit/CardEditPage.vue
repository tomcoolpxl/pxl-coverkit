<script setup lang="ts">
defineProps<{ id: string }>();
</script>

<template>
  <v-card variant="outlined" class="pa-6">
    <h1 class="text-h5 mb-2">Bewerken</h1>
    <p class="text-body-2 text-medium-emphasis">
      Volledige bewerkweergave volgt in Phase 3 (kaart-id: {{ id }}).
    </p>
    <v-btn :to="{ name: 'overview' }" variant="text" class="mt-4">Terug naar overzicht</v-btn>
  </v-card>
</template>
