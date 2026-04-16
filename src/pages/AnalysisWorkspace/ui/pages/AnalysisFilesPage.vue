<template>
  <div
    ref="dockRef"
    class="analysis-files-workspace"
    :class="{
      'analysis-files-workspace--details-hidden': !fileDetailsVisible,
      'analysis-files-workspace--dragging': isDragging,
    }"
  >
    <div class="analysis-files-workspace__body">
      <div class="analysis-files-dock" :style="panelStyle">
        <section class="analysis-files-pane">
          <header class="analysis-page-header">
            <span>Все файлы</span>
            <span class="analysis-page-meta">{{ scopedFiles.length }} строк</span>
          </header>
          <div v-if="actionError" class="analysis-files-feedback analysis-files-feedback--error">
            {{ actionError }}
          </div>
          <div ref="tableHostRef" class="analysis-files-card__table" @mousedown.capture="handleTablePointerDown">
            <DataTable
              :headers="headers"
              :items="scopedFiles"
              :items-per-page="1000"
              item-key="fileId"
              :active-row-key="activeRowKey"
              :enable-keyboard-navigation="false"
              export-title="Все_файлы"
              @click-row="handleRowClick"
              @dblclick-row="handleRowDblClick"
            >
              <template #toolbar-actions>
                <div class="analysis-files-toolbar">
                  <AnalysisFileDetailsToggle
                    :active="fileDetailsVisible"
                    @click="setFileDetailsVisible(!fileDetailsVisible)"
                  />
                  <button
                    type="button"
                    class="analysis-status-action"
                    :class="{
                      'analysis-status-action--resume': selectedMonitoringAction?.action === 'resume',
                      'analysis-status-action--pending': isToolbarActionPending,
                    }"
                    :disabled="isToolbarActionDisabled"
                    @click="handleSelectedStatusAction"
                  >
                    {{ isToolbarActionPending ? "Сохранение..." : selectedMonitoringAction?.label || "Отслеживание" }}
                  </button>
                </div>
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
              <template #[`item.name`]="{ item }">
                <div class="analysis-file-cell" :title="`${item.name}\n${item.path}`">
                  <strong class="analysis-file-title">{{ item.name }}</strong>
                  <span class="analysis-file-caption">{{ item.path }}</span>
                </div>
              </template>
              <template #[`item.pathHistory`]="{ item }">
                <div class="analysis-file-inline" :title="item.pathHistory.join(' -> ')">
                  {{ item.pathHistory.join(" -> ") }}
                </div>
              </template>
              <template #[`item.sourceLabels`]="{ item }">
                <div class="analysis-file-inline" :title="formatLinks(item.sourceLabels)">
                  {{ formatLinks(item.sourceLabels) }}
                </div>
              </template>
              <template #[`item.filesystem`]="{ item }">{{ item.filesystem || item.filesystemUuid || "—" }}</template>
              <template #[`item.inode`]="{ value }">{{ value === null || value === undefined ? "—" : value }}</template>
              <template #[`item.originProcess`]="{ value }">{{ value || "—" }}</template>
              <template #[`item.currentStatus`]="{ value }">
                <span class="analysis-badge" :class="statusBadgeClass(value)">{{ value || "—" }}</span>
              </template>
              <template #[`item.user`]="{ value }">{{ value || "—" }}</template>
              <template #[`item.birthTime`]="{ value }">{{ formatTs(value) }}</template>
              <template #[`item.trackingStartedAt`]="{ value }">{{ formatTs(value) }}</template>
            </DataTable>
          </div>
        </section>
      </div>

      <button
        v-if="fileDetailsVisible"
        type="button"
        class="analysis-files-dock__resizer"
        aria-label="Изменить ширину панели файлов"
        @pointerdown="startResize"
      >
        <span />
        <span />
        <span />
      </button>

      <div v-if="fileDetailsVisible" class="analysis-files-workspace__canvas">
        <AnalysisChainDrawer embedded />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { DataTable } from "@/common-components/src/components/DataTable";
