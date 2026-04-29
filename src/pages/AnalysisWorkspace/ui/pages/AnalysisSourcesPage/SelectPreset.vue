<template>
  <div class="analysis-sources-toolbar">
    <div class="analysis-sources-toolbar__controls">
      <UiButton
        @click="assignHighlightedSource"
        :is-disabled="!highlightedSourceId"
        variant="secondary"
      >
        <span class="pi pi-bookmark" aria-hidden="true" />
        <span>Источник</span>
      </UiButton>

      <UiButton
        variant="secondary"
        :is-disabled="!selectedSourceId"
        @click="resetDataFilters"
      >
        <span class="pi pi-eye" aria-hidden="true" />
        <span>Показать все</span>
      </UiButton>

      <div class="analysis-sources-toolbar__snapshot-shell">
        <span class="pi pi-calendar" aria-hidden="true" />
        <div class="analysis-sources-toolbar__snapshot" :title="SNAPSHOT_HINT">
          <input
            :value="snapshotAt"
            type="datetime-local"
            class="analysis-sources-toolbar__input"
            :disabled="!selectedSourceId"
            :title="SNAPSHOT_HINT"
            @input="handleSnapshotInput"
          />
          <UiButton
            :is-disabled="!selectedSourceId || !snapshotAt"
            @click="clearSnapshot"
            variant="secondary"
          >
            Очистить
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UiButton } from "@/components/UiButton";

interface Props {
  highlightedSourceId?: number;
  selectedSourceId?: number;
  snapshotAt: string;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "assign-highlighted-source"): void;
  (e: "reset-data-filters"): void;
  (e: "snapshot-at-change", value: string): void;
  (e: "clear-snapshot"): void;
}>();

const assignHighlightedSource = () => {
  emit("assign-highlighted-source");
};

const resetDataFilters = () => {
  emit("reset-data-filters");
};

const handleSnapshotInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("snapshot-at-change", target.value);
};

const clearSnapshot = () => {
  emit("clear-snapshot");
};
const SNAPSHOT_HINT = "Снимок на момент времени";
</script>
<style lang="css" src="./AnalysisSourcesPage.css"></style>
