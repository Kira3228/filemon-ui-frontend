import { storeToRefs } from "pinia";
import { useAnalysisWorkspaceStore } from "./analysis-workspace.store";

export const useAnalysisWorkspace = () => {
  const store = useAnalysisWorkspaceStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    ensureReportLoaded: store.ensureReportLoaded,
    refreshReport: store.refreshReport,
    resetWorkspaceState: store.resetWorkspaceState,
    reloadReportForDatabaseChange: store.reloadReportForDatabaseChange,
    updateFileMonitoringStatus: store.updateFileMonitoringStatus,
    resetDataFilters: store.resetDataFilters,
    setSelectedSource: store.setSelectedSource,
    toggleSelectedSource: store.toggleSelectedSource,
    setSelectedFile: store.setSelectedFile,
    formatTs: store.formatTs,
    formatLinks: store.formatLinks,
    eventTypeLabel: store.eventTypeLabel,
    badgeClass: store.badgeClass,
    statusBadgeClass: store.statusBadgeClass,
    eventColor: store.eventColor,
    sourceColumns: store.sourceColumns,
    analysisSections: store.analysisSections,
  };
};
