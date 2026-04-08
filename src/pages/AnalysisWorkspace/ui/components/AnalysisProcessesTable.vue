<template>
  <div class="analysis-processes-table">
    <div v-if="scopedFileId !== null" class="analysis-process-filters">
      <span
        class="analysis-route-filter-chip"
        :title="scopedFilePath"
      >
        <span class="analysis-route-filter-text">
          <strong>Файл:</strong> {{ scopedFileName }}
        </span>
        <button
          type="button"
          class="analysis-route-filter-remove"
          aria-label="Сбросить фильтр по файлу"
          @click="$emit('clear-scoped-file')"
        >
          <span class="pi pi-times" />
        </button>
      </span>
    </div>
    <div class="analysis-page-table-shell analysis-process-table-shell">
      <DataTable
        :headers="headers"
        :items="processTableItems"
        :items-per-page="1000"
        item-key="id"
        :active-row-key="activeRowKey"
        :enable-keyboard-navigation="true"
        export-title="Процессы_и_операции_записи"
        :export-headers="processExportHeaders"
        :export-rows="processExportRows"
        :export-row-kinds="processExportRowKinds"
        state-key="analysis-processes-write-table"
        row-group-mode="subheader"
        group-rows-by="processBucketKey"
        expandable-row-groups
        :expanded-row-groups="expandedProcessBuckets"
        @click-row="$emit('row-click', $event)"
        @dblclick-row="$emit('row-dblclick', $event)"
        @update:activeRow="$emit('active-row-change', $event)"
        @update:expandedRowGroups="$emit('expanded-buckets-change', $event)"
      >
        <template #toolbar-actions>
          <AnalysisFileDetailsToggle
            :active="fileDetailsVisible"
            @click="setFileDetailsVisible(!fileDetailsVisible)"
          />
          <button
            type="button"
            class="analysis-toolbar-toggle"
            :class="{ 'analysis-toolbar-toggle--active': showProcessCards }"
            @click="$emit('toggle-process-cards')"
          >
            <span class="pi" :class="showProcessCards ? 'pi-eye-slash' : 'pi-eye'" />
            <span>Детали процесса</span>
          </button>
        </template>
        <template #status-filters>
          <span
            v-if="scopedFileId !== null"
            class="analysis-route-filter-chip"
            :title="scopedFilePath"
          >
            <span class="analysis-route-filter-text">
              <strong>Файл:</strong> {{ scopedFileName }}
            </span>
            <button
              type="button"
              class="analysis-route-filter-remove"
              aria-label="Сбросить фильтр по файлу"
              @click="$emit('clear-scoped-file')"
            >
              <span class="pi pi-times" />
            </button>
          </span>
        </template>
        <template #groupheader="{ item }">
          <header
            class="analysis-process-bucket__header"
            :class="{ 'analysis-process-bucket__header--expanded': isProcessBucketExpanded(item.processBucketKey) }"
            tabindex="0"
            role="button"
            :data-process-bucket-key="item.processBucketKey"
            :aria-expanded="isProcessBucketExpanded(item.processBucketKey) ? 'true' : 'false'"
            @click.stop="$emit('process-bucket-click', item.processBucketKey)"
            @keydown.stop="$emit('process-bucket-keydown', $event, item.processBucketKey)"
          >
            <span
              class="analysis-process-bucket__chevron-wrap"
              :class="{ 'analysis-process-bucket__chevron-wrap--expanded': isProcessBucketExpanded(item.processBucketKey) }"
            >
              <span class="pi analysis-process-bucket__chevron" :class="isProcessBucketExpanded(item.processBucketKey) ? 'pi-chevron-down' : 'pi-chevron-right'" />
            </span>
            <div class="analysis-process-bucket__main" :title="buildProcessBucketTitle(item.processBucketKey)">
              <strong class="analysis-process-bucket__title">{{ processBucketSummary[item.processBucketKey]?.processLabel || item.processLabel }}</strong>
              <span class="analysis-process-bucket__meta">
                PID {{ formatMetaValue(processBucketSummary[item.processBucketKey]?.pid) }}
                · UID {{ formatMetaValue(processBucketSummary[item.processBucketKey]?.uid) }}
                · пользователь {{ processBucketSummary[item.processBucketKey]?.user || "—" }}
                <template v-if="processBucketSummary[item.processBucketKey]?.executablePath">
                  · {{ processBucketSummary[item.processBucketKey]?.executablePath }}
                </template>
              </span>
            </div>
            <div class="analysis-process-bucket__aside">
              <span class="analysis-badge event_badge_gray">{{ processBucketSummary[item.processBucketKey]?.groupCount || 0 }} групп записи</span>
              <span class="analysis-page-meta">{{ processBucketSummary[item.processBucketKey]?.eventCount || 0 }} событий</span>
            </div>
          </header>
        </template>
        <template #item.eventType="{ item, value }">
          <button
            v-if="isProcessGroupRow(item)"
            type="button"
            class="analysis-process-group__header"
            :class="{ 'analysis-process-group__header--selected': selectedProcessGroupKey === item.processGroupKey }"
            :title="buildProcessGroupTitle(item)"
            :data-process-group-key="item.processGroupKey"
            :data-process-bucket-key="item.processBucketKey"
            :aria-expanded="isProcessGroupExpanded(item.processGroupKey) ? 'true' : 'false'"
            @click="$emit('process-group-click', item.processGroupKey, item.processBucketKey)"
            @keydown.stop="$emit('process-group-keydown', $event, item.processGroupKey, item.processBucketKey)"
          >
            <span
              class="analysis-process-group__chevron-wrap"
              :class="{ 'analysis-process-group__chevron-wrap--expanded': isProcessGroupExpanded(item.processGroupKey) }"
              aria-hidden="true"
            >
              <span class="pi analysis-process-group__chevron" :class="isProcessGroupExpanded(item.processGroupKey) ? 'pi-chevron-down' : 'pi-chevron-right'" />
            </span>
            <div class="analysis-process-group__main">
              <strong class="analysis-process-group__title">WRITE {{ item.writeFileName }}</strong>
              <span class="analysis-process-group__meta">
                PV {{ formatMetaValue(item.processVersionId) }} · {{ formatTs(item.writeAt) }}
                <template v-if="item.writePath">
                  · {{ item.writePath }}
                </template>
              </span>
            </div>
            <div class="analysis-process-group__aside">
              <span class="analysis-badge event_badge_gray">
                {{ item.readCount }} чтений · {{ item.writeCount }} записей
              </span>
              <span class="analysis-page-meta">{{ formatTs(item.writeAt) }}</span>
            </div>
          </button>
          <span v-else class="analysis-badge" :class="badgeClass(value)">
            {{ eventTypeLabel(value) }}
          </span>
        </template>
        <template #item.fileName="{ item }">
          <template v-if="isProcessGroupRow(item)"> </template>
          <div v-else class="analysis-file-cell" :title="`${item.fileName}\n${item.path}`">
            <strong class="analysis-file-title">{{ item.fileName }}</strong>
            <span class="analysis-file-caption">{{ item.path }}</span>
          </div>
        </template>
        <template #item.filesystemUuid="{ item, value }">
          <template v-if="isProcessGroupRow(item)"> </template>
          <template v-else>{{ value || "—" }}</template>
        </template>
        <template #item.versionNumber="{ item, value }">
          <template v-if="isProcessGroupRow(item)"> </template>
          <template v-else>{{ value === null || value === undefined ? "—" : `v${value}` }}</template>
        </template>
        <template #item.eventAt="{ item, value }">
          {{ isProcessGroupRow(item) ? "" : formatTs(value) }}
        </template>
        <template #item.path="{ item, value }">
          <div class="analysis-file-inline" :title="isProcessGroupRow(item) ? '' : value || '—'">
            {{ isProcessGroupRow(item) ? "" : value || "—" }}
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DataTable } from "@/common-components/src/components/DataTable";
import type { Header } from "@/common-components/src/components/DataTable";
import type { Nullable } from "../../model/analysis-report.types";
import type { ProcessBucket, ProcessGroupRow, ProcessTableItem } from "../../model/analysis-processes-table.types";
import { useAnalysisUiSettings } from "../../model/use-analysis-ui-settings";
import AnalysisFileDetailsToggle from "./AnalysisFileDetailsToggle.vue";

