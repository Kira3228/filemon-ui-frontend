import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useTableStore } from "../../ui/store/table.store";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";
import { StatusService } from "@/services/status/status.service";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { matchesFilters } from "@/shared/utils/analysis-filters";

export const useGetStatuses = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("statuses");
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();

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

  const data = computed<AnalysisStatusHistoryItem[]>(() =>
    (query.data.value?.pages.flatMap((page) => page ?? []) ?? []).filter((item) =>
      matchesFilters(item, snapshotAt.value, selectedSourceId.value),
    )
  );

  return {
    ...query,
    data,
  };
};
