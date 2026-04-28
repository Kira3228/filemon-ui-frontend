import { useInfiniteQuery } from "@tanstack/vue-query";
import { useTableStore } from "../../../store/table.store";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { TimelineService } from "@/services/timeline/timeline.service";
import { computed } from "vue";

export const useGetTimeline = () => {
  const tableStore = useTableStore();
  const table = tableStore.getTable("timeline");

  const query = useInfiniteQuery<AnalysisTimelineEntry[]>(
    ["analysis-timeline", table.limit],
    ({ pageParam = 1 }) =>
      TimelineService.getTimeline({
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