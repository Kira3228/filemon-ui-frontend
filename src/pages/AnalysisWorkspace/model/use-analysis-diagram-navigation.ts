import { computed } from "vue";
import { useRouter } from "vue-router/composables";
import { storeToRefs } from "pinia";
import { useAnalysisWorkspaceStore } from "./analysis-workspace.store";

export const useAnalysisDiagramNavigation = () => {
  const router = useRouter();
  const store = useAnalysisWorkspaceStore();
  const { report } = storeToRefs(store);

  const fileVersionToFileId = computed(() => {
    const map = new Map<number, number>();
    for (const row of report.value?.diagramData?.fileVersions || []) {
      const fileVersionId = Number(row.fileVersionId);
      const fileId = Number(row.fileId);
      if (Number.isFinite(fileVersionId) && Number.isFinite(fileId)) {
        map.set(fileVersionId, fileId);
      }
    }
    return map;
  });

  const openFile = (fileId: number) => {
    store.setSelectedFile(fileId);
    router.push(`/analysis/file/${fileId}`);
  };

  const openProcesses = () => {
    router.push("/analysis/processes");
  };

  const openOperations = () => {
    router.push("/analysis/operations");
  };

  const handleDiagramNodeDblClick = (nodeId: string) => {
    const fileMatch = nodeId.match(/^F(\d+)$/);
    if (fileMatch) {
      openFile(Number(fileMatch[1]));
      return;
    }

    const fileVersionMatch = nodeId.match(/^FV(\d+)$/);
    if (fileVersionMatch) {
      const fileId = fileVersionToFileId.value.get(Number(fileVersionMatch[1]));
      if (fileId) {
        openFile(fileId);
      }
      return;
    }

    if (/^(PV\d+|PIDG_.+|PGI_.+)$/.test(nodeId)) {
      openProcesses();
      return;
    }

    if (/^(OPR_.+|OPW_.+)$/.test(nodeId)) {
      openOperations();
    }
  };

  const handleDiagramEdgeDblClick = (edgeKey: string) => {
    if (/^F\d+->FV\d+$/.test(edgeKey)) {
      const fileId = Number(edgeKey.match(/^F(\d+)->FV\d+$/)?.[1]);
      if (Number.isFinite(fileId)) {
        openFile(fileId);
        return;
      }
    }

    if (/^F\d+->F\d+$/.test(edgeKey)) {
      openOperations();
      return;
    }

    if (/^(FV\d+->OPR_.+|PV\d+->OPW_.+|OPR_.+->PV\d+|OPW_.+->FV\d+)$/.test(edgeKey)) {
      openOperations();
    }
  };

  return {
    handleDiagramEdgeDblClick,
    handleDiagramNodeDblClick,
  };
};
