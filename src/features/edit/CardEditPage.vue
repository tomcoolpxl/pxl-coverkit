<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useCardsStore } from '@/stores/cards';
import { useProgrammesStore } from '@/stores/programmes';
import { useSettingsStore } from '@/stores/settings';
import { useNotificationStore } from '@/stores/notifications';
import { useLecturersStore } from '@/stores/lecturers';
import { buildCourseCard } from '@/domain/cardFactory';
import { endTime, START_TIME_PRESETS } from '@/domain/examTime';
import { EXAM_CHANCE_OPTIONS } from '@/domain/examChance';
import { ALLOWED_RESOURCES_PRESETS } from '@/domain/allowedResources';
import { partWeightsTotal, partTitleSuffix } from '@/domain/parts';
import { formatDuration } from '@/pdf/template-nl-blackboard-v1/definition';
import LecturerAutocomplete from '@/ui/LecturerAutocomplete.vue';
import MultiPartEditor from '@/ui/MultiPartEditor.vue';
import { downloadPdf } from '@/pdf/generator';

const props = defineProps<{ id: string }>();

const cardsStore = useCardsStore();
const programmes = useProgrammesStore();
const settings = useSettingsStore();
const notifications = useNotificationStore();
const router = useRouter();

const card = computed(() => cardsStore.byId(props.id));

const seedEntry = computed(() => {
  const c = card.value;
  if (!c || !c.seedEntryId) return null;
  return programmes.seedEntries.find((e) => e.id === c.seedEntryId) ?? null;
});

const isSaved = ref(false);

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

const DEFAULT_TEMPLATE_ID = 'template-nl-blackboard-v1';
const templateOptions = [{ title: 'Blackboard NL v1', value: 'template-nl-blackboard-v1' }];

const initialValues = computed(() => {
  const c = card.value;
  // Fall back to an available template option when the card's stored templateId
  // isn't selectable (e.g. legacy/mock ids), so the dropdown never renders blank.
  const storedTemplate = c?.templateId;
  const templateId = templateOptions.some((o) => o.value === storedTemplate)
    ? (storedTemplate as string)
    : DEFAULT_TEMPLATE_ID;
  const autoText = formatDuration(
    c?.durationMinutes ?? settings.defaultDurationMinutes,
    c?.partsCount ?? 1,
    c?.language ?? 'nl'
  );
  return {
    courseCode: c?.courseCode ?? '',
    courseName: c?.courseName ?? '',
    examChance: c?.examChance ?? 'S1',
    examDate: c?.examDate ?? '',
    startTime: c?.startTime ?? '08:30',
    durationMinutes: c?.durationMinutes ?? settings.defaultDurationMinutes,
    vaklector: c?.vaklector ?? '',
    lecturers: c ? [...c.lecturers] : [],
    allowedResources: c?.allowedResources ?? '',
    durationTextOverride: c?.durationTextOverride || autoText,
    maxScore: c?.maxScore ?? 20,
    roomPlaceCode: c?.roomPlaceCode ?? '',
    templateId,
  };
});

