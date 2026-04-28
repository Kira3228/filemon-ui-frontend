<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>Все файловые операции</span>
      <span class="analysis-page-meta"
        >{{ scopedOperations.length }} последних операций</span
      >
    </header>
    <div
      ref="tableHostRef"
      class="analysis-page-table-shell"
      @mousedown.capture="handleTablePointerDown"
    >
      <DataTable
        :headers="headers"
        :items="scopedOperations"
        :items-per-page="1000"
        item-key="id"
        :active-row-key="activeRowKey"
        :enable-keyboard-navigation="false"
        export-title="Все_файловые_операции"
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
        <template #[`item.trackingStartedAt`]="{ value }">{{
          formatTs(value)
        }}</template>
        <template #[`item.statusTime`]="{ value }">{{
          formatTs(value)
        }}</template>
        <template #[`item.type`]="{ value }">
          <span class="analysis-badge" :class="badgeClass(value)">{{
            eventTypeLabel(value)
          }}</span>
        </template>
        <template #[`item.fileName`]="{ item }">
          <div
            class="analysis-file-cell"
            :title="`${item.fileName}\n${item.path}`"
          >
            <strong class="analysis-file-title">{{ item.fileName }}</strong>
            <span class="analysis-file-caption">{{ item.path }}</span>
          </div>
        </template>
        <template #[`item.inode`]="{ value }">{{
          value === null || value === undefined ? "—" : value
        }}</template>
        <template #[`item.fileVersionNumber`]="{ value }">{{
          value === null || value === undefined ? "—" : `v${value}`
        }}</template>
        <template #[`item.processName`]="{ value }">{{
          value || "—"
        }}</template>
        <template #[`item.processVersionNumber`]="{ value }">{{
          value === null || value === undefined ? "—" : `v${value}`
        }}</template>
        <template #[`item.originFileName`]="{ item }">
          <div
            class="analysis-file-inline"
            :title="item.originFilePath || item.originFileName || '—'"
          >
            <span v-if="item.originFileName" class="analysis-file-name">{{
              item.originFileName
            }}</span>
            <span v-else>—</span>
          </div>
        </template>
        <template #[`item.fileStatus`]="{ value }">
          <span class="analysis-badge" :class="statusBadgeClass(value)">{{
            value || "—"
          }}</span>
        </template>
        <template #[`item.depth`]="{ value }">{{
          value === null || value === undefined ? "—" : value
        }}</template>
        <template #[`item.user`]="{ value }">{{ value || "—" }}</template>
        <template #[`item.sizeBytes`]="{ value }">{{
          value === null || value === undefined ? "—" : value
        }}</template>
      </DataTable>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { DataTable } from "@/components/DataTable";
import { computed } from "vue";
import { filterItemsByFileId } from "../../../model/file-route-filter";
import type { AnalysisOperationItem } from "../../../model/analysis-report.types";
import { useAnalysisUiSettings } from "../../../model/use-analysis-ui-settings";
import { useKeyboardTableSelection } from "../../../model/use-keyboard-table-selection";
import { useAnalysisWorkspace } from "../../../model/use-analysis-workspace";
import { useRouteFileScope } from "../../../model/use-route-file-scope";
import AnalysisFileDetailsToggle from "../../components/AnalysisFileDetailsToggle.vue";
import { headers } from "./headers";
import { useGetOperation } from "../../../model/queries/useGetOperation";

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

const scopedOperations = computed(() =>
  filterItemsByFileId(operationData.value, scopedFileId.value),
);

const { data: operationData } = useGetOperation();

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleRowClick = (item: AnalysisOperationItem) => {
  selectItem(item);
};

const handleRowDblClick = (item: AnalysisOperationItem) => {
  openItem(item);
};

const {
  hostRef: tableHostRef,
  activeRowKey,
  handlePointerDown: handleTablePointerDown,
  selectItem,
  openItem,
} = useKeyboardTableSelection<AnalysisOperationItem>({
  items: scopedOperations,
  getKey: (item) => item.id,
  onSelect: (item) => {
    if (!item.fileId) {
      return;
    }
    setSelectedFile(item.fileId);
  },
  onOpen: (item) => {
    if (!item.fileId) {
      return;
    }
    openFile(item.fileId);
  },
});
</script>
<style scoped src="./AnalysisOperationsPage.css"></style>
