import { computed } from "vue";
import { buildCompactFileTreeMermaid } from "../analysis-diagrams";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { useGetAnalysisReport } from "./useGetAnalysisReport";

export const useGetFileTreeDiagram = () => {
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();
  const query = useGetAnalysisReport();

  const data = computed(() =>
    buildCompactFileTreeMermaid(
      query.data.value ?? null,
      selectedSourceId.value,
      snapshotAt.value,
    ),
  );

  return {
    ...query,
    data,
  };
};
