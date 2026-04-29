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
      <div class="analysis-files-dock">
        <section class="analysis-files-pane">
          <header class="analysis-page-header">
            <span>Все файлы</span>
            <span class="analysis-page-meta">
              {{ scopedFiles.length }} строк
            </span>
          </header>
          <div
            v-if="actionError"
            class="analysis-files-feedback analysis-files-feedback--error"
          >
            {{ actionError }}
          </div>
          <div
            ref="tableHostRef"
            class="analysis-files-card__table"
            @mousedown.capture="handleTablePointerDown"
          >
            <DataTable
              :headers="headers"
              :items="scopedFiles"
              :items-per-page="1000"
              item-key="fileId"
              :active-row-key="activeRowKey"
              :enable-keyboard-navigation="false"
              export-title="Все_файлы"
              @scroll-end="handleScrollEnd"
              @click-row="handleRowClick"
              @dblclick-row="handleRowDblClick"
            >
              <template #toolbar-actions>
                <div class="analysis-files-toolbar">
                  <AnalysisFileDetailsToggle
                    :active="fileDetailsVisible"
                    @click="setFileDetailsVisible(!fileDetailsVisible)"
                  />
                  <UiButton
                    variant="secondary"
                    :disabled="isToolbarActionDisabled"
                    @click="handleSelectedStatusAction"
                  >
                    {{
                      isToolbarActionPending
                        ? "Сохранение..."
                        : selectedMonitoringAction?.label || "Отслеживание"
                    }}
                  </UiButton>
                </div>
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
                  <UiButton
                    type="button"
                    class="analysis-route-filter-remove"
                    aria-label="Сбросить фильтр по файлу"
                    @click="clearScopedFile"
                  >
                    <span class="pi pi-times" />
                  </UiButton>
                </span>
              </template>
              <template #[`item.name`]="{ item }">
                <div
                  class="analysis-file-cell"
                  :title="`${item.name}\n${item.path}`"
                >
                  <strong class="analysis-file-title">{{ item.name }}</strong>
                  <span class="analysis-file-caption">{{ item.path }}</span>
                </div>
              </template>
              <template #[`item.pathHistory`]="{ item }">
                <div
                  class="analysis-file-inline"
                  :title="item.pathHistory.join(' -> ')"
                >
                  {{ item.pathHistory.join(" -> ") }}
                </div>
              </template>
              <template #[`item.sourceLabels`]="{ item }">
                <div
                  class="analysis-file-inline"
                  :title="formatLinks(item.sourceLabels)"
                >
                  {{ formatLinks(item.sourceLabels) }}
                </div>
              </template>
              <template #[`item.filesystem`]="{ item }">{{
                item.filesystem || item.filesystemUuid || "—"
              }}</template>
              <template #[`item.inode`]="{ value }">{{
                value === null || value === undefined ? "—" : value
              }}</template>
              <template #[`item.originProcess`]="{ value }">{{
                value || "—"
              }}</template>
              <template #[`item.currentStatus`]="{ value }">
                <span class="analysis-badge" :class="statusBadgeClass(value)">{{
                  value || "—"
                }}</span>
              </template>
              <template #[`item.user`]="{ value }">{{ value || "—" }}</template>
              <template #[`item.birthTime`]="{ value }">{{
                formatTs(value)
              }}</template>
              <template #[`item.trackingStartedAt`]="{ value }">{{
                formatTs(value)
              }}</template>
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

      <div
        v-if="fileDetailsVisible"
        class="analysis-files-workspace__canvas"
        :style="drawerStyle"
      >
        <AnalysisChainDrawer embedded />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { DataTable } from "@/components/DataTable";
import { filterItemsByFileId } from "../../../model/file-route-filter";
import type { MonitoringAction } from "../../../model/analysis-report.types";
import { useKeyboardTableSelection } from "../../../model/use-keyboard-table-selection";
import {
  SHARED_DOCK_DEFAULT_WIDTH,
  SHARED_DOCK_MAX_WIDTH,
  SHARED_DOCK_MIN_WIDTH,
  useAnalysisUiSettings,
} from "../../../model/use-analysis-ui-settings";
import { useAnalysisWorkspace } from "../../../model/use-analysis-workspace";
import { useRouteFileScope } from "../../../model/use-route-file-scope";
import AnalysisChainDrawer from "../../components/AnalysisChainDrawer/AnalysisChainDrawer.vue";
import AnalysisFileDetailsToggle from "../../components/AnalysisFileDetailsToggle.vue";
import { UiButton } from "@/components/UiButton";
import { headers } from "./heaers";
import { useGetFiles } from "../../../model/queries/useGetFiles";
import { useTableStore } from "../../store/table.store";
import { AnalysisFileItem } from "@/services/files/file.types";

