import type { ComputedRef, Ref } from "vue";
import { watch } from "vue";
import type { ProcessBucket, ProcessGroup, ProcessTableItem } from "./analysis-processes-table.types";

interface SetupProcessInteractionStateOptions {
  activeRowKey: Ref<string | null>;
  expandedProcessBuckets: Ref<string[]>;
  expandedProcessGroups: Ref<string[]>;
  processBuckets: ComputedRef<ProcessBucket[]>;
  processGroups: ComputedRef<ProcessGroup[]>;
  processGroupsByKey: ComputedRef<Record<string, ProcessGroup>>;
  processTableItemsById: ComputedRef<Record<string, ProcessTableItem>>;
  scopedProcessRows: ComputedRef<ProcessTableItem[]>;
  selectedProcessGroupKey: Ref<string | null>;
  setSelectedFile: (fileId: number | null) => void;
}

export const setupProcessInteractionState = ({
  activeRowKey,
  expandedProcessBuckets,
  expandedProcessGroups,
  processBuckets,
  processGroups,
  processGroupsByKey,
  processTableItemsById,
  scopedProcessRows,
  selectedProcessGroupKey,
  setSelectedFile,
}: SetupProcessInteractionStateOptions) => {
  const syncSelectedFileWithGroup = (groupKey: string) => {
    const firstEvent = processGroupsByKey.value[groupKey]?.events[0] || null;
    if (firstEvent?.fileId) {
      setSelectedFile(firstEvent.fileId);
    }
  };

  const isProcessBucketExpanded = (bucketKey: string) =>
    expandedProcessBuckets.value.includes(bucketKey);

  const isProcessGroupExpanded = (groupKey: string) =>
    expandedProcessGroups.value.includes(groupKey);

  const expandProcessBucket = (bucketKey: string) => {
    if (isProcessBucketExpanded(bucketKey)) { return; }
    expandedProcessBuckets.value = [...expandedProcessBuckets.value, bucketKey];
  };

  const collapseProcessBucket = (bucketKey: string) => {
    if (!isProcessBucketExpanded(bucketKey)) { return; }
    expandedProcessBuckets.value = expandedProcessBuckets.value.filter((value) => value !== bucketKey);
  };

  const toggleProcessBucket = (bucketKey: string) => {
    if (isProcessBucketExpanded(bucketKey)) {
      collapseProcessBucket(bucketKey);
      return;
    }
    expandProcessBucket(bucketKey);
  };

  const expandProcessGroup = (groupKey: string) => {
    if (isProcessGroupExpanded(groupKey)) { return; }
    expandedProcessGroups.value = [...expandedProcessGroups.value, groupKey];
  };

  const collapseProcessGroup = (groupKey: string) => {
    if (!isProcessGroupExpanded(groupKey)) { return; }
    expandedProcessGroups.value = expandedProcessGroups.value.filter((value) => value !== groupKey);
    const activeItem = activeRowKey.value ? processTableItemsById.value[activeRowKey.value] || null : null;
    if (activeItem?.processGroupKey === groupKey) {
      activeRowKey.value = null;
    }
  };

  const selectProcessGroup = (groupKey: string) => {
    selectedProcessGroupKey.value = groupKey;
  };

  const syncSelectionWithProcessGroup = (groupKey: string, processBucketKey?: string) => {
    if (processBucketKey) {
      expandProcessBucket(processBucketKey);
    }
    selectProcessGroup(groupKey);
    syncSelectedFileWithGroup(groupKey);
  };

  const activateProcessGroup = (groupKey: string, processBucketKey?: string) => {
    syncSelectionWithProcessGroup(groupKey, processBucketKey);
    expandProcessGroup(groupKey);
  };

  watch(processGroups, (groups) => {
    const availableGroups = new Set(groups.map((group) => group.processGroupKey));
    expandedProcessGroups.value = expandedProcessGroups.value.filter((groupKey) => availableGroups.has(groupKey));
    if (selectedProcessGroupKey.value && !availableGroups.has(selectedProcessGroupKey.value)) {
      selectedProcessGroupKey.value = null;
    }
  }, { immediate: true });

  watch(processBuckets, (buckets) => {
    const availableBuckets = new Set(buckets.map((bucket) => bucket.processBucketKey));
    const nextExpanded = expandedProcessBuckets.value.filter((bucketKey) => availableBuckets.has(bucketKey));
    const nextExpandedSet = new Set(nextExpanded);
    for (const bucket of buckets) {
      if (!nextExpandedSet.has(bucket.processBucketKey)) {
        nextExpanded.push(bucket.processBucketKey);
      }
    }
    expandedProcessBuckets.value = nextExpanded;
  }, { immediate: true });

  watch(scopedProcessRows, (rows) => {
    const availableRowIds = new Set(rows.map((row) => row.id));
    if (activeRowKey.value && !availableRowIds.has(activeRowKey.value)) {
      activeRowKey.value = null;
    }
  }, { immediate: true });

  watch(scopedProcessRows, (rows) => {
    const firstRow = rows[0] || null;
    if (!firstRow) {
      activeRowKey.value = null;
      return;
    }

    if (activeRowKey.value && processTableItemsById.value[activeRowKey.value]) {
      return;
    }

    activeRowKey.value = firstRow.id;
    selectedProcessGroupKey.value = firstRow.processGroupKey;
    expandProcessBucket(String(firstRow.processId));
    expandProcessGroup(firstRow.processGroupKey);
    if (firstRow.fileId) {
      setSelectedFile(firstRow.fileId);
    }
  }, { immediate: true });

  return {
    activateProcessGroup,
    collapseProcessBucket,
    collapseProcessGroup,
    expandProcessBucket,
    expandProcessGroup,
    isProcessBucketExpanded,
    isProcessGroupExpanded,
    selectProcessGroup,
    syncSelectedFileWithGroup,
    syncSelectionWithProcessGroup,
    toggleProcessBucket,
  };
};
