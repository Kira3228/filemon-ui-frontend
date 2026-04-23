<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>Источники</span>
      <span class="analysis-page-meta">{{ allSources.length }} строк</span>
    </header>
    <div class="analysis-page-table-shell">
      <!-- <DataTable
        :headers="headers"
        :items="allSources"
        :items-per-page="1000"
        item-key="fileId"
        :active-row-key="highlightedSourceId"
        :enable-keyboard-navigation="false"
        export-title="Источники"
        @click-row="handleRowClick"
        @dblclick-row="handleRowDblClick"
      >
        <template #toolbar-actions>
          <AnalysisFileDetailsToggle
            :active="fileDetailsVisible"
            @click="setFileDetailsVisible(!fileDetailsVisible)"
          />
        </template>
        <template #select-preset>
          <div class="analysis-sources-toolbar">
            <div class="analysis-sources-toolbar__controls">
              <button
                type="button"
                class="analysis-sources-toolbar__button"
                :disabled="!highlightedSourceId"
                @click="assignHighlightedSource"
              >
                <span class="pi pi-bookmark" aria-hidden="true" />
                <span>Источник</span>
              </button>

              <button
                type="button"
                class="analysis-sources-toolbar__button"
                :disabled="!selectedSourceId"
                @click="resetDataFilters"
              >
                <span class="pi pi-eye" aria-hidden="true" />
                <span>Показать все</span>
              </button>

              <div class="analysis-sources-toolbar__snapshot-shell">
                <span class="pi pi-calendar" aria-hidden="true" />
                <div
                  class="analysis-sources-toolbar__snapshot"
                  :title="SNAPSHOT_HINT"
                >
                  <input
                    :value="snapshotAt"
                    type="datetime-local"
                    class="analysis-sources-toolbar__input"
                    :disabled="!selectedSourceId"
                    :title="SNAPSHOT_HINT"
                    @input="handleSnapshotInput"
                  />
                  <button
                    type="button"
                    class="analysis-sources-toolbar__button"
                    :disabled="!selectedSourceId || !snapshotAt"
                    :title="SNAPSHOT_HINT"
                    @click="clearSnapshot"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #[`item.name`]="{ item }">
          <div
            class="analysis-source-cell"
            :title="`${item.name}\n${item.path}`"
          >
            <strong class="analysis-source-title">{{ item.name }}</strong>
            <span class="analysis-source-caption">{{ item.path || "—" }}</span>
          </div>
        </template>
        <template #[`item.filesystem`]="{ item }">{{
          item.filesystem || item.filesystemUuid || "—"
        }}</template>
        <template #[`item.processes`]="{ item }">{{
          item.stats?.processes ?? 0
        }}</template>
        <template #[`item.producedFiles`]="{ item }">{{
          item.stats?.producedFiles ?? 0
        }}</template>
        <template #[`item.maxDepth`]="{ item }">{{
          item.stats?.maxDepth ?? 0
        }}</template>
        <template #[`item.readOps`]="{ item }">{{
          item.stats?.readOps ?? 0
        }}</template>
      </DataTable> -->
    </div>
  </section>
</template>

<script lang="ts" setup>
// import {  Header } from "@/components/DataTable";
import { ref, watch } from "vue";
// import { useRouter } from "vue-router/composables";
// import { useAnalysisUiSettings } from "../../model/use-analysis-ui-settings";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
// import AnalysisFileDetailsToggle from "../components/AnalysisFileDetailsToggle.vue";
// import { AnalysisSourceItem } from "../../model/analysis-report.types";

// const router = useRouter();
const {
  allSources,
  // resetDataFilters,
  selectedSourceId,
  // setSelectedFile,
  // setSelectedSource,
  // snapshotAt,
} = useAnalysisWorkspace();
// const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();

// const SNAPSHOT_HINT = "Снимок на момент времени";

const highlightedSourceId = ref<number | null>(selectedSourceId.value);

watch(selectedSourceId, (value) => {
  if (!highlightedSourceId.value) {
    highlightedSourceId.value = value;
  }
});

watch(
  allSources,
  (items) => {
    if (!highlightedSourceId.value) {
      return;
    }
    const hasHighlightedSource = items.some(
      (item) => item.fileId === highlightedSourceId.value,
    );
    if (!hasHighlightedSource) {
      highlightedSourceId.value = selectedSourceId.value;
    }
  },
  { immediate: true },
);

