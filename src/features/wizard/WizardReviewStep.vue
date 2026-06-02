<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/stores/settings';
import { useProgrammesStore } from '@/stores/programmes';
import { useCardsStore } from '@/stores/cards';
import { useWizardStore, type WizardDraft, draftToFormFields } from '@/stores/wizard';
import { buildBaselineFor } from '@/domain/cardFactory';
import LecturerAutocomplete from '@/ui/LecturerAutocomplete.vue';

const settings = useSettingsStore();
const programmes = useProgrammesStore();
const cards = useCardsStore();
const wizard = useWizardStore();
const router = useRouter();

const seedEntry = computed(() =>
  wizard.seedEntryId ? programmes.seedEntries.find((e) => e.id === wizard.seedEntryId) ?? null : null,
);

function buildInitialDraft(): WizardDraft {
  if (wizard.draft) return { ...wizard.draft, lecturers: [...wizard.draft.lecturers] };
  const baseline = buildBaselineFor(seedEntry.value, {
    defaultMaxScore: settings.defaultMaxScore,
    defaultDurationMinutes: settings.defaultDurationMinutes,
  });
  return {
    courseCode: baseline.courseCode,
    courseName: baseline.courseName,
    examChance: settings.defaultExamChance,
    examDate: '',
    startTime: baseline.startTime || '09:00',
    durationMinutes: baseline.durationMinutes,
    vaklector: baseline.vaklector,
    lecturers: [...baseline.lecturers],
    allowedResources: baseline.allowedResources,
    maxScore: baseline.maxScore,
    roomPlaceCode: '',
    templateId: settings.defaultTemplateId,
  };
}

const reviewSchema = z.object({
  courseCode: z.string().min(1, 'Vakcode is verplicht.'),
  courseName: z.string().min(1, 'Vaknaam is verplicht.'),
  examChance: z.string().min(1, 'Examenkans is verplicht.'),
  examDate: z.string().min(1, 'Examendatum is verplicht.'),
  startTime: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, 'Starttijd moet HH:MM zijn.'),
  durationMinutes: z.coerce
    .number({ message: 'Duur is verplicht.' })
    .int()
    .positive('Duur moet groter zijn dan nul.'),
  vaklector: z.string().min(1, 'Vaklector is verplicht.'),
  lecturers: z.array(z.string().min(1)).min(1, 'Minstens één lector is verplicht.'),
  allowedResources: z.string().min(1, 'Toegestane hulpmiddelen mogen niet leeg zijn.'),
  maxScore: z.coerce
    .number({ message: 'Maximumscore is verplicht.' })
    .positive('Maximumscore moet groter zijn dan nul.'),
  roomPlaceCode: z.string().nullable().optional(),
  templateId: z.string().min(1, 'Sjabloon is verplicht.'),
});

const initial = buildInitialDraft();

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(reviewSchema),
  initialValues: initial,
});

const vuetifyConfig = (state: { errors: string[] }) => ({
  props: { 'error-messages': state.errors },
});

const [courseCode, courseCodeProps] = defineField('courseCode', vuetifyConfig);
const [courseName, courseNameProps] = defineField('courseName', vuetifyConfig);
const [examChance, examChanceProps] = defineField('examChance', vuetifyConfig);
const [examDate, examDateProps] = defineField('examDate', vuetifyConfig);
const [startTime, startTimeProps] = defineField('startTime', vuetifyConfig);
const [durationMinutes, durationMinutesProps] = defineField('durationMinutes', vuetifyConfig);
const [vaklector] = defineField('vaklector', vuetifyConfig);
const [lecturers] = defineField('lecturers', vuetifyConfig);
const [allowedResources, allowedResourcesProps] = defineField('allowedResources', vuetifyConfig);
const [maxScore, maxScoreProps] = defineField('maxScore', vuetifyConfig);
const [roomPlaceCode, roomPlaceCodeProps] = defineField('roomPlaceCode', vuetifyConfig);

const examChanceOptions = ['S1', 'S2', 'EK1', 'EK2', 'HE'];
const submitError = ref<string | null>(null);