const { defineField, handleSubmit, errors, values, meta } = useForm({
  validationSchema: toTypedSchema(reviewSchema),
  initialValues: initialValues as any,
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

// Multi-part (DEEL) state lives outside vee-validate because the weights array is
// dynamic. MultiPartEditor mutates these refs and keeps them internally consistent.
const partsCount = ref(card.value?.partsCount ?? 1);
const partIndex = ref(card.value?.partIndex ?? 1);
const partWeights = ref<number[]>(card.value ? [...card.value.partWeights] : [100]);
const isEnglish = ref(card.value?.language === 'en');

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

const partsValid = computed(
  () =>
    partsCount.value === 1 ||
    (partWeights.value.length === partsCount.value &&
      partWeightsTotal(partWeights.value) === 100),
);

const isDirty = computed(() => {
  if (!card.value) return false;
  return (
    values.courseCode !== card.value.courseCode ||
    values.courseName !== card.value.courseName ||
    values.examChance !== card.value.examChance ||
    values.examDate !== card.value.examDate ||
    values.startTime !== card.value.startTime ||
    Number(values.durationMinutes) !== card.value.durationMinutes ||
    values.vaklector !== card.value.vaklector ||
    JSON.stringify(values.lecturers) !== JSON.stringify(card.value.lecturers) ||
    values.roomPlaceCode !== (card.value.roomPlaceCode || '') ||
    Number(values.maxScore) !== card.value.maxScore ||
    values.allowedResources !== card.value.allowedResources ||
    partsCount.value !== card.value.partsCount ||
    partIndex.value !== card.value.partIndex ||
    JSON.stringify(partWeights.value) !== JSON.stringify(card.value.partWeights) ||
    values.templateId !== card.value.templateId ||
    (values.durationTextOverride || '') !== (card.value.durationTextOverride || '') ||
    (isEnglish.value ? 'en' : 'nl') !== card.value.language
  );
});

const liveEndTime = computed(() => {
  try {
    if (values.startTime && Number(values.durationMinutes) > 0) {
      return endTime(values.startTime, Number(values.durationMinutes));
    }
  } catch {}
  return '';
});

const onSave = handleSubmit(async (formValues) => {
  if (!card.value) return;

  const newCard = buildCourseCard({
    fields: {
      programmeCode: card.value.programmeCode,
      seedEntryId: card.value.seedEntryId,
      courseCode: formValues.courseCode,
      courseName: formValues.courseName,
      academicYear: card.value.academicYear,
      examChance: formValues.examChance,
      language: isEnglish.value ? 'en' : 'nl',
      examDate: formValues.examDate,
      startTime: formValues.startTime,
      durationMinutes: Number(formValues.durationMinutes),
      vaklector: formValues.vaklector,
      lecturers: formValues.lecturers,
      roomPlaceCode: formValues.roomPlaceCode || null,
      maxScore: Number(formValues.maxScore),
      allowedResources: formValues.allowedResources,
      durationTextOverride: isCustomDurationText.value ? (formValues.durationTextOverride || null) : null,
      partsCount: partsCount.value,
      partIndex: partIndex.value,
      partWeights: [...partWeights.value],
      templateId: formValues.templateId,
    },
    seedEntry: seedEntry.value,
    settings: {
      defaultMaxScore: settings.defaultMaxScore,
      defaultDurationMinutes: settings.defaultDurationMinutes,
    },
    id: () => props.id,
  });

  newCard.createdAt = card.value.createdAt;

  cardsStore.upsert(newCard);
  isSaved.value = true;
  notifications.show('Wijzigingen opgeslagen.');
  router.push({ name: 'card-detail', params: { id: props.id } });
});

async function downloadCardPdf() {
  if (!card.value) return;
  try {
    const tempCard = buildCourseCard({
      fields: {
        programmeCode: card.value.programmeCode,
        seedEntryId: card.value.seedEntryId,
        courseCode: values.courseCode,
        courseName: values.courseName,
        academicYear: card.value.academicYear,
        examChance: values.examChance,
        language: isEnglish.value ? 'en' : 'nl',
        examDate: values.examDate,
        startTime: values.startTime,
        durationMinutes: Number(values.durationMinutes),
        vaklector: values.vaklector,
        lecturers: values.lecturers,
        roomPlaceCode: values.roomPlaceCode || null,
        maxScore: Number(values.maxScore),
        allowedResources: values.allowedResources,
        durationTextOverride: isCustomDurationText.value ? (values.durationTextOverride || null) : null,
        partsCount: partsCount.value,
        partIndex: partIndex.value,
        partWeights: [...partWeights.value],
        templateId: values.templateId,
      },
      seedEntry: seedEntry.value,
      settings: {
        defaultMaxScore: settings.defaultMaxScore,
        defaultDurationMinutes: settings.defaultDurationMinutes,
      },
      id: () => props.id,
    });
    tempCard.createdAt = card.value.createdAt;
    tempCard.lastGeneratedAt = new Date().toISOString();

    await downloadPdf(tempCard);
    cardsStore.upsert(tempCard);

    notifications.show('PDF succesvol gedownload.');
  } catch (err: any) {
    notifications.show(`Fout bij downloaden van PDF: ${err.message || err}`);
  }
}

function confirmLeave(): boolean {
  if (isSaved.value || !isDirty.value) return true;
  return window.confirm('Je hebt onopgeslagen wijzigingen. Weet je zeker dat je wilt weggaan?');
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!isSaved.value && isDirty.value) {
    event.preventDefault();
    event.returnValue = '';
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});

onBeforeRouteLeave(() => {
  return confirmLeave();
});

const dutchMonths = [
  'jan',
  'feb',
  'mrt',
  'apr',
  'mei',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
];
function formatExamDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const [yyyy, mm, dd] = iso.split('-');
    const month = dutchMonths[Number(mm) - 1] ?? mm;
    return `${Number(dd)} ${month} ${yyyy}`;
  } catch {
    return iso;
  }
}
</script>

