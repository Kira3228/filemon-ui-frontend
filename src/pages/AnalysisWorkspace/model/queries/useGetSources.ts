import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useTableStore } from "../../ui/store/table.store";
import { AnalysisSourceItem } from "@/services/source/source.types";
import { SourceService } from "@/services/source/source.service";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { matchesFilters } from "@/shared/utils/analysis-filters";
import { analysisTableQueryOptions } from "./analysisTableQueryOptions";

export const useGetSources = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("sources");
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();

  const query = useInfiniteQuery<AnalysisSourceItem[]>(
    ["analysis-sources", table.limit],
    ({ pageParam = 1 }) =>
      SourceService.getServices({
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

  const data = computed<AnalysisSourceItem[]>(() =>
    (query.data.value?.pages.flatMap((page) => page ?? []) ?? []).filter((item) =>
      matchesFilters(item, snapshotAt.value, selectedSourceId.value),
    )
  );

  return {
    ...query,
    data,
  };
};
