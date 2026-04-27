import { AnalysisSource, SourceService } from "@/services/source.service";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useTableStore } from "../../../store/table.store";

export const useGetSources = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("sources");

  const query = useInfiniteQuery<AnalysisSource[]>(
    ["analysis-sources", table.limit],
    ({ pageParam = 1 }) =>
      SourceService.getServices({
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