const onSave = handleSubmit(async (draftValues) => {
  submitError.value = null;
  if (!wizard.programmeCode) {
    submitError.value = 'Geen opleiding geselecteerd.';
    return;
  }
  if (!programmes.loadedYear) {
    submitError.value = 'Geen academiejaar geladen — studiegidsdata ontbreekt.';
    return;
  }
  const draft: WizardDraft = {
    courseCode: draftValues.courseCode,
    courseName: draftValues.courseName,
    examChance: draftValues.examChance,
    examDate: draftValues.examDate,
    startTime: draftValues.startTime,
    durationMinutes: Number(draftValues.durationMinutes),
    vaklector: draftValues.vaklector,
    lecturers: [...draftValues.lecturers],
    allowedResources: draftValues.allowedResources,
    maxScore: Number(draftValues.maxScore),
    roomPlaceCode: draftValues.roomPlaceCode ?? '',
    templateId: settings.defaultTemplateId,
  };
  wizard.saveDraft(draft);
  try {
    const card = cards.create({
      fields: draftToFormFields(
        draft,
        wizard.programmeCode,
        wizard.seedEntryId,
        programmes.loadedYear,
      ),
      seedEntry: seedEntry.value,
      settings: {
        defaultMaxScore: settings.defaultMaxScore,
        defaultDurationMinutes: settings.defaultDurationMinutes,
      },
    });
    wizard.markClean();
    await router.push({ name: 'overview', query: { created: card.id } });
    wizard.reset();
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Onbekende fout bij opslaan.';
  }
});

function backStep() {
  wizard.back();
}

onMounted(() => {
  wizard.markDirty();
});

const sourceLabel = computed(() =>
  wizard.manual ? 'Handmatige invoer' : seedEntry.value?.label ?? 'Onbekende bron',
);
</script>

<template>
  <div>
    <h2 class="text-h5 mb-2">Controleer en bewaar</h2>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Bron: <strong>{{ sourceLabel }}</strong> · Opleiding:
      <strong>{{ wizard.programmeCode }}</strong>
      <template v-if="programmes.loadedYear">
        · Academiejaar: <strong>{{ programmes.loadedYear }}</strong>
      </template>
    </p>

    <v-alert v-if="submitError" type="error" variant="tonal" class="mb-4">
      {{ submitError }}
    </v-alert>

    <v-form @submit.prevent="onSave">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="courseCode"
            v-bind="courseCodeProps"
            label="Vakcode"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="courseName"
            v-bind="courseNameProps"
            label="Vaknaam"
            density="comfortable"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="examChance"
            v-bind="examChanceProps"
            :items="examChanceOptions"
            label="Examenkans"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="examDate"
            v-bind="examDateProps"
            type="date"
            label="Examendatum"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="startTime"
            v-bind="startTimeProps"
            type="time"
            label="Starttijd"
            density="comfortable"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="durationMinutes"
            v-bind="durationMinutesProps"
            type="number"
            min="1"
            label="Duur (minuten)"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="maxScore"
            v-bind="maxScoreProps"
            type="number"
            min="1"
            step="0.5"
            label="Maximumscore"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="roomPlaceCode"
            v-bind="roomPlaceCodeProps"
            label="Lokaal (optioneel)"
            density="comfortable"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="6">
          <LecturerAutocomplete
            v-model="vaklector"
            :error-messages="errors.vaklector"
            label="Vaklector"
          />
        </v-col>
        <v-col cols="12" md="6">
          <LecturerAutocomplete
            v-model="lecturers"
            :error-messages="errors.lecturers"
            label="Lectoren (Enter per naam)"
            multiple
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="allowedResources"
            v-bind="allowedResourcesProps"
            label="Toegestane hulpmiddelen"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-space-between mt-4">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backStep">Terug</v-btn>
        <v-btn type="submit" color="primary" prepend-icon="mdi-content-save">
          Voorblad opslaan
        </v-btn>
      </div>
    </v-form>

    <p v-if="Object.keys(errors).length" class="text-caption text-error mt-3">
      Kan niet opslaan: {{ Object.keys(errors).length }} veld(en) bevatten fouten.
    </p>
  </div>
</template>
