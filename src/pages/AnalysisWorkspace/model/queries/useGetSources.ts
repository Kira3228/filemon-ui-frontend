import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useTableStore } from "../../ui/store/table.store";
import { AnalysisSourceItem, SourceListResult } from "@/services/source/source.types";
import { SourceService } from "@/services/source/source.service";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { matchesFilters } from "@/shared/utils/analysis-filters";

export const useGetSources = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("sources");
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();

  const query = useInfiniteQuery<SourceListResult>(
    ["analysis-sources", table.limit],
    ({ pageParam = 1 }) =>
      SourceService.getServices({
        page: pageParam,
        limit: table.limit,
      }),
    {
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.items.length < table.limit) {
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

  const data = computed<AnalysisSourceItem[]>(() =>
    (query.data.value?.pages.flatMap((page) => page.items ?? []) ?? []).filter((item) =>
      matchesFilters(item, snapshotAt.value, selectedSourceId.value),
    )
  );

  return {
    ...query,
    data,
  };
};
