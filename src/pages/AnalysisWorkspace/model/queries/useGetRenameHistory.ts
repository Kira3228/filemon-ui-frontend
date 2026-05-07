import { AnalysisRenameHistoryItem } from "@/services/rename/rename-history.type";
import { RenameService } from "@/services/rename/rename.service";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../ui/store/table.store";
import { computed } from "vue";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { matchesFilters } from "@/shared/utils/analysis-filters";
import { analysisTableQueryOptions } from "./analysisTableQueryOptions";


export const useGetRenameHistory = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("rename-history");
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();

  const query = useInfiniteQuery<AnalysisRenameHistoryItem[]>(
    ["analysis-rename-history", table.limit],
    ({ pageParam = 1 }) =>
      RenameService.getRenameHistory({
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

  const data = computed<AnalysisRenameHistoryItem[]>(() =>
    (query.data.value?.pages.flatMap((page) => page ?? []) ?? []).filter((item) =>
      matchesFilters(item, snapshotAt.value, selectedSourceId.value),
    )
  );

  return {
    ...query,
    data,
  };
};
