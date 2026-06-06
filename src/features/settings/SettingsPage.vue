<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useCardsStore } from '@/stores/cards';
import { useProgrammesStore } from '@/stores/programmes';
import { useLecturersStore } from '@/stores/lecturers';
import {
  buildExportPayload,
  exportFilename,
  ImportError,
  parseImport,
  serializeExport,
} from '@/data/importExport';
import packageJson from '../../../package.json';
import type { AcademicYear, ExportedState } from '@/domain/types';

const settings = useSettingsStore();
const cards = useCardsStore();
const programmes = useProgrammesStore();
const lecturersStore = useLecturersStore();

const fileInput = ref<HTMLInputElement | null>(null);
const status = ref<{ kind: 'success' | 'error'; message: string } | null>(null);
const showConfirmImportDialog = ref(false);
const pendingImport = ref<ExportedState | null>(null);
const showConfirmCleanDialog = ref(false);
const selectedSeedYear = ref<AcademicYear>(
  settings.activeSeedYear ??
    programmes.loadedYear ??
    programmes.currentYear ??
    programmes.availableYears[0],
);
const seedStatus = ref<{ kind: 'success' | 'error'; message: string } | null>(null);
const loadingSeed = ref(false);

const cardCount = computed(() => cards.count);

const seedOptions = computed(() =>
  programmes.availableYears.map((year) => ({
    value: year,
    title: seedOptionTitle(year),
  })),
);

function seedOptionTitle(year: AcademicYear): string {
  if (year === programmes.currentYear) return `${year} - huidig academiejaar`;
  const yearIndex = programmes.availableYears.indexOf(year);
  const currentIndex = programmes.currentYear
    ? programmes.availableYears.indexOf(programmes.currentYear)
    : -1;
  if (currentIndex !== -1 && yearIndex !== -1) {
    if (yearIndex < currentIndex) return `${year} - vorig academiejaar`;
    if (yearIndex > currentIndex) return `${year} - volgend academiejaar`;
  }
  return `${year} - academiejaar`;
}

async function loadSelectedSeedYear() {
  loadingSeed.value = true;
  seedStatus.value = null;
  const requestedYear = selectedSeedYear.value;

  const loaded = await programmes.loadForYear(requestedYear, { force: true });
  if (loaded) {
    settings.activeSeedYear = requestedYear;
    seedStatus.value = {
      kind: 'success',
      message: `Studiegidszoekhulp geladen voor ${requestedYear}.`,
    };
  } else {
    seedStatus.value = {
      kind: 'error',
      message: programmes.error ?? `Laden van ${requestedYear} mislukte.`,
    };
  }
  loadingSeed.value = false;
}

function triggerExport() {
  const payload = buildExportPayload({
    settings: settings.asExportable(),
    cards: cards.cards,
    lecturers: lecturersStore.lecturers,
  });
  const json = serializeExport(payload);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  status.value = { kind: 'success', message: 'Exportbestand gedownload.' };
}

function triggerImportPicker() {
  fileInput.value?.click();
}

async function onImportFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = parseImport(text);
    pendingImport.value = parsed;
    showConfirmImportDialog.value = true;
  } catch (err) {
    const message = err instanceof ImportError ? err.message : 'Onbekende importfout.';
    status.value = { kind: 'error', message };
  }
}

function confirmImport() {
  if (!pendingImport.value) return;
  const parsed = pendingImport.value;
  settings.replaceWith(parsed.settings);
  cards.replaceAll(parsed.cards);
  if (parsed.lecturers) {
    lecturersStore.replaceAll(parsed.lecturers);
  }
  status.value = {
    kind: 'success',
    message: `Import voltooid: ${parsed.cards.length} voorblad(en) geladen.`,
  };
  pendingImport.value = null;
  showConfirmImportDialog.value = false;
  selectedSeedYear.value =
    settings.activeSeedYear ??
    programmes.loadedYear ??
    programmes.currentYear ??
    programmes.availableYears[0];
}

function cleanEnvironment() {
  cards.clear();
  lecturersStore.clear();
  settings.reset();
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('pxl-coverkit:'));
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Ignore storage errors (e.g. private mode); in-memory stores are already reset.
  }
  status.value = { kind: 'success', message: 'Omgeving opgeschoond. Alle lokale data is gewist.' };
  selectedSeedYear.value = programmes.currentYear ?? programmes.availableYears[0];
  seedStatus.value = null;
  showConfirmCleanDialog.value = false;
}

function createPredefinedCards() {
  cards.seedPredefined();
  status.value = {
    kind: 'success',
    message: `${cards.count} voorbeeldkaart(en) aangemaakt.`,
  };
}
</script>

