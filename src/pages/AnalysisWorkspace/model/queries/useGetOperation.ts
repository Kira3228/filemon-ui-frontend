import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../ui/store/table.store";
import { computed } from "vue";
import { AnalysisOperationItem } from "@/services/operations/analysis-operation-item.type";
import { OperationsService } from "@/services/operations/operations.service";

export const useGetOperation = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("operations");

  const query = useInfiniteQuery<AnalysisOperationItem[]>(
    ["analysis-sources", table.limit],
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

  const data = computed(() =>
    query.data.value?.pages.flat() ?? []
  );

  return {
    ...query,
    data,
  };
};