<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>История статусов</span>
      <span class="analysis-page-meta">{{ scopedStatusHistory.length }} записей</span>
    </header>
    <div ref="tableHostRef" class="analysis-page-table-shell" @mousedown.capture="handleTablePointerDown">
      <DataTable
        :headers="headers"
        :items="scopedStatusHistory"
        :items-per-page="1000"
        item-key="id"
        :active-row-key="activeRowKey"
        :enable-keyboard-navigation="false"
        export-title="История_статусов"
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
              <strong>Файл:</strong> {{ scopedFile?.name || `#${scopedFileId}` }}
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
        <template #item.createdAt="{ value }">{{ formatTs(value) }}</template>
        <template #item.status="{ value }">
          <span class="analysis-badge" :class="statusBadgeClass(value)">{{ value || "—" }}</span>
        </template>
        <template #item.changeSource="{ value }">
          {{ value === "MANUAL" ? "Ручное изменение" : "Системное изменение" }}
        </template>
      </DataTable>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { DataTable } from "@/common-components/src/components/DataTable";
import { Header } from "@/common-components/src/components/DataTable";
import { computed } from "vue";
import { filterItemsByFileId } from "../../model/file-route-filter";
import type { AnalysisStatusHistoryItem } from "../../model/analysis-report.types";
import { useAnalysisUiSettings } from "../../model/use-analysis-ui-settings";
import { useKeyboardTableSelection } from "../../model/use-keyboard-table-selection";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
import { useRouteFileScope } from "../../model/use-route-file-scope";
import AnalysisFileDetailsToggle from "../components/AnalysisFileDetailsToggle.vue";

const { filteredStatusHistory, formatTs, setSelectedFile, statusBadgeClass } = useAnalysisWorkspace();
const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();
const { router, scopedFile, scopedFileId, clearScopedFile } = useRouteFileScope();
const scopedStatusHistory = computed(() =>
  filterItemsByFileId(filteredStatusHistory.value, scopedFileId.value),
);
const exportStatusChangeSource = (item: AnalysisStatusHistoryItem) =>
  item.changeSource === "MANUAL" ? "Ручное изменение" : "Системное изменение";
const exportStatusCreatedAt = (item: AnalysisStatusHistoryItem) => formatTs(item.createdAt);

const headers: Header[] = [
  { text: "Файл", value: "fileName", align: "start", sortable: true, isVisible: true, width: 120 },
  { text: "Путь", value: "path", align: "start", sortable: false, isVisible: true, width: 320 },
  { text: "UUID файловой системы", value: "filesystemUuid", align: "start", sortable: true, isVisible: true, width: 180 },
  { text: "Статус", value: "status", align: "start", sortable: true, isVisible: true, width: 120 },
  { text: "Источник", value: "changeSource", align: "start", sortable: true, isVisible: true, width: 140, exportValue: exportStatusChangeSource },
  { text: "Время", value: "createdAt", align: "start", sortable: true, isVisible: true, width: 150, exportValue: exportStatusCreatedAt },
];

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const {
  hostRef: tableHostRef,
  activeRowKey,
  handlePointerDown: handleTablePointerDown,
  selectItem,
  openItem,
} = useKeyboardTableSelection<AnalysisStatusHistoryItem>({
  items: scopedStatusHistory,
  getKey: (item) => item.id,
  onSelect: (item) => setSelectedFile(item.fileId),
  onOpen: (item) => openFile(item.fileId),
});

const handleRowClick = (item: AnalysisStatusHistoryItem) => selectItem(item);
const handleRowDblClick = (item: AnalysisStatusHistoryItem) => openItem(item);
</script>
<style scoped>
@import "../styles/analysis-card-surface.css";

.analysis-page-header {
  display: flex;
  justify-content: space-between;
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

.analysis-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: var(--analysis-badge-padding);
  font-size: var(--analysis-badge-font-size);
  font-weight: 600;
}

.event_badge_red {
  background: #fee2e2;
  color: #b91c1c;
}

.event_badge_green {
  background: #dcfce7;
  color: #15803d;
}

.event_badge_yellow {
  background: #fef3c7;
  color: #b45309;
}

.event_badge_gray {
  background: #e5e7eb;
  color: #374151;
}

.analysis-route-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  min-width: 0;
  border: 1px solid rgba(22, 101, 52, 0.18);
  border-radius: 999px;
  background: rgba(220, 252, 231, 0.9);
  color: #166534;
  padding: 0.18rem 0.55rem;
}

.analysis-route-filter-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-route-filter-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  flex: 0 0 auto;
  padding: 0;
}

.analysis-route-filter-remove:hover {
  background: rgba(22, 101, 52, 0.12);
}
</style>
