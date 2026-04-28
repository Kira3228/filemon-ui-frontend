<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>События</span>
      <span class="analysis-page-meta"
        >{{ scopedTimeline.length }} событий</span
      >
    </header>
    <div
      ref="tableHostRef"
      class="analysis-page-table-shell"
      @mousedown.capture="handleTablePointerDown"
    >
      <DataTable
        :headers="headers"
        :items="scopedTimeline"
        :items-per-page="1000"
        item-key="id"
        :active-row-key="activeRowKey"
        :enable-keyboard-navigation="false"
        export-title="События"
        @click-row="handleRowClick"
        @dblclick-row="handleRowDblClick"
      >
        <template #toolbar-actions>
          <AnalysisFileDetailsToggle
            :active="fileDetailsVisible"
            @click="setFileDetailsVisible(!fileDetailsVisible)"
          />
        </template>
        <template #status-filters>
          <span
            v-if="scopedFileId !== null"
            class="analysis-route-filter-chip"
            :title="scopedFile?.path || `Файл #${scopedFileId}`"
          >
            <span class="analysis-route-filter-text">
              <strong>Файл:</strong>
              {{ scopedFile?.name || `#${scopedFileId}` }}
            </span>
            <button
              type="button"
              class="analysis-route-filter-remove"
              aria-label="Сбросить фильтр по файлу"
              @click="clearScopedFile"
            >
              <span class="pi pi-times" />
            </button>
          </span>
        </template>
        <template #[`item.timestamp`]="{ value }">{{
          formatTs(value)
        }}</template>
        <template #[`item.type`]="{ value }">
          <span class="analysis-badge" :class="badgeClass(value)">{{
            eventTypeLabel(value)
          }}</span>
        </template>
        <template #[`item.fileStatus`]="{ value }">
          <span class="analysis-badge" :class="statusBadgeClass(value)">{{
            value || "—"
          }}</span>
        </template>
        <template #[`item.entity`]="{ item }">
          <span v-if="item.fileName" class="analysis-file-name">{{
            item.fileName
          }}</span>
          <span v-else>{{ item.processLabel || "—" }}</span>
        </template>
      </DataTable>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { DataTable } from "@/components/DataTable";
import { computed } from "vue";
import { filterItemsByFileId } from "../../../model/file-route-filter";
import { useAnalysisUiSettings } from "../../../model/use-analysis-ui-settings";
import { useKeyboardTableSelection } from "../../../model/use-keyboard-table-selection";
import { useAnalysisWorkspace } from "../../../model/use-analysis-workspace";
import { useRouteFileScope } from "../../../model/use-route-file-scope";
import AnalysisFileDetailsToggle from "../../components/AnalysisFileDetailsToggle.vue";
import { headers } from "./headers";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { useGetTimeline } from "./hooks/useGetTimeline";

const {
  badgeClass,
  eventTypeLabel,

  formatTs,
  setSelectedFile,
  statusBadgeClass,
} = useAnalysisWorkspace();

const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();

const { router, scopedFile, scopedFileId, clearScopedFile } =
  useRouteFileScope();

const scopedTimeline = computed(() =>
  filterItemsByFileId(filteredTimeline.value, scopedFileId.value),
);

const { data: filteredTimeline } = useGetTimeline();
const openFile = (fileId?: number) => {
  if (!fileId) return;
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const {
  hostRef: tableHostRef,
  activeRowKey,
  handlePointerDown: handleTablePointerDown,
  selectItem,
  openItem,
} = useKeyboardTableSelection<AnalysisTimelineEntry>({
  items: scopedTimeline,
  getKey: (item) => item.id,
  onSelect: (item) => {
    if (!item.fileId) {
      return;
    }
    setSelectedFile(item.fileId);
  },
  onOpen: (item) => openFile(item.fileId),
});

const handleRowClick = (item: AnalysisTimelineEntry) => selectItem(item);
const handleRowDblClick = (item: AnalysisTimelineEntry) => openItem(item);
</script>
<style scoped src="./AnalysisTimelinePage.css"></style>
