<template>
  <section class="app-surface analysis-page-card analysis-page-card--compact">
    <header class="analysis-page-header">
      <span>Карточка файла</span>
      <span class="analysis-page-meta analysis-file-name">{{
        selectedChain.name
      }}</span>
    </header>
    <div class="analysis-kv-grid">
      <FileCardRow label="Путь" :value="selectedFile.path" />
      <FileCardRow label="Файловая система" :value="filesystemLabel" />
      <FileCardRow label="Индексный дескриптор (inode)" :value="inodeLabel" />
      <FileCardRow label="История пути" :value="pathHistoryLabel" />
      <FileCardRow
        label="Описание выбранного события"
        :value="selectedEventDetails"
        :title="selectedEventDetails"
        wide
      />
      <FileCardRow label="Статус" :value="selectedFile.currentStatus" />
      <FileCardRow label="Размер" :value="selectedFile.sizeBytes || 0" />
      <FileCardRow
        label="Исходный процесс"
        :value="selectedFile.originProcess || emptyLabel"
      />
      <FileCardRow
        label="Пользователь"
        :value="selectedFile.user || emptyLabel"
      />
      <FileCardRow
        label="Время создания"
        :value="formatTs(selectedFile.birthTime)"
      />
      <FileCardRow
        label="Начало отслеживания"
        :value="formatTs(selectedFile.trackingStartedAt)"
      />
      <FileCardRow
        label="Источник(и)"
        :value="formatLinks(selectedFile.sourceLabels)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AnalysisFileItem } from "@/services/files/file.types";
import type { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import type { AnalysisChainEntry } from "../../../model/analysis-report.types";

import FileCardRow from "./FileCardRow.vue";

interface Props {
  selectedChain: AnalysisChainEntry;
  selectedFile: AnalysisFileItem;
  selectedTimelineEvent: AnalysisTimelineEntry | null;
  formatTs: (value?: string | null) => string;
  formatLinks: (items: AnalysisFileItem["sourceLabels"]) => string;
}

const props = defineProps<Props>();

const emptyLabel = "—";

const filesystemLabel = computed(
  () =>
    props.selectedFile.filesystem ||
    props.selectedFile.filesystemUuid ||
    emptyLabel,
);

const inodeLabel = computed(() =>
  props.selectedFile.inode === null || props.selectedFile.inode === undefined
    ? emptyLabel
    : props.selectedFile.inode,
);

const pathHistoryLabel = computed(() =>
  props.selectedFile.pathHistory.join(" -> "),
);

const selectedEventDetails = computed(
  () => props.selectedTimelineEvent?.details || emptyLabel,
);
</script>
<style scoped src="./AnalysisChainPage.css"></style>
