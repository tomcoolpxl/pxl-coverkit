<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useCardsStore } from '@/stores/cards';
import { useProgrammesStore } from '@/stores/programmes';
import { useLecturersStore } from '@/stores/lecturers';
import { ACTIVE_SEED_YEAR } from '@/app/activeAcademicYear';
import { candidateAcademicYearsForDate, currentAcademicYearForDate } from '@/domain/academicYear';
import {
  DEFAULT_OLOD_PROGRESS_ESTIMATE,
  scrapeProgrammesSeed,
  type StudiegidsProgressEvent,
} from '@/data/studiegidsLive';
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
const currentYear = currentAcademicYearForDate(new Date());
const candidateYears = candidateAcademicYearsForDate(new Date());
const selectedSeedYear = ref<AcademicYear>(
  settings.activeSeedYear ?? programmes.loadedYear ?? ACTIVE_SEED_YEAR,
);
const seedStatus = ref<{ kind: 'success' | 'error'; message: string } | null>(null);
const seedLog = ref<string[]>([]);
const loadingSeed = ref(false);
const seedProgress = ref(0);
const progressLabel = ref('');
const studiegidsProxyConfigured = Boolean(import.meta.env.VITE_STUDIEGIDS_PROXY_URL);

const cardCount = computed(() => cards.count);
const seedConsoleLines = computed(() => seedLog.value.slice(-80));

const seedOptions = computed(() =>
  candidateYears.map((year) => ({
    value: year,
    title: seedOptionTitle(year),
    subtitle:
      year === ACTIVE_SEED_YEAR
        ? 'Ingebouwde seed, direct beschikbaar'
        : studiegidsProxyConfigured
          ? `Live ophalen uit studiegids.pxl.be op aanvraag, voortgang geschat op ${DEFAULT_OLOD_PROGRESS_ESTIMATE} OLOD's`
          : `Live ophalen vereist een same-origin proxy; zonder proxy valt Laden terug op ${ACTIVE_SEED_YEAR}`,
  })),
);

function appendSeedLog(message: string) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  seedLog.value = [...seedLog.value, `${hh}:${mm}:${ss} ${message}`];
}

function seedOptionTitle(year: AcademicYear): string {
  const suffix = year === ACTIVE_SEED_YEAR ? 'ingebouwd' : 'live ophalen';
  const relation =
    year === currentYear
      ? 'huidig academiejaar'
      : candidateYears[0] === year
        ? 'vorig academiejaar'
        : candidateYears[2] === year
          ? 'volgend academiejaar'
          : 'academiejaar';
  return `${year} - ${relation} (${suffix})`;
}

function handleLiveProgress(event: StudiegidsProgressEvent) {
  seedProgress.value = Math.round(event.progress * 100);
  progressLabel.value = `${event.completedOlods}/${event.estimatedOlods} OLOD's`;
  appendSeedLog(event.message);
}

async function loadSelectedSeedYear() {
  loadingSeed.value = true;
  seedStatus.value = null;
  seedLog.value = [];
  seedProgress.value = 0;
  progressLabel.value = '';
  const requestedYear = selectedSeedYear.value;

  try {
    if (requestedYear === ACTIVE_SEED_YEAR) {
      const loadedYear = await programmes.loadWithFallback(ACTIVE_SEED_YEAR, ACTIVE_SEED_YEAR, {
        force: true,
        log: appendSeedLog,
      });
      if (!loadedYear) {
        throw new Error('Ingebouwde studiegidsseed kon niet geladen worden.');
      }
      seedProgress.value = 100;
      progressLabel.value = `${programmes.seedEntries.length} OLOD's`;
    } else {
      const seed = await scrapeProgrammesSeed(requestedYear, {
        estimatedOlods: DEFAULT_OLOD_PROGRESS_ESTIMATE,
        onProgress: handleLiveProgress,
      });
      programmes.replaceWithSeed(seed);
    }
    settings.activeSeedYear = requestedYear;
    selectedSeedYear.value = requestedYear;
    seedStatus.value = {
      kind: 'success',
      message: `Studiegidszoekhulp geladen voor ${requestedYear}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout bij live import.';
    appendSeedLog(`Oorzaak: ${message}`);
    if (!studiegidsProxyConfigured && requestedYear !== ACTIVE_SEED_YEAR) {
      appendSeedLog('Diagnose: geen VITE_STUDIEGIDS_PROXY_URL geconfigureerd; browser-fetch is daarom overgeslagen.');
    }
    appendSeedLog(`Val terug op ingebouwde standaard ${ACTIVE_SEED_YEAR}.`);
    const loadedYear = await programmes.loadWithFallback(ACTIVE_SEED_YEAR, ACTIVE_SEED_YEAR, {
      force: true,
      log: appendSeedLog,
    });
    console.warn('[pxl-coverkit] Studiegids live import failed', {
      requestedYear,
      fallbackYear: loadedYear ?? ACTIVE_SEED_YEAR,
      proxyConfigured: studiegidsProxyConfigured,
      reason: message,
    });
    settings.activeSeedYear = loadedYear ?? ACTIVE_SEED_YEAR;
    selectedSeedYear.value = loadedYear ?? ACTIVE_SEED_YEAR;
    seedStatus.value = {
      kind: 'error',
      message: `Live import voor ${requestedYear} mislukte. Oorzaak: ${message} ${loadedYear ?? ACTIVE_SEED_YEAR} werd geladen.`,
    };
  } finally {
    loadingSeed.value = false;
  }
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
  selectedSeedYear.value = settings.activeSeedYear ?? programmes.loadedYear ?? ACTIVE_SEED_YEAR;
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
  selectedSeedYear.value = ACTIVE_SEED_YEAR;
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

onMounted(() => {
  appendSeedLog(
    `Beschikbare keuzes: ${candidateYears.join(', ')}. Alleen ${ACTIVE_SEED_YEAR} is ingebouwd; andere jaren worden pas live opgehaald na Laden.`,
  );
});
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
      <p class="text-caption text-medium-emphasis mt-2">
        Live ophalen vanuit GitHub Pages vereist een same-origin proxy, omdat studiegids.pxl.be
        browser-CORS niet toestaat. Zonder proxy probeert de app geen rechtstreekse browseraanvraag
        en valt Laden automatisch terug op de ingebouwde {{ ACTIVE_SEED_YEAR }}-gegevens.
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
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw.subtitle" />
          </template>
        </v-select>
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
      <v-progress-linear
        v-if="loadingSeed || seedProgress > 0"
        :model-value="seedProgress"
        color="primary"
        height="8"
        rounded
        class="mt-4"
      />
      <p v-if="progressLabel" class="text-caption text-medium-emphasis mt-1">
        {{ progressLabel }}
      </p>
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
      <div
        v-if="seedConsoleLines.length"
        class="seed-console mt-4 pa-3 text-caption"
        aria-label="Studiegids laadlog"
      >
        <div v-for="line in seedConsoleLines" :key="line">{{ line }}</div>
      </div>
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

<style scoped>
.seed-console {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 6px;
  background: #fafafa;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  white-space: pre-wrap;
}
</style>
