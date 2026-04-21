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
import { Header } from "@/components/DataTable";
import { computed } from "vue";
import { filterItemsByFileId } from "../../model/file-route-filter";
import type { AnalysisOperationItem } from "../../model/analysis-report.types";
import { useAnalysisUiSettings } from "../../model/use-analysis-ui-settings";
import { useKeyboardTableSelection } from "../../model/use-keyboard-table-selection";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
import { useRouteFileScope } from "../../model/use-route-file-scope";
import AnalysisFileDetailsToggle from "../components/AnalysisFileDetailsToggle.vue";

const {
  badgeClass,
  eventTypeLabel,
  filteredOperations,
  formatTs,
  setSelectedFile,
  statusBadgeClass,
} = useAnalysisWorkspace();
const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();
const { router, scopedFile, scopedFileId, clearScopedFile } =
  useRouteFileScope();
const scopedOperations = computed(() =>
  filterItemsByFileId(filteredOperations.value, scopedFileId.value),
);
const exportOperationTimestamp = (item: AnalysisOperationItem) =>
  formatTs(item.timestamp);
const exportOperationType = (item: AnalysisOperationItem) =>
  eventTypeLabel(item.type);
const exportOperationTrackingStartedAt = (item: AnalysisOperationItem) =>
  formatTs(item.trackingStartedAt);
const exportOperationStatusTime = (item: AnalysisOperationItem) =>
  formatTs(item.statusTime);

const headers: Header[] = [
  {
    text: "Время операции",
    value: "timestamp",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: exportOperationTimestamp,
  },
  {
    text: "Файл",
    value: "fileName",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 220,
    wrap: true,
  },
  {
    text: "Индексный дескриптор (inode)",
    value: "inode",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 96,
  },
  {
    text: "Тип",
    value: "type",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
    exportValue: exportOperationType,
  },
  {
    text: "Версия файла",
    value: "fileVersionNumber",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 100,
  },
  {
    text: "Процесс",
    value: "processName",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
  },
  {
    text: "Версия процесса",
    value: "processVersionNumber",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 112,
  },
  {
    text: "Оригинальный файл",
    value: "originFileName",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 180,
  },
  {
    text: "Статус файла",
    value: "fileStatus",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 120,
  },
  {
    text: "Глубина",
    value: "depth",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 86,
  },
  {
    text: "Пользователь",
    value: "user",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 110,
  },
  {
    text: "Размер",
    value: "sizeBytes",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
  },
  {
    text: "Старт отслеживания",
    value: "trackingStartedAt",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: exportOperationTrackingStartedAt,
  },
  {
    text: "Время статуса",
    value: "statusTime",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: exportOperationStatusTime,
  },
  {
    text: "Путь",
    value: "path",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 320,
  },
];

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

.event_badge_blue {
  background: #dbeafe;
  color: #1d4ed8;
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

.analysis-file-caption {
  display: block;
  max-width: 100%;
  color: var(--app-text-muted);
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-file-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.1rem;
}

.analysis-file-title {
  display: block;
  min-width: 0;
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-file-inline {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
