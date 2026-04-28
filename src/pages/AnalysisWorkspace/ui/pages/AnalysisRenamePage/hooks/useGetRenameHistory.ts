import { AnalysisRenameHistoryItem } from "@/services/rename/rename-history.type";
import { RenameService } from "@/services/rename/rename.service";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../../store/table.store";
import { computed } from "vue";


export const useGetRenameHistory = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("rename-history");

  const query = useInfiniteQuery<AnalysisRenameHistoryItem[]>(
    ["analysis-sources", table.limit],
    ({ pageParam = 1 }) =>
      RenameService.getRenameHistory({
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