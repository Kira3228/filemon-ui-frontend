import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../ui/store/table.store";
import { computed } from "vue";
import { AnalysisOperationItem } from "@/services/operations/analysis-operation-item.type";
import { OperationsService } from "@/services/operations/operations.service";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { matchesFilters } from "@/shared/utils/analysis-filters";

export const useGetOperation = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("operations");
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();

  const query = useInfiniteQuery<AnalysisOperationItem[]>(
    ["analysis-operations", table.limit],
    ({ pageParam = 1 }) =>
      OperationsService.getOperation({
        page: pageParam,
        limit: table.limit,
      }),
    {
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < table.limit) {
          return undefined;
        }

        return allPages.length + 1;
      },
      onSuccess: () => {
        const nextPage = table.page + 1;
        table.page = nextPage;
      },
    },


  );

  const data = computed<AnalysisOperationItem[]>(() =>
    (query.data.value?.pages.flatMap((page) => page ?? []) ?? []).filter((item) =>
      matchesFilters(item, snapshotAt.value, selectedSourceId.value),
    )
  );

  return {
    ...query,
    data,
  };
};
