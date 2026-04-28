import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useTableStore } from "../../ui/store/table.store";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";
import { StatusService } from "@/services/status/status.service";

export const useGetStatuses = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("statuses");

  const query = useInfiniteQuery<AnalysisStatusHistoryItem[]>(
    ["analysis-statuses", table.limit],
    ({ pageParam = 1 }) =>
      StatusService.getStatuses({
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