const { router, scopedFile, scopedFileId, clearScopedFile } =
  useRouteFileScope();
const {
  formatLinks,
  formatTs,
  setSelectedFile,
  statusBadgeClass,
  updateFileMonitoringStatus,
} = useAnalysisWorkspace();
const {
  data: files,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetFiles();

const tableStore = useTableStore();
const table = tableStore.getTable("files");
const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();
const dockRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const pendingFileId = ref<number | null>(null);
const actionError = ref("");
const selectedToolbarFile = ref<AnalysisFileItem | null>(null);
const viewportWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 0,
);
const dockWidth = ref(0);
const filesDrawerWidth = ref(SHARED_DOCK_DEFAULT_WIDTH);

const scopedFiles = computed(() =>
  filterItemsByFileId(files.value, scopedFileId.value),
);

type MonitoringActionConfig = {
  action: MonitoringAction;
  label: string;
};

function getMonitoringAction(
  item: AnalysisFileItem | null,
): MonitoringActionConfig | null {
  const rawStatusCode = Number(item?.currentStatusCode);
  const statusCode =
    Number.isFinite(rawStatusCode) && rawStatusCode > 0 ? rawStatusCode : null;
  const statusLabel = String(item?.currentStatus || "")
    .trim()
    .toLowerCase();
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

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleStatusAction = async (item: AnalysisFileItem) => {
  const action = getMonitoringAction(item);
  if (!action || pendingFileId.value !== null) {
    return;
  }

  pendingFileId.value = item.fileId;
  actionError.value = "";
  try {
    await updateFileMonitoringStatus(item.fileId, action.action);
  } catch (error: unknown) {
    actionError.value =
      error instanceof Error
        ? error.message
        : "Не удалось изменить статус файла";
  } finally {
    pendingFileId.value = null;
  }
};

const handleSelectedStatusAction = async () => {
  if (!selectedScopedFile.value) {
    return;
  }
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

watch(
  scopedFiles,
  (items) => {
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
      items.find((item) => String(item.fileId) === String(currentFileId)) ||
      items[0];
  },
  { immediate: true },
);

const selectedScopedFile = computed(() => selectedToolbarFile.value);

const selectedMonitoringAction = computed(() =>
  getMonitoringAction(selectedScopedFile.value),
);
const isToolbarActionPending = computed(() => pendingFileId.value !== null);
const isToolbarActionDisabled = computed(
  () =>
    !selectedScopedFile.value ||
    !selectedMonitoringAction.value ||
    isToolbarActionPending.value,
);

const clampDrawerWidth = (width: number) => {
  if (typeof window === "undefined") {
    return width;
  }
  const availableDockWidth =
    dockWidth.value ||
    dockRef.value?.clientWidth ||
    viewportWidth.value ||
    window.innerWidth;
  const maxWidth = Math.max(
    SHARED_DOCK_MIN_WIDTH,
    Math.min(SHARED_DOCK_MAX_WIDTH, availableDockWidth - 680),
  );
  return Math.max(SHARED_DOCK_MIN_WIDTH, Math.min(maxWidth, width));
};

const setDrawerWidthFromPx = (width: number) => {
  filesDrawerWidth.value = clampDrawerWidth(width);
};

const drawerStyle = computed(() => ({
  width: `${clampDrawerWidth(filesDrawerWidth.value)}px`,
  minWidth: `${SHARED_DOCK_MIN_WIDTH}px`,
}));

const stopResize = () => {
  if (typeof window === "undefined") {
    return;
  }
  isDragging.value = false;
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
  window.removeEventListener("pointercancel", stopResize);
};

const handleResize = (event: PointerEvent) => {
  if (!dockRef.value) {
    return;
  }
  const bounds = dockRef.value.getBoundingClientRect();
  dockWidth.value = bounds.width;
  setDrawerWidthFromPx(bounds.right - event.clientX);
};

const startResize = (event: PointerEvent) => {
  if (typeof window === "undefined") {
    return;
  }
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

const handleScrollEnd = () => {
  if (isFetchingNextPage.value || hasNextPage?.value === false) {
    return;
  }
  const nextPage = table.page + 1;
  table.page = nextPage;
  fetchNextPage();
};

const handleViewportResize = () => {
  if (typeof window === "undefined") {
    return;
  }
  viewportWidth.value = window.innerWidth;
  dockWidth.value = dockRef.value?.clientWidth || viewportWidth.value;
};

onMounted(() => {
  handleViewportResize();
  setDrawerWidthFromPx(SHARED_DOCK_DEFAULT_WIDTH);

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
<style scoped src="./AnalysisFilesPage.css"></style>
