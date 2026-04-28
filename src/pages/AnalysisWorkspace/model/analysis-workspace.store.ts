import { defineStore } from "pinia";
import { ref, watch } from "vue";
import {
  MonitoringAction,
  UpdateMonitoringStatusRequest,
  UpdateMonitoringStatusResult,
} from "@/shared/api/contracts";
import { useApi } from "@/shared/api/http";
import {
  formatAnalysisLinks,
  getAnalysisStatusBadgeClass,
  formatAnalysisTimestamp,
  getAnalysisBadgeClass,
  getAnalysisEventColor,
} from "./analysis-workspace.presentation";
import { getAnalysisEventTypeLabel } from "@/shared/utils/get-analysis-event-type-label";
import { createAnalysisWorkspaceSelectors } from "./analysis-workspace.selectors";
import { AnalysisReportResult } from "./analysis-report.types";
import { analysisSections } from "./analysis-sections";

export const useAnalysisWorkspaceStore = defineStore("analysis-workspace", () => {
  const { get, patch } = useApi();

  const report = ref<AnalysisReportResult | null>(null);
  const loading = ref(false);
  const error = ref("");
  const loadedOnce = ref(false);
  const selectedSourceId = ref<number | null>(null);
  const selectedFileId = ref<number | null>(null);
  const snapshotAt = ref("");

  let activeLoad: Promise<void> | null = null;
  let loadRequestId = 0;

  const {
    allSources,
    fileTreeDiagramMermaid,
    filesById,
    filteredFiles,
    filteredOperations,
    filteredProcessReads,
    filteredRenameHistory,
    filteredStatusHistory,
    filteredTimeline,
    propagationDiagramMermaid,
    selectedChain,
    selectedFile,
    selectedFileRenameHistory,
    selectedFileStatusHistory,
    selectedFileTimeline,
    selectedSource,
    sourceColumns,
    visibleSources,
  } = createAnalysisWorkspaceSelectors({
    report,
    selectedFileId,
    selectedSourceId,
    snapshotAt,
  });

  watch(allSources, (sources) => {
    if (!selectedSourceId.value) { return; }
    const hasSelectedSource = sources.some((item) => item.fileId === selectedSourceId.value);
    if (!hasSelectedSource) {
      selectedSourceId.value = null;
      snapshotAt.value = "";
    }
  }, { immediate: true });

  const ensureReportLoaded = async (force = false) => {
    if (loading.value && activeLoad) {
      await activeLoad;
      return;
    }

    if (loadedOnce.value && report.value && !force) {
      return;
    }

    loading.value = true;
    error.value = "";
    const requestId = ++loadRequestId;
    activeLoad = (async () => {
      try {
        const nextReport = await get<AnalysisReportResult>("/analysis/report", {
          limit: 500,
          _ts: force ? Date.now() : undefined,
        });

        if (requestId !== loadRequestId) {
          return;
        }

        report.value = nextReport;
        loadedOnce.value = true;
      } catch (err: unknown) {
        if (requestId !== loadRequestId) {
          return;
        }

        error.value = err instanceof Error ? err.message : "Не удалось загрузить аналитический отчет.";
        throw err;
      } finally {
        if (requestId === loadRequestId) {
          loading.value = false;
          activeLoad = null;
        }
      }
    })();

    await activeLoad;
  };

  const refreshReport = async () => {
    await ensureReportLoaded(true);
  };

  const resetWorkspaceState = () => {
    loadRequestId += 1;
    activeLoad = null;
    loading.value = false;
    error.value = "";
    loadedOnce.value = false;
    report.value = null;
    selectedSourceId.value = null;
    selectedFileId.value = null;
    snapshotAt.value = "";
  };

  const reloadReportForDatabaseChange = async () => {
    resetWorkspaceState();
    await ensureReportLoaded(true);
  };

  const updateFileMonitoringStatus = async (fileId: number, action: MonitoringAction) => {
    await patch<UpdateMonitoringStatusResult, UpdateMonitoringStatusRequest>(`/analysis/files/${fileId}/status`, { action });
    await refreshReport();
  };

  const setSelectedSource = (fileId: number | null) => {
    selectedSourceId.value = fileId;
    if (!selectedSourceId.value) {
      snapshotAt.value = "";
    }
  };

  const toggleSelectedSource = (fileId: number) => {
    setSelectedSource(selectedSourceId.value === fileId ? null : fileId);
  };

  const resetDataFilters = () => {
    setSelectedSource(null);
  };

  const setSelectedFile = (fileId: number | null) => {
    selectedFileId.value = fileId;
  };

  return {
    report,
    loading,
    error,
    selectedSourceId,
    selectedFileId,
    snapshotAt,
    filesById,
    allSources,
    visibleSources,
    filteredTimeline,
    filteredFiles,
    filteredStatusHistory,
    filteredRenameHistory,
    filteredProcessReads,
    filteredOperations,
    propagationDiagramMermaid,
    fileTreeDiagramMermaid,
    selectedFile,
    selectedSource,
    selectedChain,
    selectedFileTimeline,
    selectedFileRenameHistory,
    selectedFileStatusHistory,
    ensureReportLoaded,
    refreshReport,
    resetWorkspaceState,
    reloadReportForDatabaseChange,
    updateFileMonitoringStatus,
    resetDataFilters,
    setSelectedSource,
    toggleSelectedSource,
    setSelectedFile,
    formatTs: formatAnalysisTimestamp,
    formatLinks: formatAnalysisLinks,
    eventTypeLabel: getAnalysisEventTypeLabel,
    badgeClass: getAnalysisBadgeClass,
    statusBadgeClass: getAnalysisStatusBadgeClass,
    eventColor: getAnalysisEventColor,
    sourceColumns,
    analysisSections,
  };
});
