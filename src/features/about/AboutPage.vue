<script setup lang="ts">
import packageJson from '../../../package.json';
</script>

<template>
  <v-card variant="flat" class="pa-6">
    <h1 class="text-h4 mb-4">Over PXL Cover Kit</h1>
    <p class="text-body-1 mb-2">
      PXL Cover Kit genereert het Nederlandse PXL-Digital Blackboard examenvoorblad volledig in de
      browser. Versie {{ packageJson.version }}.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Privacy</h2>
    <p class="text-body-2">
      Alle gegevens blijven lokaal in uw browser. Er wordt niets naar een server gestuurd. Als u de
      browsergegevens wist, verdwijnt ook de lokale data.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Lettertype</h2>
    <p class="text-body-2">
      Het PDF-sjabloon gebruikt <strong>Carlito</strong> (SIL Open Font License) als
      Calibri/Arial-compatibel alternatief. Het officiële PXL-lettertype kan later vervangen worden
      zodra de licentievoorwaarden bevestigd zijn.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Bron</h2>
    <p class="text-body-2">
      De studiegidsdata komt van de publieke
      <a href="https://studiegids.pxl.be/" target="_blank" rel="noopener">PXL Studiegids</a>
      en wordt jaarlijks ververst met
      <code>scripts/build_programmes_seed.py</code>.
    </p>
  </v-card>
</template>
