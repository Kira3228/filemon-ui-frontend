import { computed } from "vue";
import { buildFullPropagationMermaid } from "../analysis-diagrams";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { useGetAnalysisReport } from "./useGetAnalysisReport";

export const useGetPropagationDiagram = () => {
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();
  const query = useGetAnalysisReport();

  const data = computed(() =>
    buildFullPropagationMermaid(
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