// const exportSourceLabel = (item: AnalysisSourceItem) =>
//   `${item.name || "—"} | ${item.path || "—"}`;
// const exportSourceFilesystem = (item: AnalysisSourceItem) =>
//   item.filesystemUuid || "—";
// const sortSourceProcesses = (item: AnalysisSourceItem) =>
//   item.stats?.processes ?? 0;
// const sortSourceProducedFiles = (item: AnalysisSourceItem) =>
//   item.stats?.producedFiles ?? 0;
// const sortSourceMaxDepth = (item: AnalysisSourceItem) =>
//   item.stats?.maxDepth ?? 0;
// const sortSourceReadOps = (item: AnalysisSourceItem) =>
//   item.stats?.readOps ?? 0;

// const headers: Header[] = [
//   {
//     text: "Файл",
//     value: "name",
//     align: "start",
//     sortable: true,
//     isVisible: true,
//     width: 240,
//     wrap: true,
//     filterBy: ["name", "path"],
//     exportValue: exportSourceLabel,
//   },
//   {
//     text: "Файловая система",
//     value: "filesystem",
//     align: "start",
//     sortable: true,
//     isVisible: true,
//     width: 180,
//     filterBy: ["filesystem", "filesystemUuid"],
//     exportValue: exportSourceFilesystem,
//   },
//   {
//     text: "Процессов",
//     value: "processes",
//     align: "start",
//     sortable: true,
//     isVisible: true,
//     width: 92,
//     sortBy: sortSourceProcesses,
//     exportValue: sortSourceProcesses,
//   },
//   {
//     text: "Порождено",
//     value: "producedFiles",
//     align: "start",
//     sortable: true,
//     isVisible: true,
//     width: 92,
//     sortBy: sortSourceProducedFiles,
//     exportValue: sortSourceProducedFiles,
//   },
//   {
//     text: "Глубина",
//     value: "maxDepth",
//     align: "start",
//     sortable: true,
//     isVisible: true,
//     width: 84,
//     sortBy: sortSourceMaxDepth,
//     exportValue: sortSourceMaxDepth,
//   },
//   {
//     text: "Чтений",
//     value: "readOps",
//     align: "start",
//     sortable: true,
//     isVisible: true,
//     width: 84,
//     sortBy: sortSourceReadOps,
//     exportValue: sortSourceReadOps,
//   },
// ];

// const openSource = (fileId: number) => {
//   highlightedSourceId.value = fileId;
//   setSelectedSource(fileId);
//   setSelectedFile(fileId);
//   router.push(`/analysis/file/${fileId}`);
// };

// const handleRowClick = (item: AnalysisSourceItem) => {
//   highlightedSourceId.value = item.fileId;
//   setSelectedFile(item.fileId);
// };

// const handleRowDblClick = (item: AnalysisSourceItem) => {
//   openSource(item.fileId);
// };

// const assignHighlightedSource = () => {
//   if (!highlightedSourceId.value) {
//     return;
//   }
//   setSelectedSource(highlightedSourceId.value);
// };

// const handleSnapshotInput = (event: Event) => {
//   snapshotAt.value = !selectedSourceId.value
//     ? ""
//     : (event.target as HTMLInputElement)?.value || "";
// };

// const clearSnapshot = () => {
//   snapshotAt.value = "";
// };
</script>

<style scoped>
@import "../styles/analysis-card-surface.css";

.analysis-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--analysis-header-gap);
  margin-bottom: var(--analysis-header-margin);
  font-size: var(--analysis-heading-size);
  font-weight: var(--analysis-heading-weight);
}

.analysis-page-meta {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  font-weight: var(--analysis-meta-weight);
  line-height: var(--analysis-meta-line-height);
}

.analysis-sources-toolbar {
  display: flex;
  width: 100%;
}

.analysis-sources-toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
}

.analysis-sources-toolbar__input,
.analysis-sources-toolbar__button {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
}

.analysis-sources-toolbar__input {
  width: 220px;
  min-height: 42px;
  padding: 0.6rem 0.8rem;
  border-radius: 0.85rem;
}

.analysis-sources-toolbar__snapshot-shell {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  color: var(--app-text-muted);
}

.analysis-sources-toolbar__snapshot {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.analysis-sources-toolbar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 0;
  border-color: rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  padding: 0.42rem 0.92rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.analysis-sources-toolbar__button:disabled {
  opacity: 0.5;
  cursor: default;
}

.analysis-sources-toolbar__button:not(:disabled):hover {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.analysis-source-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.1rem;
}

.analysis-source-title {
  display: block;
  min-width: 0;
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-source-caption {
  display: block;
  max-width: 100%;
  color: var(--app-text-muted);
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 960px) {
  .analysis-sources-toolbar__controls {
    width: 100%;
  }

  .analysis-sources-toolbar__snapshot-shell,
  .analysis-sources-toolbar__snapshot,
  .analysis-sources-toolbar__input {
    width: 100%;
  }
}
</style>
