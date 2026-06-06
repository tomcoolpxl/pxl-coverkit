<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/stores/settings';
import { useProgrammesStore } from '@/stores/programmes';
import { useCardsStore } from '@/stores/cards';
import { useLecturersStore } from '@/stores/lecturers';
import { useWizardStore, type WizardDraft, draftToFormFields } from '@/stores/wizard';
import { buildBaselineFor } from '@/domain/cardFactory';
import { EXAM_CHANCE_OPTIONS } from '@/domain/examChance';
import { START_TIME_PRESETS, DEFAULT_START_TIME } from '@/domain/examTime';
import { ALLOWED_RESOURCES_PRESETS, DEFAULT_ALLOWED_RESOURCES } from '@/domain/allowedResources';
import { partWeightsTotal } from '@/domain/parts';
import { formatDuration } from '@/pdf/template-nl-blackboard-v1/definition';
import LecturerAutocomplete from '@/ui/LecturerAutocomplete.vue';
import MultiPartEditor from '@/ui/MultiPartEditor.vue';

const settings = useSettingsStore();
const programmes = useProgrammesStore();
const cards = useCardsStore();
const wizard = useWizardStore();
const router = useRouter();

const seedEntry = computed(() =>
  wizard.seedEntryId
    ? (programmes.seedEntries.find((e) => e.id === wizard.seedEntryId) ?? null)
    : null,
);

function buildInitialDraft(): WizardDraft {
  if (wizard.draft) {
    const draft = wizard.draft;
    const autoText = formatDuration(draft.durationMinutes, draft.partsCount, draft.language);
    return {
      ...draft,
      lecturers: [...draft.lecturers],
      partWeights: [...draft.partWeights],
      durationTextOverride: draft.durationTextOverride || autoText,
    };
  }
  const baseline = buildBaselineFor(seedEntry.value, {
    defaultMaxScore: settings.defaultMaxScore,
    defaultDurationMinutes: settings.defaultDurationMinutes,
  });
  const userName = settings.userName.trim();
  const baselineLecturers = baseline.lecturers.length ? [...baseline.lecturers] : userName ? [userName] : [];
  const initialVaklector = baselineLecturers.length > 1 ? '' : (baseline.vaklector || userName || '');
  const autoText = formatDuration(baseline.durationMinutes, 1, 'nl');
  return {
    courseCode: baseline.courseCode,
    courseName: baseline.courseName,
    examChance: settings.defaultExamChance,
    examDate: '',
    startTime: baseline.startTime || DEFAULT_START_TIME,
    durationMinutes: baseline.durationMinutes,
    vaklector: initialVaklector,
    lecturers: baselineLecturers,
    allowedResources: baseline.allowedResources || DEFAULT_ALLOWED_RESOURCES,
    maxScore: baseline.maxScore,
    partsCount: 1,
    partIndex: 1,
    partWeights: [100],
    roomPlaceCode: '',
    templateId: settings.defaultTemplateId,
    language: 'nl' as const,
    durationTextOverride: autoText,
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
  vaklector: z.string().nullable().optional(),
  lecturers: z.array(z.string().min(1)).min(1, 'Minstens één lector is verplicht.'),
  allowedResources: z.string().min(1, 'Toegestane hulpmiddelen mogen niet leeg zijn.'),
  durationTextOverride: z.string().nullable().optional(),
  maxScore: z.coerce
    .number({ message: 'Maximumscore is verplicht.' })
    .positive('Maximumscore moet groter zijn dan nul.'),
  roomPlaceCode: z.string().nullable().optional(),
  templateId: z.string().min(1, 'Sjabloon is verplicht.'),
});

const initial = buildInitialDraft();

// Multi-part (DEEL) state sits outside vee-validate (dynamic weights array).
const partsCount = ref(initial.partsCount);
const partIndex = ref(initial.partIndex);
const partWeights = ref<number[]>([...initial.partWeights]);
const isEnglish = ref(initial.language === 'en');

