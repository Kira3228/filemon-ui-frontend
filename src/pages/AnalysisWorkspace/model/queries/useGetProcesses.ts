import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../ui/store/table.store";
import { computed } from "vue";
import { AnalysisOperationItem } from "@/services/operations/analysis-operation-item.type";
import { OperationsService } from "@/services/operations/operations.service";
import { analysisTableQueryOptions } from "./analysisTableQueryOptions";

export const useGetProcesses = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("processes");

  const query = useInfiniteQuery<AnalysisOperationItem[]>(
    ["analysis-processes", table.limit],
    ({ pageParam = 1 }) =>
      OperationsService.getOperation({
        page: pageParam,
        limit: table.limit,
      }),
    {
      ...analysisTableQueryOptions,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < table.limit) {
          return undefined;
        }

        return allPages.length + 1;
      },
    },


  );

  const data = computed(() =>
    query.data.value?.pages.flat() ?? []
  );

  return {
    ...query,
    data,
  };
};
