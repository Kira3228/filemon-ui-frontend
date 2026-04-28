<template>
  <section class="app-surface analysis-page-card analysis-graph-page">
    <header class="analysis-page-header">
      <span>Граф распространения</span>
      <span class="analysis-page-meta">
        Источников в текущем представлении: {{ resultData.length }}
      </span>
    </header>

    <div
      v-if="resultData.length"
      class="analysis-graph-scroll-shell"
      @scroll.passive="handleSourcesScroll"
    >
      <div class="analysis-graph-stack">
        <details
          v-for="source in resultData"
          :key="source.fileId"
          class="analysis-graph-details"
          open
        >
          <summary class="analysis-graph-summary">
            <div>
              <div class="analysis-graph-title analysis-file-name">
                {{ source.name }}
              </div>
              <div class="analysis-page-meta">{{ source.path }}</div>
            </div>
          </summary>

          <div
            v-for="(level, levelIndex) in sourceColumns(source)"
            :key="`${source.fileId}-level-${levelIndex}`"
            class="analysis-graph-level"
          >
            <div class="analysis-graph-level-label mb-2">
              Уровень {{ levelIndex + 1 }}
            </div>
            <div class="analysis-graph-grid">
              <UiButton
                v-for="node in level"
                :key="node.fileId"
                variant="secondary"
                type="button"
                class="app-surface analysis-graph-node"
                @click="selectFile(node.fileId)"
                @dblclick="openFile(node.fileId)"
              >
                <div class="analysis-graph-title analysis-file-name">
                  {{ node.name }}
                </div>
                <div class="analysis-page-meta mt-1">{{ node.path }}</div>
                <div class="analysis-page-meta mt-2">
                  версий={{ node.versionCount }} · глубина={{ node.depth }} ·
                  {{ node.currentStatus }}
                </div>
                <span class="analysis-badge event_badge_gray mt-2">
                  {{
                    node.childIds.length
                      ? `Порождает ${node.childIds.length} файл(ов)`
                      : "Листовой узел"
                  }}
                </span>
              </UiButton>
            </div>
          </div>
        </details>
      </div>
    </div>

    <div v-else class="analysis-page-meta">
      Для выбранных фильтров нет доступных цепочек источников.
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router/composables";
import { UiButton } from "@/components/UiButton";
import { matchesFilters } from "@/shared/utils/analysis-filters";
import type { AnalysisFileItem } from "@/services/files/file.types";
import type { AnalysisSourceItem } from "@/services/source/source.types";
import { useGetSources } from "@/pages/AnalysisWorkspace/model/queries/useGetSources";
import { useAnalysisWorkspace } from "../../../model/use-analysis-workspace";

type GraphNode = AnalysisFileItem & {
  childIds: number[];
};

const router = useRouter();

const {
  data: sources,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetSources();

const { selectedSourceId, setSelectedFile, snapshotAt } = useAnalysisWorkspace();

const resultData = computed<AnalysisSourceItem[]>(() =>
  sources.value.filter((item) =>
    matchesFilters(item, snapshotAt.value, selectedSourceId.value),
  ),
);

const getFileChildIds = (
  fileId: number,
  filesById: Map<number, AnalysisFileItem>,
) =>
  Array.from(filesById.values())
    .filter((file) => file.parents?.some((parent) => parent.fileId === fileId))
    .map((file) => file.fileId);

const buildNode = (
  file: AnalysisFileItem,
  filesById: Map<number, AnalysisFileItem>,
): GraphNode => ({
  ...file,
  childIds: getFileChildIds(file.fileId, filesById),
});

const groupFilesByDepth = (
  files: AnalysisFileItem[],
  filesById: Map<number, AnalysisFileItem>,
): GraphNode[][] => {
  const grouped = new Map<number, AnalysisFileItem[]>();

  for (const file of files) {
    const depth = Number.isFinite(file.depth) ? file.depth : 0;
    grouped.set(depth, [...(grouped.get(depth) || []), file]);
  }

  return Array.from(grouped.entries())
    .sort(([leftDepth], [rightDepth]) => leftDepth - rightDepth)
    .map(([, level]) => level.map((file) => buildNode(file, filesById)));
};

const sourceColumns = (source: AnalysisSourceItem): GraphNode[][] => {
  const files = (source.produced || []).filter((item) =>
    matchesFilters(item, snapshotAt.value, selectedSourceId.value),
  );
  const filesById = new Map(files.map((file) => [file.fileId, file]));
  const rootFile = filesById.get(source.fileId);
  const firstLevelIds = rootFile
    ? [source.fileId]
    : files
        .filter((file) =>
          file.parents?.some((parent) => parent.fileId === source.fileId),
        )
        .map((file) => file.fileId);

  if (!firstLevelIds.length) {
    return groupFilesByDepth(files, filesById);
  }

  const levels: GraphNode[][] = [];
  const seen = new Set<number>();
  let currentIds = firstLevelIds;

  while (currentIds.length) {
    const currentLevel = currentIds
      .map((fileId) => {
        const file = filesById.get(fileId);
        return file ? buildNode(file, filesById) : null;
      })
      .filter((item): item is GraphNode => Boolean(item));

    if (!currentLevel.length) {
      break;
    }

    levels.push(currentLevel);

    const nextIds: number[] = [];
    for (const item of currentLevel) {
      seen.add(item.fileId);
      for (const childId of item.childIds) {
        if (!seen.has(childId)) {
          nextIds.push(childId);
        }
      }
    }

    currentIds = Array.from(new Set(nextIds));
  }

  return levels;
};

const selectFile = (fileId: number) => {
  setSelectedFile(fileId);
};

const openFile = (fileId: number) => {
  selectFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleSourcesScroll = (event: Event) => {
  const target = event.currentTarget as HTMLElement;
  const bottomOffset =
    target.scrollHeight - target.scrollTop - target.clientHeight;

  if (
    bottomOffset > 120 ||
    isFetchingNextPage.value ||
    hasNextPage?.value === false
  ) {
    return;
  }

  fetchNextPage();
};
</script>

<style scoped src="./AnalysisGraphPage.css"></style>