const { fileDetailsVisible, setFileDetailsVisible } = useAnalysisUiSettings();

defineProps<{
  activeRowKey: string | null;
  badgeClass: (type: string) => Record<string, boolean>;
  buildProcessBucketTitle: (bucketKey: string) => string;
  buildProcessGroupTitle: (item: ProcessGroupRow) => string;
  expandedProcessBuckets: string[];
  eventTypeLabel: (type?: Nullable<string>) => string;
  formatMetaValue: (value: unknown) => string;
  formatTs: (value?: Nullable<string>) => string;
  headers: Header[];
  isProcessBucketExpanded: (bucketKey: string) => boolean;
  isProcessGroupExpanded: (groupKey: string) => boolean;
  isProcessGroupRow: (item: ProcessTableItem) => item is ProcessGroupRow;
  processBucketSummary: Record<string, ProcessBucket>;
  processExportHeaders: string[];
  processExportRowKinds: string[];
  processExportRows: unknown[][];
  processTableItems: ProcessTableItem[];
  scopedFileId: number | null;
  scopedFileName: string;
  scopedFilePath: string;
  selectedProcessGroupKey: string | null;
  showProcessCards: boolean;
}>();

defineEmits<{
  (e: "active-row-change", item: ProcessTableItem | null): void;
  (e: "clear-scoped-file"): void;
  (e: "expanded-buckets-change", groups: unknown[]): void;
  (e: "process-bucket-click", bucketKey: string): void;
  (e: "process-bucket-keydown", event: KeyboardEvent, bucketKey: string): void;
  (e: "process-group-click", groupKey: string, bucketKey: string): void;
  (e: "process-group-keydown", event: KeyboardEvent, groupKey: string, bucketKey: string): void;
  (e: "row-click", item: ProcessTableItem): void;
  (e: "row-dblclick", item: ProcessTableItem): void;
  (e: "toggle-process-cards"): void;
}>();
</script>

