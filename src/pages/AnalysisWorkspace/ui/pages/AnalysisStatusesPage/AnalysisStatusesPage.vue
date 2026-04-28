<template>
  <section class="app-surface analysis-page-card">
    <header class="analysis-page-header">
      <span>История статусов</span>
      <span class="analysis-page-meta"
        >{{ scopedStatusHistory.length }} записей</span
      >
    </header>
    <div
      ref="tableHostRef"
      class="analysis-page-table-shell"
      @mousedown.capture="handleTablePointerDown"
    >
      <DataTable
        :headers="headers"
        :items="scopedStatusHistory"
        :items-per-page="1000"
        item-key="id"
        :active-row-key="activeRowKey"
        :enable-keyboard-navigation="false"
        export-title="История_статусов"
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
              class="analysis-route-filter-remove"
              aria-label="Сбросить фильтр по файлу"
              @click="clearScopedFile"
            >
              <span class="pi pi-times" />
            </UiButton>
          </span>
        </template>
        <template #[`item.createdAt`]="{ value }">{{
          formatAnalysisTimestamp(value)
        }}</template>
        <template #[`item.status`]="{ value }">
          <span class="analysis-badge" :class="statusBadgeClass(value)">{{
            value || "—"
          }}</span>
        </template>
        <template #[`item.changeSource`]="{ value }">
          {{ value === "MANUAL" ? "Ручное изменение" : "Системное изменение" }}
        </template>
      </DataTable>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UiButton } from "@/components/UiButton";
import { headers } from "./headers";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";
import { useKeyboardTableSelection } from "@/pages/AnalysisWorkspace/model/use-keyboard-table-selection";
import { computed } from "vue";
import { filterItemsByFileId } from "@/pages/AnalysisWorkspace/model/file-route-filter";
import { useRouteFileScope } from "@/pages/AnalysisWorkspace/model/use-route-file-scope";
import { useAnalysisWorkspace } from "@/pages/AnalysisWorkspace/model/use-analysis-workspace";
import { useAnalysisUiSettings } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import DataTable from "@/components/DataTable/DataTable.vue";
import AnalysisFileDetailsToggle from "../../components/AnalysisFileDetailsToggle.vue";
import { formatAnalysisTimestamp } from "@/shared/utils/format-analysis-timestamp";
import { useGetStatuses } from "../../../model/queries/useGetStatuses";

const { setSelectedFile, statusBadgeClass } = useAnalysisWorkspace();

const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();

const { router, scopedFile, scopedFileId, clearScopedFile } =
  useRouteFileScope();

const scopedStatusHistory = computed(() =>
  filterItemsByFileId(statuses.value, scopedFileId.value),
);

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const { data: statuses } = useGetStatuses();

const {
  hostRef: tableHostRef,
  activeRowKey,
  handlePointerDown: handleTablePointerDown,
  selectItem,
  openItem,
} = useKeyboardTableSelection<AnalysisStatusHistoryItem>({
  items: scopedStatusHistory,
  getKey: (item) => item.id,
  onSelect: (item) => setSelectedFile(item.fileId),
  onOpen: (item) => openFile(item.fileId),
});

const handleRowClick = (item: AnalysisStatusHistoryItem) => selectItem(item);
const handleRowDblClick = (item: AnalysisStatusHistoryItem) => openItem(item);

</script>
<style scoped src="./AnalysisStatusesPage.css"></style>