const partsValid = computed(
  () =>
    partsCount.value === 1 ||
    (partWeights.value.length === partsCount.value &&
      partWeightsTotal(partWeights.value) === 100),
);

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
const [durationTextOverride, durationTextOverrideProps] = defineField('durationTextOverride', vuetifyConfig);
const [maxScore, maxScoreProps] = defineField('maxScore', vuetifyConfig);
const [roomPlaceCode, roomPlaceCodeProps] = defineField('roomPlaceCode', vuetifyConfig);

const examChanceOptions = EXAM_CHANCE_OPTIONS;
const startTimePresets = START_TIME_PRESETS;

const allowedResourcesPresets = computed(() => {
  const lang = isEnglish.value ? 'en' : 'nl';
  return ALLOWED_RESOURCES_PRESETS.filter((p) => p.language === lang);
});

const lecturersStore = useLecturersStore();
const vaklectorItems = computed(() => {
  const list = ['in te vullen door student'];
  const name = settings.userName.trim();
  if (name) {
    list.push(name);
  }
  for (const l of lecturersStore.lecturers) {
    if (!list.includes(l)) {
      list.push(l);
    }
  }
  return list;
});

const submitError = ref<string | null>(null);

function applyAllowedResourcesPreset(presetId: string) {
  const preset = allowedResourcesPresets.value.find((p) => p.id === presetId);
  if (preset) allowedResources.value = preset.text;
}

watch(isEnglish, (newVal) => {
  const oldLang = newVal ? 'nl' : 'en';
  const newLang = newVal ? 'en' : 'nl';
  
  const currentText = allowedResources.value;
  const matchedPresetIndex = ALLOWED_RESOURCES_PRESETS
    .filter(p => p.language === oldLang)
    .findIndex(p => p.text === currentText);
    
  if (matchedPresetIndex !== -1) {
    const correspondingPresets = ALLOWED_RESOURCES_PRESETS.filter(p => p.language === newLang);
    if (correspondingPresets[matchedPresetIndex]) {
      allowedResources.value = correspondingPresets[matchedPresetIndex].text;
    }
  } else {
    const confirmText = newVal
      ? 'De toegestane hulpmiddelen bevatten handmatige aanpassingen. Wil je de tekst overschrijven met de Engelse standaardtekst?'
      : 'De toegestane hulpmiddelen bevatten handmatige aanpassingen. Wil je de tekst overschrijven met de Nederlandse standaardtekst?';
    if (window.confirm(confirmText)) {
      const correspondingPresets = ALLOWED_RESOURCES_PRESETS.filter(p => p.language === newLang);
      if (correspondingPresets[0]) {
        allowedResources.value = correspondingPresets[0].text;
      }
    }
  }

  const oldAutoDuration = formatDuration(Number(durationMinutes.value) || 0, partsCount.value, oldLang);
  const newAutoDuration = formatDuration(Number(durationMinutes.value) || 0, partsCount.value, newLang);

  if (!durationTextOverride.value || durationTextOverride.value === oldAutoDuration) {
    durationTextOverride.value = newAutoDuration;
  } else if (durationTextOverride.value !== newAutoDuration) {
    const confirmText = newVal
      ? 'De tijdsverdeling bevat handmatige aanpassingen. Wil je de tekst overschrijven met de Engelse standaardtekst?'
      : 'De tijdsverdeling bevat handmatige aanpassingen. Wil je de tekst overschrijven met de Nederlandse standaardtekst?';
    if (window.confirm(confirmText)) {
      durationTextOverride.value = newAutoDuration;
    }
  }
});

const autoDurationText = computed(() => {
  const mins = Number(durationMinutes.value) || 0;
  const count = partsCount.value || 1;
  const lang = isEnglish.value ? 'en' : 'nl';
  return formatDuration(mins, count, lang);
});

const isCustomDurationText = computed(() => {
  const current = durationTextOverride.value;
  if (!current) return false;
  return current !== autoDurationText.value;
});