<style scoped>
.analysis-processes-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.analysis-page-meta {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  font-weight: var(--analysis-meta-weight);
  line-height: var(--analysis-meta-line-height);
}

.analysis-process-filters {
  margin-bottom: 0.75rem;
}

.analysis-toolbar-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  padding: 0.42rem 0.92rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.analysis-toolbar-toggle--active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.analysis-process-bucket__header,
.analysis-process-group__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.9rem;
  width: 100%;
  min-width: 0;
  cursor: pointer;
  border-radius: 0.85rem;
  padding: 0.08rem 0.35rem 0.08rem 0.12rem;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.analysis-process-bucket__header:focus,
.analysis-process-group__header:focus {
  outline: none;
}

.analysis-process-bucket__header:focus-visible,
.analysis-process-group__header:focus-visible {
  box-shadow:
    inset 0 0 0 1px rgba(37, 99, 235, 0.22),
    0 0 0 3px rgba(37, 99, 235, 0.14);
}

.analysis-process-bucket__header:hover,
.analysis-process-group__header:hover {
  background: var(--app-surface-muted);
}

.analysis-process-bucket__header--expanded,
.analysis-process-group__header--selected {
  background: rgba(219, 234, 254, 0.9);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.22);
}

.analysis-process-bucket__main,
.analysis-process-group__main {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  min-width: 0;
  overflow: hidden;
}

.analysis-process-bucket__title,
.analysis-process-group__title {
  flex: 0 0 auto;
  min-width: 0;
  font-size: 0.88rem;
  line-height: 1.3;
  white-space: nowrap;
}

