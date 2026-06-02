<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCardsStore } from '@/stores/cards';
import { useNotificationStore } from '@/stores/notifications';
import ActualizeDialog from '@/features/actualize/ActualizeDialog.vue';
import DeleteDialog from '@/features/delete/DeleteDialog.vue';
import type { AcademicYear } from '@/domain/types';
import { downloadPdf } from '@/pdf/generator';

const props = defineProps<{ id: string }>();

const cardsStore = useCardsStore();
const notifications = useNotificationStore();
const router = useRouter();

const card = computed(() => cardsStore.byId(props.id));

const showActualize = ref(false);
const showDelete = ref(false);

function formatExamDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function handleActualizeConfirm(data: {
  academicYear: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
}) {
  if (!card.value) return;
  const original = { ...card.value };

  // Calculate new end time based on startTime and duration
  const [hours, mins] = data.startTime.split(':').map(Number);
  const totalMins = hours * 60 + mins + data.durationMinutes;
  const endHours = Math.floor(totalMins / 60) % 24;
  const endMins = totalMins % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

  const updated = {
    ...card.value,
    academicYear: data.academicYear as AcademicYear,
    examDate: data.examDate,
    startTime: data.startTime,
    durationMinutes: data.durationMinutes,
    endTime,
    updatedAt: new Date().toISOString(),
  };

  cardsStore.upsert(updated);
  notifications.showUndo(`Voorblad geactualiseerd naar ${data.academicYear}`, () => {
    cardsStore.upsert(original);
  });
}

function handleDeleteConfirm() {
  if (!card.value) return;
  const original = { ...card.value };
  const cardId = card.value.id;

  cardsStore.remove(cardId);
  router.push({ name: 'overview' });

  notifications.showUndo('Voorblad verwijderd.', () => {
    cardsStore.upsert(original);
  });
}

function downloadCardPdf() {
  if (!card.value) return;
  try {
    downloadPdf(card.value);
    const updated = {
      ...card.value,
      lastGeneratedAt: new Date().toISOString(),
    };
    cardsStore.upsert(updated);
    notifications.show('PDF succesvol gedownload.');
  } catch (err: any) {
    notifications.show(`Fout bij downloaden van PDF: ${err.message || err}`);
  }
}
</script>

<template>
  <div>
    <!-- Back Navigation and Actions Header -->
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 ga-3">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'overview' }">
        Terug naar overzicht
      </v-btn>

      <div class="d-flex ga-2" v-if="card">
        <v-btn
          color="secondary"
          prepend-icon="mdi-file-pdf-box"
          variant="outlined"
          @click="downloadCardPdf"
        >
          Download PDF
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-autorenew"
          variant="outlined"
          @click="showActualize = true"
        >
          Actualiseren
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-pencil"
          variant="flat"
          :to="{ name: 'card-edit', params: { id: card.id } }"
        >
          Bewerken
        </v-btn>

        <v-btn
          color="error"
          prepend-icon="mdi-delete-outline"
          variant="outlined"
          @click="showDelete = true"
        >
          Verwijderen
        </v-btn>
      </div>
    </div>

    <!-- Main Card Details Grid -->
    <v-row v-if="card">
      <v-col cols="12" md="8">
        <v-card variant="outlined" class="pa-6 mb-6">
          <div class="d-flex align-center mb-4 ga-2">
            <h1 class="text-h4 font-weight-bold">{{ card.courseName }}</h1>
            <v-chip color="primary" variant="tonal" class="text-subtitle-2">
              {{ card.programmeCode }}
            </v-chip>
          </div>

          <v-divider class="mb-6" />

          <h2 class="text-h6 font-weight-bold mb-4">Algemene Exameninformatie</h2>
          <v-row class="mb-6">
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Vakcode</div>
              <div class="text-body-1 font-weight-bold">{{ card.courseCode }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Academiejaar</div>
              <div class="text-body-1">{{ card.academicYear }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Examenkans</div>
              <div class="text-body-1">{{ card.examChance }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Taal</div>
              <div class="text-body-1">Nederlands (nl)</div>
            </v-col>
          </v-row>

          <h2 class="text-h6 font-weight-bold mb-4">Tijdstip &amp; Locatie</h2>
          <v-row class="mb-6">
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Examendatum</div>
              <div class="text-body-1 font-weight-bold">{{ formatExamDate(card.examDate) }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Uurregeling</div>
              <div class="text-body-1">
                {{ card.startTime }} – {{ card.endTime || '—' }} ({{ card.durationMinutes }} min)
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Lokaal</div>
              <div class="text-body-1">{{ card.roomPlaceCode || 'Niet gespecificeerd' }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Maximumscore</div>
              <div class="text-body-1">{{ card.maxScore }} punten</div>
            </v-col>
          </v-row>

          <h2 class="text-h6 font-weight-bold mb-4">Lectoren</h2>
          <v-row class="mb-6">
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Vaklector</div>
              <div class="text-body-1 font-weight-bold">{{ card.vaklector }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Alle Lectoren</div>
              <div class="d-flex flex-wrap ga-1 mt-1">
                <v-chip v-for="l in card.lecturers" :key="l" size="small" variant="outlined">
                  {{ l }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <h2 class="text-h6 font-weight-bold mb-4">Toegestane Hulpmiddelen</h2>
          <div class="text-body-1 bg-grey-lighten-4 pa-4 rounded border mb-6">
            {{ card.allowedResources }}
          </div>

          <h2 class="text-h6 font-weight-bold mb-4">Sjabloon-instellingen</h2>
          <v-row>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Sjabloon ID</div>
              <div class="text-body-2 font-mono">{{ card.templateId }}</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Sidebar Metadata -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-6 mb-6">
          <h2 class="text-h6 font-weight-bold mb-4">Metadata</h2>
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis">Bron</div>
            <div>
              <v-chip
                size="small"
                :color="card.source === 'seeded' ? 'success' : 'warning'"
                variant="tonal"
              >
                {{
                  card.source === 'seeded' ? 'Studiegids (Gesynchroniseerd)' : 'Handmatige invoer'
                }}
              </v-chip>
            </div>
          </div>
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis">Aangemaakt op</div>
            <div class="text-body-2">{{ formatExamDate(card.createdAt) }}</div>
          </div>
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis">Laatst bijgewerkt</div>
            <div class="text-body-2">{{ formatExamDate(card.updatedAt) }}</div>
          </div>
          <div v-if="card.overrides.length > 0">
            <div class="text-caption text-medium-emphasis mb-1">
              Aangepaste velden t.o.v. origineel
            </div>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="over in card.overrides"
                :key="over"
                size="x-small"
                color="info"
                variant="outlined"
              >
                {{ over }}
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Not Found State -->
    <v-card v-else variant="outlined" class="pa-6 text-center">
      <v-icon size="48" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
      <p class="text-h6 mb-2">Voorblad niet gevonden</p>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Het gevraagde voorblad bestaat niet of is verwijderd.
      </p>
      <v-btn color="primary" :to="{ name: 'overview' }"> Terug naar overzicht </v-btn>
    </v-card>

    <!-- Dialogs -->
    <ActualizeDialog
      v-model="showActualize"
      :card="card || null"
      @confirm="handleActualizeConfirm"
    />

    <DeleteDialog v-model="showDelete" :card="card || null" @confirm="handleDeleteConfirm" />
  </div>
</template>