watch(autoDurationText, (newAutoVal, oldAutoVal) => {
  if (!durationTextOverride.value || durationTextOverride.value === oldAutoVal) {
    durationTextOverride.value = newAutoVal;
  }
});

const onSave = handleSubmit(async (draftValues) => {
  submitError.value = null;
  if (!partsValid.value) {
    submitError.value = 'De puntenverdeling van de delen moet samen 100% zijn.';
    return;
  }
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
    durationTextOverride: isCustomDurationText.value ? (draftValues.durationTextOverride || null) : null,
    maxScore: Number(draftValues.maxScore),
    partsCount: partsCount.value,
    partIndex: partIndex.value,
    partWeights: [...partWeights.value],
    roomPlaceCode: draftValues.roomPlaceCode ?? '',
    templateId: settings.defaultTemplateId,
    language: isEnglish.value ? 'en' : 'nl',
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
  wizard.manual ? 'Handmatige invoer' : (seedEntry.value?.label ?? 'Onbekende bron'),
);
</script>

<template>
  <div>
    <h2 class="text-h5 mb-2">Controleer en bewaar</h2>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Bron: <strong>{{ sourceLabel }}</strong> · Opleiding:
      <strong>{{ wizard.programmeCode }}</strong>
      <template v-if="programmes.loadedYear">
        · Academiejaar:
        <strong class="academic-year-value">{{ programmes.loadedYear }}</strong>
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
            item-title="title"
            item-value="value"
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
          <v-combobox
            v-model="startTime"
            v-bind="startTimeProps"
            :items="startTimePresets"
            label="Starttijd"
            hint="Kies een veelgebruikte tijd of typ een eigen tijd (uu:mm)."
            persistent-hint
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
            :customItems="vaklectorItems"
            label="Vaklector"
            placeholder="(in te vullen door student)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <LecturerAutocomplete
            v-model="lecturers"
            :error-messages="errors.lecturers"
            label="Lectoren"
            multiple
          />
        </v-col>

        <v-col cols="12" md="5">
          <v-select
            :items="allowedResourcesPresets"
            item-title="title"
            item-value="id"
            label="Voorgedefinieerde hulpmiddelen"
            hint="Vult onderstaand veld; je kan het daarna vrij aanpassen."
            persistent-hint
            density="comfortable"
            variant="outlined"
            @update:model-value="applyAllowedResourcesPreset"
          />
        </v-col>
        <v-col cols="12" md="7">
          <v-text-field
            v-model="allowedResources"
            v-bind="allowedResourcesProps"
            label="Toegestane hulpmiddelen"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <div class="mt-2">
        <MultiPartEditor
          v-model:parts-count="partsCount"
          v-model:part-index="partIndex"
          v-model:weights="partWeights"
        />
        <div v-if="partsCount > 1" class="mt-4">
          <v-text-field
            v-model="durationTextOverride"
            v-bind="durationTextOverrideProps"
            label="Tijdsverdeling"
            density="comfortable"
            variant="outlined"
          />
          <v-alert
            v-if="isCustomDurationText"
            type="warning"
            density="compact"
            variant="tonal"
            class="mt-n2"
          >
            Let op: handmatige tijdsverdeling actief (wordt niet automatisch bijgewerkt).
          </v-alert>
        </div>
      </div>

      <div class="mt-4">
        <v-switch
          v-model="isEnglish"
          color="primary"
          inset
          hide-details
          :label="isEnglish ? 'Taal: Engelstalig voorblad (EN)' : 'Taal: Nederlandstalig voorblad (NL)'"
        />
      </div>

      <div class="d-flex justify-space-between mt-4">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backStep">Terug</v-btn>
        <v-btn
          type="submit"
          color="primary"
          prepend-icon="mdi-content-save"
          :disabled="!partsValid"
        >
          Voorblad opslaan
        </v-btn>
      </div>
    </v-form>

    <p v-if="Object.keys(errors).length" class="text-caption text-error mt-3">
      Kan niet opslaan: {{ Object.keys(errors).length }} veld(en) bevatten fouten.
    </p>
  </div>
</template>
