<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>История переименований и перемещений</span>
      <span class="analysis-page-meta"
        >{{ scopedRenameHistory.length }} записей</span
      >
    </header>
    <div
      v-if="scopedRenameHistory.length"
      ref="tableHostRef"
      class="analysis-page-table-shell"
      @mousedown.capture="handleTablePointerDown"
    >
      <DataTable
        :headers="headers"
        :items="scopedRenameHistory"
        :items-per-page="1000"
        item-key="id"
        :active-row-key="activeRowKey"
        :enable-keyboard-navigation="false"
        export-title="История_rename_move"
        @click-row="handleRowClick"
        @dblclick-row="handleRowDblClick"
      >
        <template #toolbar-actions>
          <AnalysisFileDetailsToggle
            :active="fileDetailsVisible"
            @click="setFileDetailsVisible(!fileDetailsVisible)"
          />
        </template>
        <template #status-filters>
          <span
            v-if="scopedFileId !== null"
            class="analysis-route-filter-chip"
            :title="scopedFile?.path || `Файл #${scopedFileId}`"
          >
            <span class="analysis-route-filter-text">
              <strong>Файл:</strong>
              {{ scopedFile?.name || `#${scopedFileId}` }}
            </span>
            <UiButton
              type="button"
              aria-label="Сбросить фильтр по файлу"
              @click="clearScopedFile"
            >
              <span class="pi pi-times" />
            </UiButton>
          </span>
        </template>
        <template #[`item.createdAt`]="{ value }">{{
          formatTs(value)
        }}</template>
        <template #[`item.eventType`]="{ value }">
          <span class="analysis-badge" :class="badgeClass(value)">{{
            eventTypeLabel(value)
          }}</span>
        </template>
        <template #[`item.details`]="{ value }">
          <span class="analysis-page-meta">{{ JSON.stringify(value) }}</span>
        </template>
      </DataTable>
    </div>
    <div v-else class="analysis-empty-state">
      В `file_events` пока нет записей rename или move.
    </div>
  </section>
</template>

<script lang="ts" setup>
import DataTable from "@/components/DataTable/DataTable.vue";
import { filterItemsByFileId } from "@/pages/AnalysisWorkspace/model/file-route-filter";
import { useAnalysisUiSettings } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import { useAnalysisWorkspace } from "@/pages/AnalysisWorkspace/model/use-analysis-workspace";
import { useKeyboardTableSelection } from "@/pages/AnalysisWorkspace/model/use-keyboard-table-selection";
import { useRouteFileScope } from "@/pages/AnalysisWorkspace/model/use-route-file-scope";
import { AnalysisRenameHistoryItem } from "@/services/rename/rename-history.type";
import { computed } from "vue";
import AnalysisFileDetailsToggle from "../../components/AnalysisFileDetailsToggle.vue";
import { UiButton } from "@/components/UiButton";
import { useGetRenameHistory } from "../../../model/queries/useGetRenameHistory";
import { headers } from "./headers";

const { data: renameHistory } = useGetRenameHistory();

const { badgeClass, eventTypeLabel, formatTs, setSelectedFile } =
  useAnalysisWorkspace();

const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();
const { router, scopedFile, scopedFileId, clearScopedFile } =
  useRouteFileScope();
const scopedRenameHistory = computed(() =>
  filterItemsByFileId(renameHistory.value, scopedFileId.value),
);

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const {
  hostRef: tableHostRef,
  activeRowKey,
  handlePointerDown: handleTablePointerDown,
  selectItem,
  openItem,
} = useKeyboardTableSelection<AnalysisRenameHistoryItem>({
  items: scopedRenameHistory,
  getKey: (item) => item.id,
  onSelect: (item) => setSelectedFile(item.fileId),
  onOpen: (item) => openFile(item.fileId),
});

const handleRowClick = (item: AnalysisRenameHistoryItem) => selectItem(item);
const handleRowDblClick = (item: AnalysisRenameHistoryItem) => openItem(item);
</script>
<style scoped src="./AnalysisRenamePage.css"></style>
