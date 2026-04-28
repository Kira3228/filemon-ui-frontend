import type { ComputedRef, Ref } from "vue";
import { computed } from "vue";
import { processExportHeaders, processHeaders } from "./analysis-processes-table.config";
import { filterItemsByFileId } from "./file-route-filter";
import {
  buildProcessBuckets,
  buildProcessBucketSummary,
  buildProcessExportRowKinds,
  buildProcessExportRows,
  buildProcessGroups,
  buildProcessGroupRowsByKey,
  buildProcessTableItems,
  buildProcessTableItemsById,
} from "./analysis-processes-table.grouping";
import { createProcessRows } from "./analysis-processes-table.rows";
import { buildProcessBucketTitle, buildProcessGroupTitle, formatProcessTableMetaValue } from "./analysis-processes-table.presentation";
import type { ProcessBucket, ProcessGroup, } from "./analysis-processes-table.types";
import type {
  Nullable,
} from "./analysis-report.types";
import { AnalysisFileItem } from "@/services/files/file.types";
import { AnalysisProcessReadGroup, ProcessGroupRow, ProcessTableItem } from "@/services/process/process.type";

export type { ProcessBucket, ProcessGroup, } from "./analysis-processes-table.types";

interface UseAnalysisProcessesTableOptions {
  eventTypeLabel: (type?: Nullable<string>) => string;
  expandedProcessGroups: Ref<string[]>;
  filesById: ComputedRef<Record<string, AnalysisFileItem>>;
  formatTs: (value?: Nullable<string>) => string;
  //TODO: СЮДА ДИП ДОБАВИПТЬ
  report: Ref<AnalysisProcessReadGroup | null>;
  scopedFileId: Ref<number | null>;
  selectedSourceId: Ref<number | null>;
  snapshotAt: Ref<string>;
}

export const useAnalysisProcessesTable = ({
  eventTypeLabel,
  expandedProcessGroups,
  filesById,
  formatTs,
  report,
  scopedFileId,
  selectedSourceId,
  snapshotAt,
}: UseAnalysisProcessesTableOptions) => {

  const processRows = createProcessRows({
    filesById,
    report,
    selectedSourceId,
    snapshotAt,
  });

  const scopedProcessRows = computed(() =>
    filterItemsByFileId(processRows.value, scopedFileId.value),
  );

  const processGroups = computed<ProcessGroup[]>(() =>
    buildProcessGroups(scopedProcessRows.value),
  );

  const scopedProcessCount = computed(() => processGroups.value.length);
  const processBuckets = computed<ProcessBucket[]>(() =>
    buildProcessBuckets(processGroups.value),
  );

  const processBucketSummary = computed<Record<string, ProcessBucket>>(() =>
    buildProcessBucketSummary(processBuckets.value),
  );

  const processTableItems = computed<ProcessTableItem[]>(() =>
    buildProcessTableItems(
      processBuckets.value,
      expandedProcessGroups.value,
    ),
  );

  const processGroupRowsByKey = computed<Record<string, ProcessGroupRow>>(() =>
    buildProcessGroupRowsByKey(processGroups.value),
  );

  const processTableItemsById = computed<Record<string, ProcessTableItem>>(() =>
    buildProcessTableItemsById(processTableItems.value),
  );

  const processExportRows = computed(() =>
    processBuckets.value.flatMap((bucket, bucketIndex) => {
      const rows = buildProcessExportRows(bucket.groups, eventTypeLabel, formatTs);
      if (bucketIndex < processBuckets.value.length - 1 && rows.length) {
        rows.push(Array(processExportHeaders.length).fill(""));
      }
      return rows;
    }),
  );

  const processExportRowKinds = computed(() =>
    processBuckets.value.flatMap((bucket, bucketIndex) => {
      const rowKinds = buildProcessExportRowKinds(bucket.groups);
      if (bucketIndex < processBuckets.value.length - 1 && rowKinds.length) {
        rowKinds.push("spacer");
      }
      return rowKinds;
    }),
  );

  const processGroupsByKey = computed<Record<string, ProcessGroup>>(() =>
    processGroups.value.reduce((accumulator, group) => {
      accumulator[group.processGroupKey] = group;
      return accumulator;
    }, {} as Record<string, ProcessGroup>),
  );

  const isProcessGroupRow = (item: ProcessTableItem): item is ProcessGroupRow =>
    item.rowKind === "GROUP";

  const formatMetaValue = (value: unknown) =>
    formatProcessTableMetaValue(value);

  return {
    buildProcessBucketTitle: (bucketKey: string) => buildProcessBucketTitle(bucketKey, processBucketSummary.value),
    buildProcessGroupTitle: (item: ProcessGroupRow) => buildProcessGroupTitle(item, formatTs),
    formatMetaValue,
    headers: processHeaders,
    isProcessGroupRow,
    processBucketSummary,
    processBuckets,
    processExportRowKinds,
    processExportRows,
    processGroupRowsByKey,
    processGroups,
    processGroupsByKey,
    processRows,
    processTableItems,
    processTableItemsById,
    processExportHeaders,
    scopedProcessCount,
    scopedProcessRows,
  };
};
