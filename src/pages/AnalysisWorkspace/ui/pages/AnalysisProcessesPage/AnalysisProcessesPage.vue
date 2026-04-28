<template>
  <section
    ref="processesRootRef"
    class="app-surface analysis-page-card"
    @focusin.capture="handleProcessesFocusIn"
    @keydown.capture="handleProcessesKeydown"
  >
    <header class="analysis-page-header">
      <span>Процессы и операции записи</span>
      <span class="analysis-page-meta"
        >{{ scopedProcessRows.length }} событий · {{ scopedProcessCount }} групп
        записи · {{ processBuckets.length }} процессов</span
      >
    </header>

    <div ref="processesBodyRef" class="analysis-processes-body">
      <div
        class="analysis-processes-table-region"
        :class="{
          'analysis-processes-table-region--full':
            !showProcessCards || !selectedProcess,
        }"
        :style="tableRegionStyle"
      >
        <AnalysisProcessesTable
          :headers="processHeaders"
          :process-table-items="processTableItems"
          :active-row-key="activeRowKey"
          :process-export-headers="processExportHeaders"
          :process-export-rows="processExportRows"
          :process-export-row-kinds="processExportRowKinds"
          :expanded-process-buckets="expandedProcessBuckets"
          :scoped-file-id="scopedFileId"
          :scoped-file-name="scopedFileName"
          :scoped-file-path="scopedFilePath"
          :is-process-bucket-expanded="isProcessBucketExpanded"
          :is-process-group-expanded="isProcessGroupExpanded"
          :build-process-bucket-title="buildProcessBucketTitle"
          :build-process-group-title="buildProcessGroupTitle"
          :process-bucket-summary="processBucketSummary"
          :format-meta-value="formatMetaValue"
          :is-process-group-row="isProcessGroupRow"
          :selected-process-group-key="selectedProcessGroupKey"
          :badge-class="badgeClass"
          :event-type-label="eventTypeLabel"
          :format-ts="formatTs"
          :show-process-cards="showProcessCards"
          @clear-scoped-file="clearScopedFile"
          @row-click="handleRowClick"
          @row-dblclick="handleRowDblClick"
          @active-row-change="handleActiveRowChange"
          @expanded-buckets-change="handleExpandedProcessBucketsUpdate"
          @toggle-process-cards="showProcessCards = !showProcessCards"
          @process-bucket-click="handleProcessBucketClick"
          @process-group-click="handleProcessGroupRowClick"
          @process-bucket-keydown="handleProcessBucketKeydown"
          @process-group-keydown="handleProcessGroupRowKeydown"
        />
      </div>

      <UiButton
        v-if="showProcessCards && selectedProcess"
        type="button"
        class="analysis-processes-resizer"
        :class="{ 'analysis-processes-resizer--dragging': isResizingPanels }"
        aria-label="Изменить высоту карточки версии процесса"
        @pointerdown="startPanelResize"
      >
        <span />
        <span />
        <span />
      </UiButton>

      <div
        v-if="showProcessCards && selectedProcess"
        class="analysis-processes-cards-region"
        :style="cardsRegionStyle"
      >
        <AnalysisProcessesSelectionCards
          :selected-process="selectedProcess"
          :format-ts="formatTs"
          :badge-class="badgeClass"
          :event-type-label="eventTypeLabel"
          @open-file="openFile"
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UiButton } from "@/components/UiButton";
import { useAnalysisProcessesInteractions } from "@/pages/AnalysisWorkspace/model/use-analysis-processes-interactions";
import { useAnalysisProcessesTable } from "@/pages/AnalysisWorkspace/model/use-analysis-processes-table";
import { useAnalysisWorkspace } from "@/pages/AnalysisWorkspace/model/use-analysis-workspace";
import { useRouteFileScope } from "@/pages/AnalysisWorkspace/model/use-route-file-scope";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AnalysisProcessesSelectionCards from "../../components/AnalysisProcessesSelectionCards.vue";
import AnalysisProcessesTable from "../../components/AnalysisProcessesTable.vue";
import { processExportHeaders, processHeaders } from "./headers";
import { useGetProcesses } from "./hooks/useGetProcesses";

const { data: processesData } = useGetProcesses();

const {
  badgeClass,
  eventTypeLabel,
  filesById,
  formatTs,
  // report,
  selectedSourceId,
  setSelectedFile,
  snapshotAt,
} = useAnalysisWorkspace();

const { router, scopedFile, scopedFileId, clearScopedFile } =
  useRouteFileScope();

const processesRootRef = ref<HTMLElement | null>(null);
const processesBodyRef = ref<HTMLElement | null>(null);
const activeRowKey = ref<string | null>(null);
const expandedProcessBuckets = ref<string[]>([]);
const expandedProcessGroups = ref<string[]>([]);
const selectedProcessGroupKey = ref<string | null>(null);
const processesPanelsHeight = ref(0);
const processCardsRatio = ref(0.34);
const isResizingPanels = ref(false);
const showProcessCards = ref(true);

const PROCESS_PANEL_RESIZER_HEIGHT = 14;
const PROCESS_TABLE_MIN_HEIGHT = 280;
const PROCESS_CARDS_MIN_HEIGHT = 180;

const scopedFileName = computed(
  () => scopedFile.value?.name || `#${scopedFileId.value}`,
);
const scopedFilePath = computed(
  () => scopedFile.value?.path || `Файл #${scopedFileId.value}`,
);

