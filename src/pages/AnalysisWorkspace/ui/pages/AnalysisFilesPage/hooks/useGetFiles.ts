import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../../store/table.store";
import { FileService } from "@/services/files/files.service";
import { AnalysisFileItem } from "@/services/files/types/file.types";
import { computed } from "vue";

export const useGetFiles = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("files");

  const query = useInfiniteQuery<AnalysisFileItem[]>(
    ["analysis-files", table.limit],
    ({ pageParam = 1 }) =>
      FileService.getFiles({
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

  const data = computed<AnalysisFileItem[]>(() =>
    query.data.value?.pages.flatMap((page) => page ?? []) ?? []
  );

  return {
    ...query,
    data,
  };
};