import { Header } from "@/common-components/src/components/DataTable";
import { filterItemsByFileId } from "../../model/file-route-filter";
import type { AnalysisFileItem, MonitoringAction } from "../../model/analysis-report.types";
import { useKeyboardTableSelection } from "../../model/use-keyboard-table-selection";
import {
  FILES_DOCK_DEFAULT_WIDTH,
  FILES_DOCK_MAX_WIDTH,
  FILES_DOCK_MIN_WIDTH,
  useAnalysisUiSettings,
} from "../../model/use-analysis-ui-settings";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
import { useRouteFileScope } from "../../model/use-route-file-scope";
import AnalysisChainDrawer from "../components/AnalysisChainDrawer.vue";
import AnalysisFileDetailsToggle from "../components/AnalysisFileDetailsToggle.vue";

const { router, scopedFile, scopedFileId, clearScopedFile } = useRouteFileScope();
const { filteredFiles, formatLinks, formatTs, setSelectedFile, statusBadgeClass, updateFileMonitoringStatus } = useAnalysisWorkspace();
const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();
const dockRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const pendingFileId = ref<number | null>(null);
const actionError = ref("");
const selectedToolbarFile = ref<AnalysisFileItem | null>(null);
const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 0);
const dockWidth = ref(0);
const filesDockRatio = ref(0.55);
const scopedFiles = computed(() => filterItemsByFileId(filteredFiles.value, scopedFileId.value));

type MonitoringActionConfig = {
  action: MonitoringAction;
  label: string;
};

function getMonitoringAction(item: AnalysisFileItem | null): MonitoringActionConfig | null {
  const rawStatusCode = Number(item?.currentStatusCode);
  const statusCode = Number.isFinite(rawStatusCode) && rawStatusCode > 0 ? rawStatusCode : null;
  const statusLabel = String(item?.currentStatus || "").trim().toLowerCase();
  if (statusCode === 1) {
    return {
      action: "untrack" as const,
      label: "Снять с наблюдения",
    };
  }
  if (statusCode === 3) {
    return {
      action: "resume" as const,
      label: "Возврат наблюдения",
    };
  }
  if (statusLabel === "отслеживается") {
    return {
      action: "untrack" as const,
      label: "Снять с наблюдения",
    };
  }
  if (statusLabel === "снят с наблюдения") {
    return {
      action: "resume" as const,
      label: "Возврат наблюдения",
    };
  }
  return null;
}

const exportFileBirthTime = (item: AnalysisFileItem) => formatTs(item.birthTime);
const exportFileTrackingStartedAt = (item: AnalysisFileItem) => formatTs(item.trackingStartedAt);

const headers: Header[] = [
  { text: "Файл", value: "name", align: "start", sortable: true, isVisible: true, width: 200, wrap: true },
  { text: "Статус", value: "currentStatus", align: "start", sortable: true, isVisible: true, width: 96 },
  { text: "Источники", value: "sourceLabels", align: "start", sortable: false, isVisible: true, width: 160 },
  { text: "Пользователь", value: "user", align: "start", sortable: true, isVisible: true, width: 120 },
  { text: "Исходный процесс", value: "originProcess", align: "start", sortable: true, isVisible: true, width: 140 },
  { text: "Размер", value: "sizeBytes", align: "start", sortable: true, isVisible: true, width: 80 },
  { text: "Время создания", value: "birthTime", align: "start", sortable: true, isVisible: true, width: 140, exportValue: exportFileBirthTime },
  { text: "Начало мониторинга", value: "trackingStartedAt", align: "start", sortable: true, isVisible: true, width: 132, exportValue: exportFileTrackingStartedAt },
  { text: "Файловая система", value: "filesystem", align: "start", sortable: true, isVisible: true, width: 170 },
  { text: "Индексный дескриптор (inode)", value: "inode", align: "start", sortable: true, isVisible: true, width: 88 },
  { text: "Версий", value: "versionCount", align: "start", sortable: true, isVisible: true, width: 64 },
  { text: "Глубина", value: "depth", align: "start", sortable: true, isVisible: true, width: 64 },
  { text: "История пути", value: "pathHistory", align: "start", sortable: false, isVisible: true, width: 260 },
];

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleStatusAction = async (item: AnalysisFileItem) => {
  const action = getMonitoringAction(item);
  if (!action || pendingFileId.value !== null) { return; }

  pendingFileId.value = item.fileId;
  actionError.value = "";
  try {
    await updateFileMonitoringStatus(item.fileId, action.action);
  } catch (error: unknown) {
    actionError.value = error instanceof Error ? error.message : "Не удалось изменить статус файла";
  } finally {
    pendingFileId.value = null;
  }
};