<template>
  <div>
    <h1 class="text-h4 mb-6">Instellingen</h1>

    <v-card class="mb-6 pa-6" variant="outlined">
      <h2 class="text-h6 mb-2">Studiegidszoekhulp</h2>
      <p class="text-caption text-medium-emphasis">
        Kies welk studiegidsjaar wordt gebruikt om OLOD-codes en vaknamen voor nieuwe voorbladen
        voor te stellen. Bestaande voorbladen blijven gewone opgeslagen tekstvelden; je mag dus
        veilig wisselen tussen jaren.
      </p>
      <div class="d-flex ga-3 align-start flex-wrap mt-4">
        <v-select
          v-model="selectedSeedYear"
          :items="seedOptions"
          item-title="title"
          item-value="value"
          label="Studiegidsjaar voor zoekhulp"
          variant="outlined"
          density="comfortable"
          :loading="loadingSeed"
          :disabled="loadingSeed"
          style="max-width: 420px"
          hide-details
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-database-refresh-outline"
          :loading="loadingSeed"
          :disabled="loadingSeed"
          @click="loadSelectedSeedYear"
        >
          Laden
        </v-btn>
      </div>
      <p v-if="programmes.loadedYear" class="text-body-2 mt-4">
        Geladen zoekhulp:
        <strong class="academic-year-value">{{ programmes.loadedYear }}</strong>
      </p>
      <p v-else class="text-body-2 mt-4 text-medium-emphasis">Nog geen zoekhulp geladen.</p>
      <p v-if="programmes.loading" class="text-body-2 text-medium-emphasis mt-3">
        Studiegidsdata wordt geladen…
      </p>
      <p v-else-if="programmes.error" class="text-body-2 text-error mt-3">
        {{ programmes.error }}
      </p>
      <p v-else class="text-body-2 text-medium-emphasis mt-3">
        {{ programmes.programmes.length }} opleiding(en),
        {{ programmes.seedEntries.length }} OLOD(s) geladen.
      </p>
      <v-alert
        v-if="seedStatus"
        :type="seedStatus.kind === 'success' ? 'success' : 'error'"
        variant="tonal"
        class="mt-4"
      >
        {{ seedStatus.message }}
      </v-alert>
    </v-card>

    <v-card class="mb-6 pa-6" variant="outlined">
      <h2 class="text-h6 mb-2">Jouw naam</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Wordt automatisch ingevuld als vaklector en lector bij nieuwe voorbladen.
      </p>
      <v-text-field
        v-model="settings.userName"
        label="Jouw naam"
        variant="outlined"
        density="comfortable"
        hide-details
        style="max-width: 360px"
      />
    </v-card>

    <v-card class="mb-6 pa-6" variant="outlined">
      <h2 class="text-h6 mb-2">Lokale data — import / export</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Back-up of verhuis je naam, je eigen voorbladen en lokale overrides tussen browsers.
        Studiegidsdata zit in de app en hoef je niet te importeren.
      </p>
      <p class="text-body-2 mb-4">
        Lokale data: <strong>{{ cardCount }}</strong> voorblad(en).
      </p>
      <div class="d-flex ga-3">
        <v-btn color="primary" prepend-icon="mdi-download" @click="triggerExport">
          Exporteren als JSON
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-import" @click="triggerImportPicker">
          Importeren uit JSON
        </v-btn>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="d-none"
          @change="onImportFile"
        />
      </div>
      <v-alert
        v-if="status"
        :type="status.kind === 'success' ? 'success' : 'error'"
        variant="tonal"
        class="mt-4"
      >
        {{ status.message }}
      </v-alert>
    </v-card>

    <v-card class="mb-6 pa-6" variant="outlined" color="warning" border>
      <h2 class="text-h6 mb-2">Ontwikkeling / debug</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Hulpmiddelen voor ontwikkeling. "Omgeving opschonen" wist al je lokale data.
      </p>
      <div class="d-flex ga-3 flex-wrap">
        <v-btn color="error" prepend-icon="mdi-delete-sweep" @click="showConfirmCleanDialog = true">
          Omgeving opschonen
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-card-plus-outline"
          @click="createPredefinedCards"
        >
          Voorbeeldkaarten aanmaken
        </v-btn>
      </div>
    </v-card>

    <v-card class="pa-6" variant="outlined">
      <h2 class="text-h6 mb-2">Over</h2>
      <p class="text-body-2 mb-1">Versie {{ packageJson.version }}</p>
      <p class="text-body-2 text-medium-emphasis">
        Meer info en contact op de <router-link :to="{ name: 'about' }">Over-pagina</router-link>.
      </p>
    </v-card>

    <!-- Confirm Import Dialog -->
    <v-dialog v-model="showConfirmImportDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6"> Import bevestigen </v-card-title>
        <v-card-text>
          <p class="mb-4">
            Weet je zeker dat je de lokale gegevens wilt vervangen door de geïmporteerde gegevens?
            Dit overschrijft je huidige instellingen en voorbladen.
          </p>
          <v-table density="compact" class="mb-4">
            <tbody>
              <tr>
                <td><strong>Huidige voorbladen:</strong></td>
                <td>{{ cards.cards.length }}</td>
              </tr>
              <tr>
                <td><strong>Te importeren voorbladen:</strong></td>
                <td>{{ pendingImport?.cards.length ?? 0 }}</td>
              </tr>
            </tbody>
          </v-table>
          <p class="text-caption text-error">
            Waarschuwing: Deze actie kan niet ongedaan worden gemaakt.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showConfirmImportDialog = false">Annuleren</v-btn>
          <v-btn color="error" variant="elevated" @click="confirmImport">
            Ja, vervang lokale data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Clean Dialog -->
    <v-dialog v-model="showConfirmCleanDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Omgeving opschonen</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Dit wist <strong>alle</strong> lokale data: voorbladen, instellingen (incl. je naam) en
            opgeslagen lectoren. Studiegidsdata blijft behouden.
          </p>
          <p class="text-caption text-error">
            Waarschuwing: Deze actie kan niet ongedaan worden gemaakt.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showConfirmCleanDialog = false">Annuleren</v-btn>
          <v-btn color="error" variant="elevated" @click="cleanEnvironment"> Ja, wis alles </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
