import { computed } from "vue";
import { useRoute, useRouter } from "vue-router/composables";
import { storeToRefs } from "pinia";
import { parseRouteFileId, stripFileIdFromQuery } from "./file-route-filter";
import { useAnalysisWorkspaceStore } from "./analysis-workspace.store";

export const useRouteFileScope = () => {
  const route = useRoute();
  const router = useRouter();
  const store = useAnalysisWorkspaceStore();
  const { filesById } = storeToRefs(store);

  const scopedFileId = computed(() => parseRouteFileId(route));
  const scopedFile = computed(() =>
    scopedFileId.value === null ? null : filesById.value[String(scopedFileId.value)] || null,
  );

  const clearScopedFile = () => {
    router.push({
      path: route.path,
      query: stripFileIdFromQuery(route.query),
    });
  };

  return {
    route,
    router,
    scopedFileId,
    scopedFile,
    clearScopedFile,
  };
};