const handleSelectedStatusAction = async () => {
  if (!selectedScopedFile.value) { return; }
  await handleStatusAction(selectedScopedFile.value);
};

const {
  hostRef: tableHostRef,
  activeRowKey,
  handlePointerDown: handleTablePointerDown,
  selectItem,
  openItem,
} = useKeyboardTableSelection<AnalysisFileItem>({
  items: scopedFiles,
  getKey: (item) => item.fileId,
  onSelect: (item) => {
    selectedToolbarFile.value = item;
    setSelectedFile(item.fileId);
  },
  onOpen: (item) => openFile(item.fileId),
});

watch(scopedFiles, (items) => {
  if (!items.length) {
    selectedToolbarFile.value = null;
    return;
  }

  const currentFileId = selectedToolbarFile.value?.fileId;
  if (currentFileId === null || currentFileId === undefined) {
    selectedToolbarFile.value = items[0];
    return;
  }

  selectedToolbarFile.value =
    items.find((item) => String(item.fileId) === String(currentFileId)) || items[0];
}, { immediate: true });

const selectedScopedFile = computed(() => selectedToolbarFile.value);

const selectedMonitoringAction = computed(() => getMonitoringAction(selectedScopedFile.value));
const isToolbarActionPending = computed(() => pendingFileId.value !== null);
const isToolbarActionDisabled = computed(() => !selectedScopedFile.value || !selectedMonitoringAction.value || isToolbarActionPending.value);

const clampPanelWidth = (width: number) => {
  if (typeof window === "undefined") { return width; }
  const availableDockWidth = dockWidth.value || dockRef.value?.clientWidth || viewportWidth.value || window.innerWidth;
  const maxWidth = Math.max(FILES_DOCK_MIN_WIDTH, Math.min(FILES_DOCK_MAX_WIDTH, availableDockWidth - 180));
  return Math.max(FILES_DOCK_MIN_WIDTH, Math.min(maxWidth, width));
};

const setPanelWidthFromPx = (width: number) => {
  const availableDockWidth = dockWidth.value || dockRef.value?.clientWidth || viewportWidth.value || width;
  if (!availableDockWidth) {
    return;
  }

  filesDockRatio.value = clampPanelWidth(width) / availableDockWidth;
};

const panelStyle = computed(() => ({
  width: `${clampPanelWidth((dockWidth.value || viewportWidth.value || FILES_DOCK_DEFAULT_WIDTH) * filesDockRatio.value)}px`,
  minWidth: `${FILES_DOCK_MIN_WIDTH}px`,
}));

const stopResize = () => {
  if (typeof window === "undefined") { return; }
  isDragging.value = false;
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
  window.removeEventListener("pointercancel", stopResize);
};

const handleResize = (event: PointerEvent) => {
  if (!dockRef.value) { return; }
  const bounds = dockRef.value.getBoundingClientRect();
  dockWidth.value = bounds.width;
  setPanelWidthFromPx(event.clientX - bounds.left);
};

const startResize = (event: PointerEvent) => {
  if (typeof window === "undefined") { return; }
  event.preventDefault();
  isDragging.value = true;
  window.addEventListener("pointermove", handleResize);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
};

