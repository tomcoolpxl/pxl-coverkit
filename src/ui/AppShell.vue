<script setup lang="ts">
import { computed } from 'vue';
import packageJson from '../../package.json';

const appVersion = computed(() => packageJson.version);
</script>

<template>
  <v-app-bar color="secondary" density="comfortable" elevation="1">
    <router-link to="/" class="text-decoration-none text-white px-4 font-weight-bold">
      PXL Cover Kit
    </router-link>
    <v-spacer />
    <v-btn variant="text" color="white" :to="{ name: 'settings' }" prepend-icon="mdi-cog">
      Instellingen
    </v-btn>
    <v-btn variant="text" color="white" :to="{ name: 'about' }" prepend-icon="mdi-information-outline">
      Over
    </v-btn>
  </v-app-bar>

  <v-main>
    <v-container class="py-8">
      <slot />
    </v-container>
  </v-main>

  <v-footer color="background" class="d-flex justify-space-between px-6 py-3 text-caption">
    <span>PXL Cover Kit · v{{ appVersion }}</span>
    <router-link :to="{ name: 'about' }" class="text-secondary">Over &amp; licenties</router-link>
  </v-footer>
</template>
