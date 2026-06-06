<script setup lang="ts">
import packageJson from '../../../package.json';
</script>

<template>
  <v-card variant="flat" class="pa-6">
    <h1 class="text-h4 mb-4">Over PXL Cover Kit</h1>
    <p class="text-body-1 mb-2">
      PXL Cover Kit maakt het <strong>examenvoorblad voor Blackboardexamens</strong> van
      PXL-Digital aan. Je kiest een opleiding en opleidingsonderdeel uit de gebundelde studiegids,
      vult de examengegevens aan (datum, uur, duur, examenkans, hulpmiddelen …) en de app genereert
      een kant-en-klare PDF in de officiële huisstijl.
    </p>
    <p class="text-body-1 mb-2">
      Het werkt volledig in je browser, zonder installatie of account. Je voorbladen blijven lokaal
      bewaard zodat je ze later opnieuw kan downloaden, bewerken of actualiseren naar een nieuw
      academiejaar.
    </p>
    <p class="text-body-2 text-medium-emphasis">
      Let op: deze tool is enkel bedoeld voor <strong>Blackboardexamens</strong>. Versie
      {{ packageJson.version }}.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Aan de slag</h2>
    <ol class="text-body-2 mb-2 ps-5">
      <li class="mb-1">
        Klik op <strong>Nieuw voorblad</strong> en kies je <strong>opleiding</strong>.
      </li>
      <li class="mb-1">
        Zoek het <strong>opleidingsonderdeel (OLOD)</strong> in de lijst, of kies
        <strong>handmatige invoer</strong> als het er niet bij staat.
      </li>
      <li class="mb-1">
        Vul de <strong>examengegevens</strong> aan: datum, startuur, duur, examenkans en toegestane
        hulpmiddelen. Verplichte velden geven een melding tot ze ingevuld zijn.
      </li>
      <li class="mb-1">
        Klik op <strong>Opslaan</strong> — het voorblad verschijnt op het overzicht.
      </li>
      <li>
        Gebruik de knop <strong>PDF</strong> op de kaart om je voorblad te downloaden en te printen.
      </li>
    </ol>

    <h2 class="text-h6 mt-6 mb-2">Goed om te weten</h2>
    <ul class="text-body-2 mb-2 ps-5">
      <li class="mb-1">
        <strong>Actualiseren</strong> rolt een bestaand voorblad door naar een nieuw academiejaar met
        een nieuwe datum en uur — handig om niet alles opnieuw in te voeren.
      </li>
      <li class="mb-1">
        <strong>Bewerken</strong> opent alle velden van een voorblad; <strong>Verwijderen</strong>
        vraagt eerst een bevestiging.
      </li>
      <li class="mb-1">
        Schakel per voorblad tussen een <strong>Nederlandse en Engelse</strong> versie.
      </li>
      <li>
        Via <strong>Instellingen</strong> kan je je voorbladen als back-up exporteren en op een
        andere computer of browser weer importeren.
      </li>
    </ul>

    <h2 class="text-h6 mt-6 mb-2">Privacy</h2>
    <p class="text-body-2">
      Alle gegevens blijven lokaal in je browser. Er wordt niets naar een server gestuurd. Als je de
      browsergegevens wist, verdwijnt ook de lokale data.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Bronnen</h2>
    <p class="text-body-2">
      De studiegidsdata komt van de publieke
      <a href="https://studiegids.pxl.be/" target="_blank" rel="noopener">PXL Studiegids</a>
      en wordt jaarlijks ververst met
      <code>scripts/build_programmes_seed.py</code>.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Source Code</h2>
    <p class="text-body-2">
      De volledige source code staat op
      <a href="https://github.com/tomcoolpxl/pxl-coverkit" target="_blank" rel="noopener">GitHub</a
      >.
    </p>

    <h2 class="text-h6 mt-6 mb-2">Change requests / bugs / feedback</h2>
    <p class="text-body-2">
      Vragen, foutjes of suggesties? Mail naar
      <a href="mailto:tom.cool@pxl.be">tom.cool@pxl.be</a>.
    </p>
  </v-card>
</template>