const handleRowClick = (item: AnalysisFileItem) => {
  selectedToolbarFile.value = item;
  selectItem(item);
};

const handleRowDblClick = (item: AnalysisFileItem) => {
  selectedToolbarFile.value = item;
  openItem(item);
};

const handleViewportResize = () => {
  if (typeof window === "undefined") { return; }
  viewportWidth.value = window.innerWidth;
  dockWidth.value = dockRef.value?.clientWidth || viewportWidth.value;
};

onMounted(() => {
  handleViewportResize();
  setPanelWidthFromPx(FILES_DOCK_DEFAULT_WIDTH);

  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleViewportResize);
  }
});

onBeforeUnmount(() => {
  stopResize();
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleViewportResize);
  }
});
</script>
<style scoped>
.analysis-files-workspace {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  --analysis-files-shell-border: var(--app-border);
  --analysis-files-shell-bg:
    linear-gradient(180deg, var(--app-surface-muted), var(--app-surface));
  --analysis-files-pane-bg: var(--app-surface);
  --analysis-files-divider: var(--app-border);
  --analysis-files-resizer-bg:
    linear-gradient(180deg, var(--app-surface-muted), var(--app-surface));
  --analysis-files-canvas-bg: var(--app-surface);
}

.analysis-files-workspace__body {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: auto 16px minmax(180px, 1fr);
  align-items: stretch;
  gap: 0;
  padding: 0.1rem;
  border: 1px solid var(--analysis-files-shell-border);
  border-radius: var(--analysis-card-radius);
  background: var(--analysis-files-shell-bg);
  min-height: 100%;
  height: 100%;
  overflow: hidden;
}

.analysis-files-workspace--dragging {
  user-select: none;
  cursor: col-resize;
}

.analysis-files-dock {
  display: flex;
  min-height: 0;
  min-width: 0;
  padding: 0;
  border-right: 1px solid var(--analysis-files-divider);
}

.analysis-files-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  padding: 0.8rem 0.9rem 0.9rem;
  background: var(--analysis-files-pane-bg);
}

.analysis-files-card__table {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.analysis-files-feedback {
  margin-bottom: 0.6rem;
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 0.8rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.85rem;
  line-height: 1.35;
}

.analysis-files-feedback--error {
  background: rgba(254, 242, 242, 0.95);
  color: #991b1b;
}

.analysis-files-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.analysis-files-dock__resizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 0;
  border-left: 1px solid var(--analysis-files-divider);
  border-right: 1px solid var(--analysis-files-divider);
  background: var(--analysis-files-resizer-bg);
  cursor: col-resize;
}

.analysis-files-dock__resizer span {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.9);
}

.analysis-files-workspace__canvas {
  display: flex;
  min-height: 0;
  min-width: 0;
  margin: 0;
  padding: 0.75rem;
  border-radius: 0;
  background: var(--analysis-files-canvas-bg);
  overflow: hidden;
}

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

.analysis-status-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8.5rem;
  border: 1px solid rgba(180, 83, 9, 0.24);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.98), rgba(254, 215, 170, 0.72));
  color: #9a3412;
  padding: 0.34rem 0.72rem;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.1;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.analysis-status-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(154, 52, 18, 0.12);
}

.analysis-status-action:disabled {
  opacity: 0.62;
  cursor: not-allowed;
  box-shadow: none;
}

.analysis-status-action--pending,
.analysis-status-action--pending:disabled {
  cursor: wait;
}

.analysis-status-action--resume {
  border-color: rgba(22, 101, 52, 0.2);
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.98), rgba(187, 247, 208, 0.78));
  color: #166534;
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

@media (max-width: 1100px) {
  .analysis-files-workspace__body {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
  }

  .analysis-files-dock__resizer,
  .analysis-files-workspace__canvas {
    display: none;
  }

  .analysis-files-pane {
    width: 100% !important;
  }
}
</style>
.analysis-files-workspace--details-hidden .analysis-files-workspace__body {
  grid-template-columns: minmax(0, 1fr);
}
