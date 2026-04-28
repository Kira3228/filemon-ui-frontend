<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>Источники</span>
      <span class="analysis-page-meta">{{ sources.length }} строк</span>
    </header>

    <div class="analysis-page-table-shell">
      <DataTable
        :headers="headers"
        :items="sources"
        :items-per-page="1000"
        item-key="fileId"
        :active-row-key="highlightedSourceId"
        :enable-keyboard-navigation="false"
        export-title="Источники"
        @scroll-end="handleScrollEnd"
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
      </DataTable>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { DataTable } from "@/components/DataTable";
import { ref, watch } from "vue";
import { useRouter } from "vue-router/composables";
import { useAnalysisUiSettings } from "../../../model/use-analysis-ui-settings";
import { useAnalysisWorkspace } from "../../../model/use-analysis-workspace";
import AnalysisFileDetailsToggle from "../../components/AnalysisFileDetailsToggle.vue";

import { UiButton } from "@/components/UiButton";
import { useGetSources } from "../../../model/queries/useGetSources";
import { useTableStore } from "../../store/table.store";
import { headers } from "./headers";
import { AnalysisSourceItem } from "@/services/source/source.types";

const router = useRouter();

const {
  resetDataFilters,
  selectedSourceId,
  setSelectedFile,
  setSelectedSource,
  snapshotAt,
} = useAnalysisWorkspace();

const {
  data: sources,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetSources();

const tableStore = useTableStore();
const table = tableStore.getTable("sources");

const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();

const SNAPSHOT_HINT = "Снимок на момент времени";

const highlightedSourceId = ref<number | null>(selectedSourceId.value);

watch(selectedSourceId, (value) => {
  if (!highlightedSourceId.value) {
    highlightedSourceId.value = value;
  }
});

watch(
  sources,
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

const openSource = (fileId: number) => {
  highlightedSourceId.value = fileId;
  setSelectedSource(fileId);
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleRowClick = (item: AnalysisSourceItem) => {
  highlightedSourceId.value = item.fileId;
  setSelectedFile(item.fileId);
};

const handleRowDblClick = (item: AnalysisSourceItem) => {
  openSource(item.fileId);
};

const assignHighlightedSource = () => {
  if (!highlightedSourceId.value) {
    return;
  }
  setSelectedSource(highlightedSourceId.value);
};

const handleSnapshotInput = (event: Event) => {
  snapshotAt.value = !selectedSourceId.value
    ? ""
    : (event.target as HTMLInputElement)?.value || "";
};

const clearSnapshot = () => {
  snapshotAt.value = "";
};

const handleScrollEnd = () => {
  if (isFetchingNextPage.value || hasNextPage?.value === false) {
    return;
  }
  const nextPage = table.page + 1;
  table.page = nextPage;
  fetchNextPage();
};
</script>

<style src="./AnalysisSourcesPage.css" scoped></style>
