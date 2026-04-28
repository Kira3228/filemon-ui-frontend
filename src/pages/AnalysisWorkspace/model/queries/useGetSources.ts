import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useTableStore } from "../../ui/store/table.store";
import { AnalysisSourceItem } from "@/services/source/source.types";
import { SourceService } from "@/services/source/source.service";

export const useGetSources = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("sources");

  const query = useInfiniteQuery<AnalysisSourceItem[]>(
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