import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../ui/store/table.store";
import { FileService } from "@/services/files/files.service";
import { AnalysisFileItem } from "@/services/files/file.types";
import { computed } from "vue";
import { useAnalysisWorkspace } from "../use-analysis-workspace";
import { matchesFilters } from "@/shared/utils/analysis-filters";
import { analysisTableQueryOptions } from "./analysisTableQueryOptions";

export const useGetFiles = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("files");
  const { selectedSourceId, snapshotAt } = useAnalysisWorkspace();

  const query = useInfiniteQuery<AnalysisFileItem[]>(
    ["analysis-files", table.limit],
    ({ pageParam = 1 }) =>
      FileService.getFiles({
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

  const data = computed<AnalysisFileItem[]>(() =>
    (query.data.value?.pages.flatMap((page) => page ?? []) ?? []).filter((item) =>
      matchesFilters(item, snapshotAt.value, selectedSourceId.value),
    )
  );

  return {
    ...query,
    data,
  };
};
