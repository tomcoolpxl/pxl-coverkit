<script setup lang="ts">
import { computed } from 'vue';
import {
  MIN_PARTS,
  MAX_PARTS,
  resizePartWeights,
  clampPartIndex,
  partWeightsTotal,
} from '@/domain/parts';

const partsCount = defineModel<number>('partsCount', { required: true });
const partIndex = defineModel<number>('partIndex', { required: true });
const weights = defineModel<number[]>('weights', { required: true });

const partsCountOptions = Array.from(
  { length: MAX_PARTS - MIN_PARTS + 1 },
  (_, i) => MIN_PARTS + i,
);
const partIndexOptions = computed(() =>
  Array.from({ length: partsCount.value }, (_, i) => i + 1),
);
const total = computed(() => partWeightsTotal(weights.value));
const totalValid = computed(() => total.value === 100);

function onCountChange(next: number) {
  partsCount.value = next;
  weights.value = resizePartWeights(weights.value, next);
  partIndex.value = clampPartIndex(partIndex.value, next);
}

function setWeight(i: number, val: unknown) {
  const next = [...weights.value];
  next[i] = Number(val) || 0;
  weights.value = next;
}
</script>

<template>
  <div>
    <v-row dense class="mt-0">
      <v-col cols="12" md="4">
        <v-select
          :model-value="partsCount"
          :items="partsCountOptions"
          label="Aantal delen"
          variant="outlined"
          density="comfortable"
          @update:model-value="onCountChange"
        />
      </v-col>
      <v-col v-if="partsCount > 1" cols="12" md="4">
        <v-select
          v-model="partIndex"
          :items="partIndexOptions"
          label="Dit is deel"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <template v-if="partsCount > 1">
      <v-row dense>
        <v-col v-for="(w, i) in weights" :key="i" cols="6" md="3">
          <v-text-field
            :model-value="w"
            type="number"
            min="0"
            max="100"
            suffix="%"
            :label="`Deel ${i + 1} (%)`"
            :class="{ 'font-weight-bold': i + 1 === partIndex }"
            variant="outlined"
            density="comfortable"
            @update:model-value="(val: string) => setWeight(i, val)"
          />
        </v-col>
      </v-row>
      <p class="text-caption mb-0" :class="totalValid ? 'text-success' : 'text-error'">
        Totaal: {{ total }}%<span v-if="!totalValid"> — moet 100% zijn</span>
      </p>
    </template>
  </div>
</template>