.analysis-process-bucket__meta,
.analysis-process-group__meta {
  min-width: 0;
  color: var(--app-text-muted);
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-process-bucket__aside,
.analysis-process-group__aside {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  margin-left: auto;
}

.analysis-process-bucket__chevron-wrap,
.analysis-process-group__chevron-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  flex: 0 0 auto;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.analysis-process-bucket__chevron-wrap--expanded,
.analysis-process-group__chevron-wrap--expanded {
  background: rgba(37, 99, 235, 0.14);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.18);
}

.analysis-process-bucket__chevron,
.analysis-process-group__chevron {
  color: var(--app-text-muted);
  font-size: 0.72rem;
  margin-right: 0;
  flex: 0 0 auto;
}

.analysis-process-group__header {
  width: 100%;
  min-width: 0;
  margin-left: 1.15rem;
  appearance: none;
  border: none;
  background: transparent;
  text-align: left;
}

.analysis-process-group__main {
  flex: 1 1 auto;
}

.analysis-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: var(--analysis-badge-padding);
  font-size: var(--analysis-badge-font-size);
  font-weight: 600;
}

.event_badge_gray {
  background: #e5e7eb;
  color: #374151;
}

:global(html.dark) .event_badge_gray {
  background: rgba(51, 65, 85, 0.88);
  color: #e2e8f0;
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.18),
    0 0 0 1px rgba(15, 23, 42, 0.12);
}

.analysis-route-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  min-width: 0;
  border: 1px solid rgba(22, 101, 52, 0.18);
  border-radius: 999px;
  background: rgba(220, 252, 231, 0.9);
  color: #166534;
  padding: 0.18rem 0.55rem;
}

.analysis-route-filter-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-route-filter-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  flex: 0 0 auto;
  padding: 0;
}

.analysis-route-filter-remove:hover {
  background: rgba(22, 101, 52, 0.12);
}

.analysis-file-caption {
  display: block;
  max-width: 100%;
  color: var(--app-text-muted);
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-file-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.1rem;
}

.analysis-file-title {
  display: block;
  min-width: 0;
  font-size: var(--analysis-caption-size);
  line-height: var(--analysis-caption-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-file-inline {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-process-table-shell {
  flex: 1 1 auto;
  min-height: 18rem;
  overflow: hidden;
}

.analysis-process-table-shell :deep(.compact-data-table .p-rowgroup-header .p-row-toggler),
.analysis-process-table-shell :deep(.compact-data-table .p-rowgroup-header .p-row-toggler.p-link) {
  display: none;
}

.analysis-process-table-shell :deep(.compact-data-table .p-rowgroup-header) {
  scroll-margin-top: 0.75rem;
}

.analysis-process-table-shell :deep(.compact-data-table .p-rowgroup-header > td) {
  padding-left: 0 !important;
}

.analysis-process-table-shell :deep(.compact-data-table .p-rowgroup-header > td) {
  border-bottom-color: rgba(148, 163, 184, 0.18);
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header)) {
  position: relative;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header) > td:first-child) {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
  flex: 1 1 100% !important;
  padding: 0.2rem 0.35rem !important;
  box-sizing: border-box;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header) > td:nth-child(n + 2)) {
  display: none;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header) .compact-data-table__content) {
  overflow: visible;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header--selected)) > td {
  background: rgba(219, 234, 254, 0.46);
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr.compact-data-table__row--active:has(.analysis-process-group__header)) > td {
  background: rgba(219, 234, 254, 0.72);
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header) .p-column-title) {
  display: none;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:has(.analysis-process-group__header) td .compact-data-table__content) {
  display: block;
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
}

.analysis-process-table-shell :deep(.compact-data-table tbody tr:not(.p-rowgroup-header):not(:has(.analysis-process-group__header)) > td:first-child) {
  padding-left: 2.65rem !important;
}

@media (max-width: 960px) {
  .analysis-process-bucket__header,
  .analysis-process-group__header {
    gap: 0.45rem;
  }

  .analysis-process-bucket__main,
  .analysis-process-group__main {
    gap: 0.35rem;
  }
}
</style>