const {
  buildProcessBucketTitle,
  buildProcessGroupTitle,
  formatMetaValue,
  isProcessGroupRow,
  processBucketSummary,
  processBuckets,
  processExportRowKinds,
  processExportRows,
  processGroups,
  processGroupsByKey,
  processTableItems,
  processTableItemsById,
  scopedProcessCount,
  scopedProcessRows,
} = useAnalysisProcessesTable({
  eventTypeLabel,
  expandedProcessGroups,
  filesById,
  formatTs,
  processesData,
  scopedFileId,
  selectedSourceId,
  snapshotAt,
});

const {
  handleActiveRowChange,
  handleExpandedProcessBucketsUpdate,
  handleProcessBucketClick,
  handleProcessBucketKeydown,
  handleProcessGroupRowClick,
  handleProcessGroupRowKeydown,
  handleProcessesFocusIn,
  handleProcessesKeydown,
  handleRowClick,
  handleRowDblClick,
  isProcessBucketExpanded,
  isProcessGroupExpanded,
  openFile,
  selectedProcess,
} = useAnalysisProcessesInteractions({
  activeRowKey,
  expandedProcessBuckets,
  expandedProcessGroups,
  processBuckets,
  processGroups,
  processGroupsByKey,
  processesRootRef,
  scopedProcessRows,
  processTableItemsById,
  selectedProcessGroupKey,
  setSelectedFile,
  pushToFile: (fileId: number) => {
    router.push(`/analysis/file/${fileId}`);
  },
});

const availablePanelsHeight = computed(() =>
  Math.max(0, processesPanelsHeight.value - PROCESS_PANEL_RESIZER_HEIGHT),
);

const clampCardsHeight = (height: number) => {
  const available = availablePanelsHeight.value;
  if (!available) {
    return 0;
  }

  const maxCardsHeight = Math.max(
    PROCESS_CARDS_MIN_HEIGHT,
    available - PROCESS_TABLE_MIN_HEIGHT,
  );
  return Math.max(PROCESS_CARDS_MIN_HEIGHT, Math.min(maxCardsHeight, height));
};

const resolvedCardsHeight = computed(() => {
  if (!showProcessCards.value || !selectedProcess.value) {
    return 0;
  }

  const available = availablePanelsHeight.value;
  if (!available) {
    return PROCESS_CARDS_MIN_HEIGHT;
  }

  return clampCardsHeight(available * processCardsRatio.value);
});

const resolvedTableHeight = computed(() => {
  if (!showProcessCards.value || !selectedProcess.value) {
    return null;
  }

  return Math.max(
    PROCESS_TABLE_MIN_HEIGHT,
    availablePanelsHeight.value - resolvedCardsHeight.value,
  );
});

const tableRegionStyle = computed(() => {
  if (
    !showProcessCards.value ||
    !selectedProcess.value ||
    resolvedTableHeight.value === null
  ) {
    return undefined;
  }

  return {
    height: `${resolvedTableHeight.value}px`,
  };
});

const cardsRegionStyle = computed(() => {
  if (!showProcessCards.value || !selectedProcess.value) {
    return undefined;
  }

  return {
    height: `${resolvedCardsHeight.value}px`,
  };
});

const syncProcessPanelsHeight = () => {
  processesPanelsHeight.value = processesBodyRef.value?.clientHeight || 0;
};

let processesBodyResizeObserver: ResizeObserver | null = null;

const updateCardsRatioFromPointer = (clientY: number) => {
  const bounds = processesBodyRef.value?.getBoundingClientRect();
  if (!bounds) {
    return;
  }

  const nextCardsHeight = clampCardsHeight(bounds.bottom - clientY);
  const available = availablePanelsHeight.value;
  if (!available) {
    return;
  }

  processCardsRatio.value = nextCardsHeight / available;
};

const stopPanelResize = () => {
  if (typeof window === "undefined") {
    return;
  }

  isResizingPanels.value = false;
  window.removeEventListener("pointermove", handlePanelResize);
  window.removeEventListener("pointerup", stopPanelResize);
  window.removeEventListener("pointercancel", stopPanelResize);
};

const handlePanelResize = (event: PointerEvent) => {
  updateCardsRatioFromPointer(event.clientY);
};

const startPanelResize = (event: PointerEvent) => {
  if (typeof window === "undefined" || !selectedProcess.value) {
    return;
  }

  event.preventDefault();
  isResizingPanels.value = true;
  updateCardsRatioFromPointer(event.clientY);
  window.addEventListener("pointermove", handlePanelResize);
  window.addEventListener("pointerup", stopPanelResize);
  window.addEventListener("pointercancel", stopPanelResize);
};

watch(selectedProcess, () => {
  syncProcessPanelsHeight();
});

onMounted(() => {
  syncProcessPanelsHeight();

  if (typeof ResizeObserver !== "undefined") {
    processesBodyResizeObserver = new ResizeObserver(() => {
      syncProcessPanelsHeight();
    });
    if (processesBodyRef.value) {
      processesBodyResizeObserver.observe(processesBodyRef.value);
    }
  }
});

onBeforeUnmount(() => {
  stopPanelResize();
  processesBodyResizeObserver?.disconnect();
});
</script>

<style scoped src="./AnalysisProcessesPage.css"></style>