<template>
  <div v-if="card">
    <div class="d-flex align-center mb-6">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        :to="{ name: 'card-detail', params: { id: card.id } }"
        class="mr-4"
      >
        Terug naar details
      </v-btn>
      <h1 class="text-h4">Voorblad bewerken</h1>
    </div>

    <v-form @submit.prevent="onSave">
      <v-row>
        <!-- Form Fields Left Column -->
        <v-col cols="12" md="8">
          <v-expansion-panels multiple model-value="[0, 1, 2, 3, 4, 5]">
            <!-- expansion-panel 0: Course Info -->
            <v-expansion-panel value="0">
              <v-expansion-panel-title class="font-weight-bold">
                Opleiding &amp; Vak
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row class="mt-2">
                  <v-col cols="12" md="4">
                    <v-text-field
                      :model-value="card.programmeCode"
                      label="Opleiding"
                      readonly
                      disabled
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="courseCode"
                      v-bind="courseCodeProps"
                      label="Vakcode"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      :model-value="card.academicYear"
                      label="Academiejaar"
                      readonly
                      disabled
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="courseName"
                      v-bind="courseNameProps"
                      label="Vaknaam"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- expansion-panel 1: Exam Settings -->
            <v-expansion-panel value="1">
              <v-expansion-panel-title class="font-weight-bold">
                Examenregelingen &amp; Tijdstip
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row class="mt-2">
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="examChance"
                      v-bind="examChanceProps"
                      :items="examChanceOptions"
                      item-title="title"
                      item-value="value"
                      label="Examenkans"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="examDate"
                      v-bind="examDateProps"
                      label="Examendatum"
                      type="date"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-combobox
                      v-model="startTime"
                      v-bind="startTimeProps"
                      :items="startTimePresets"
                      label="Starttijd"
                      hint="Kies of typ een eigen tijd (uu:mm)."
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="durationMinutes"
                      v-bind="durationMinutesProps"
                      label="Duur (minuten)"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                  <v-col v-if="partsCount > 1" cols="12">
                    <v-text-field
                      v-model="durationTextOverride"
                      v-bind="durationTextOverrideProps"
                      label="Tijdsverdeling"
                      variant="outlined"
                      density="comfortable"
                    />
                    <v-alert
                      v-if="isCustomDurationText"
                      type="warning"
                      density="compact"
                      variant="tonal"
                      class="mt-n2 mb-2"
                    >
                      Let op: handmatige tijdsverdeling actief (wordt niet automatisch bijgewerkt).
                    </v-alert>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="maxScore"
                      v-bind="maxScoreProps"
                      label="Maximumscore"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="roomPlaceCode"
                      v-bind="roomPlaceCodeProps"
                      label="Lokaal (optioneel)"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- expansion-panel 2: Lecturers -->
            <v-expansion-panel value="2">
              <v-expansion-panel-title class="font-weight-bold"> Lectoren </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row class="mt-2">
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
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- expansion-panel 3: Allowed Resources -->
            <v-expansion-panel value="3">
              <v-expansion-panel-title class="font-weight-bold">
                Toegestane Hulpmiddelen
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row class="mt-2">
                  <v-col cols="12" md="5">
                    <v-select
                      :items="allowedResourcesPresets"
                      item-title="title"
                      item-value="id"
                      label="Voorgedefinieerde hulpmiddelen"
                      hint="Vult onderstaand veld; daarna vrij aanpasbaar."
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                      @update:model-value="applyAllowedResourcesPreset"
                    />
                  </v-col>
                  <v-col cols="12" md="7">
                    <v-text-field
                      v-model="allowedResources"
                      v-bind="allowedResourcesProps"
                      label="Hulpmiddelen"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- expansion-panel 4: Template -->
            <v-expansion-panel value="4">
              <v-expansion-panel-title class="font-weight-bold">
                Taal
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row class="mt-2">
                  <v-col cols="12">
                    <v-switch
                      v-model="isEnglish"
                      color="primary"
                      inset
                      hide-details
                      :label="isEnglish ? 'Taal: Engelstalig voorblad (EN)' : 'Taal: Nederlandstalig voorblad (NL)'"
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- expansion-panel 5: Multi-part (DEEL) -->
            <v-expansion-panel value="5">
              <v-expansion-panel-title class="font-weight-bold">
                Delen (DEEL)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <MultiPartEditor
                  v-model:parts-count="partsCount"
                  v-model:part-index="partIndex"
                  v-model:weights="partWeights"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>

        <!-- Live Preview Sidebar Right Column -->
        <v-col cols="12" md="4">
          <div style="position: sticky; top: 88px">
            <h2 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon size="small" class="me-1">mdi-eye-outline</v-icon> Live voorbeeld
            </h2>

            <v-card variant="outlined" class="pa-4 mb-4">
              <div class="d-flex align-center mb-2 ga-2">
                <v-chip size="small" color="primary" variant="tonal">{{
                  card.programmeCode
                }}</v-chip>
                <v-chip size="small" variant="tonal">{{ card.academicYear }}</v-chip>
                <v-spacer />
                <v-chip size="x-small" variant="tonal" color="secondary">{{
                  values.examChance || '—'
                }}</v-chip>
                <v-chip v-if="isEnglish" size="x-small" variant="tonal" color="info">EN</v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ values.courseCode || 'Vakcode' }}
              </div>
              <h3 class="text-h6 mb-1 text-truncate">
                {{ values.courseName || 'Vaknaam' }}{{ partTitleSuffix(partsCount, partIndex, isEnglish ? 'en' : 'nl') }}
              </h3>
              <div class="text-body-2 mb-2">
                <v-icon size="x-small" class="me-1">mdi-calendar</v-icon>
                {{ formatExamDate(values.examDate) }}
                <span class="text-medium-emphasis">·</span>
                <v-icon size="x-small" class="ms-1 me-1">mdi-clock-outline</v-icon>
                {{ values.startTime || '--:--' }}<span v-if="liveEndTime">–{{ liveEndTime }}</span>
              </div>
            </v-card>

            <v-card class="pa-4" variant="flat" style="background-color: rgba(174, 154, 100, 0.05)">
              <div class="d-flex flex-column ga-2">
                <v-btn
                  color="secondary"
                  variant="outlined"
                  prepend-icon="mdi-file-pdf-box"
                  :disabled="!meta.valid || !partsValid"
                  class="w-100"
                  @click="downloadCardPdf"
                >
                  PDF genereren
                </v-btn>

                <v-btn
                  color="primary"
                  type="submit"
                  prepend-icon="mdi-content-save"
                  :disabled="!meta.valid || !partsValid"
                  class="w-100"
                >
                  Opslaan
                </v-btn>

                <p
                  v-if="Object.keys(errors).length"
                  class="text-caption text-error text-center mt-1 mb-0"
                >
                  {{ Object.keys(errors).length }} veld(en) bevatten fouten.
                </p>
              </div>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>
