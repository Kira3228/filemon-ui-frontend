import type { ComputedRef, Ref } from "vue";
import { computed } from "vue";
import {
  createProcessesKeyboardHelpers,
  isProcessToggleKeyboardKey,
} from "./analysis-processes-interactions.keyboard";
import { setupProcessInteractionState } from "./analysis-processes-interactions.state";
import { createProcessInteractionTransitions } from "./analysis-processes-interactions.transitions";
import type { ProcessBucket, ProcessGroup, ProcessTableItem } from "./analysis-processes-table.types";

interface UseAnalysisProcessesInteractionsOptions {
  activeRowKey: Ref<string | null>;
  expandedProcessBuckets: Ref<string[]>;
  expandedProcessGroups: Ref<string[]>;
  processBuckets: ComputedRef<ProcessBucket[]>;
  processGroups: ComputedRef<ProcessGroup[]>;
  processGroupsByKey: ComputedRef<Record<string, ProcessGroup>>;
  processesRootRef: Ref<HTMLElement | null>;
  scopedProcessRows: ComputedRef<ProcessTableItem[]>;
  processTableItemsById: ComputedRef<Record<string, ProcessTableItem>>;
  selectedProcessGroupKey: Ref<string | null>;
  setSelectedFile: (fileId: number | null) => void;
  pushToFile: (fileId: number) => void;
}

export const useAnalysisProcessesInteractions = ({
  activeRowKey,
  expandedProcessBuckets,
  expandedProcessGroups,
  processBuckets,
  processGroups,
  processGroupsByKey,
  processesRootRef,
  scopedProcessRows,
  processTableItemsById,
  selectedProcessGroupKey,
  setSelectedFile,
  pushToFile,
}: UseAnalysisProcessesInteractionsOptions) => {
  const {
    focusProcessBucketHeader,
    moveProcessKeyboardFocus,
    resolveProcessBucketHeaderElement,
    resolveProcessGroupRowElement,
  } = createProcessesKeyboardHelpers(processesRootRef);

  const selectedProcess = computed<ProcessGroup | null>(() =>
    selectedProcessGroupKey.value === null
      ? null
      : processGroups.value.find((group) => group.processGroupKey === selectedProcessGroupKey.value) || null,
  );
  const {
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
  } = setupProcessInteractionState({
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
  });
  const {
    handleActiveRowChange,
    handleProcessBucketClick,
    handleProcessBucketKeydown,
    handleProcessGroupRowClick,
    handleProcessGroupRowKeydown,
    handleProcessesKeydown,
    handleRowClick,
    handleRowDblClick,
    openFile,
  } = createProcessInteractionTransitions({
    activeRowKey,
    processTableItemsById,
    setSelectedFile,
    pushToFile,
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
  });

  const handleExpandedProcessBucketsUpdate = (groups: unknown[]) => {
    expandedProcessBuckets.value = Array.isArray(groups)
      ? groups.map((value) => String(value))
      : [];
  };

  const handleProcessesFocusIn = (event: FocusEvent) => {
    const focusedGroupElement = resolveProcessGroupRowElement(event.target);
    if (focusedGroupElement) {
      const groupKey = focusedGroupElement.dataset.processGroupKey;
      if (groupKey) {
        selectProcessGroup(groupKey);
      }
    }
  };

  const handleProcessesKeydownWithHelpers = (event: KeyboardEvent) =>
    handleProcessesKeydown(
      event,
      resolveProcessBucketHeaderElement,
      moveProcessKeyboardFocus,
      focusProcessBucketHeader,
      isProcessToggleKeyboardKey,
    );

  return {
    activeRowKey,
    expandedProcessBuckets,
    expandedProcessGroups,
    handleActiveRowChange,
    handleExpandedProcessBucketsUpdate,
    handleProcessBucketClick,
    handleProcessBucketKeydown,
    handleProcessGroupRowClick,
    handleProcessGroupRowKeydown,
    handleProcessesFocusIn,
    handleProcessesKeydown: handleProcessesKeydownWithHelpers,
    handleRowClick,
    handleRowDblClick,
    isProcessBucketExpanded,
    isProcessGroupExpanded,
    openFile,
    processesRootRef,
    selectedProcess,
    selectedProcessGroupKey,
  };
};
