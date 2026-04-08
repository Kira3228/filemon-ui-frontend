import type { ComputedRef, Ref } from "vue";
import type { ProcessTableItem } from "./analysis-processes-table.types";

interface CreateProcessInteractionTransitionsOptions {
  activeRowKey: Ref<string | null>;
  processTableItemsById: ComputedRef<Record<string, ProcessTableItem>>;
  setSelectedFile: (fileId: number | null) => void;
  pushToFile: (fileId: number) => void;
  activateProcessGroup: (groupKey: string, processBucketKey?: string) => void;
  collapseProcessBucket: (bucketKey: string) => void;
  collapseProcessGroup: (groupKey: string) => void;
  expandProcessBucket: (bucketKey: string) => void;
  expandProcessGroup: (groupKey: string) => void;
  isProcessBucketExpanded: (bucketKey: string) => boolean;
  isProcessGroupExpanded: (groupKey: string) => boolean;
  selectProcessGroup: (groupKey: string) => void;
  syncSelectedFileWithGroup: (groupKey: string) => void;
  syncSelectionWithProcessGroup: (groupKey: string, processBucketKey?: string) => void;
  toggleProcessBucket: (bucketKey: string) => void;
}

export const createProcessInteractionTransitions = ({
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
}: CreateProcessInteractionTransitionsOptions) => {
  const toggleProcessGroup = (groupKey: string, processBucketKey?: string) => {
    if (isProcessGroupExpanded(groupKey)) {
      collapseProcessGroup(groupKey);
      if (processBucketKey) {
        syncSelectionWithProcessGroup(groupKey, processBucketKey);
      } else {
        selectProcessGroup(groupKey);
        syncSelectedFileWithGroup(groupKey);
      }
      return;
    }

    activateProcessGroup(groupKey, processBucketKey);
  };

  const handleProcessBucketClick = (bucketKey: string) => {
    toggleProcessBucket(bucketKey);
  };

  const handleProcessBucketKeydown = (event: KeyboardEvent, bucketKey: string, isToggleKeyboardKey: (event: KeyboardEvent) => boolean) => {
    if (isToggleKeyboardKey(event)) {
      event.preventDefault();
      toggleProcessBucket(bucketKey);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      expandProcessBucket(bucketKey);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      collapseProcessBucket(bucketKey);
    }
  };

  const handleProcessGroupRowClick = (groupKey: string, bucketKey: string) => {
    toggleProcessGroup(groupKey, bucketKey);
  };

  const handleProcessGroupRowKeydown = (
    event: KeyboardEvent,
    groupKey: string,
    bucketKey: string,
    moveProcessKeyboardFocus: (currentTarget: HTMLElement, direction: -1 | 1) => void,
    focusProcessBucketHeader: (bucketKey: string) => void,
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      activateProcessGroup(groupKey, bucketKey);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (isProcessGroupExpanded(groupKey)) {
        collapseProcessGroup(groupKey);
        syncSelectionWithProcessGroup(groupKey, bucketKey);
        return;
      }

      focusProcessBucketHeader(bucketKey);
      return;
    }

    const currentTarget = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    if (!currentTarget) { return; }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveProcessKeyboardFocus(currentTarget, 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveProcessKeyboardFocus(currentTarget, -1);
    }
  };

  const handleActiveRowChange = (item: ProcessTableItem | null) => {
    if (!item) {
      activeRowKey.value = null;
      return;
    }

    if (item.rowKind === "GROUP") { return; }

    activeRowKey.value = item.id;
    selectProcessGroup(item.processGroupKey);
    expandProcessBucket(item.processBucketKey);
    if (item.fileId) {
      setSelectedFile(item.fileId);
    }
  };

  const handleProcessesKeydown = (
    event: KeyboardEvent,
    resolveProcessBucketHeaderElement: (target: EventTarget | null) => HTMLElement | null,
    moveProcessKeyboardFocus: (currentTarget: HTMLElement, direction: -1 | 1) => void,
    focusProcessBucketHeader: (bucketKey: string) => void,
    isToggleKeyboardKey: (event: KeyboardEvent) => boolean,
  ) => {
    const bucketHeader = resolveProcessBucketHeaderElement(event.target);
    if (bucketHeader) {
      const bucketKey = bucketHeader.dataset.processBucketKey;
      if (!bucketKey) { return; }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveProcessKeyboardFocus(bucketHeader, 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveProcessKeyboardFocus(bucketHeader, -1);
      }

      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target?.closest(".compact-data-table-host")) { return; }

    const activeItem = activeRowKey.value ? processTableItemsById.value[activeRowKey.value] || null : null;
    if (!activeItem) { return; }

    if (isToggleKeyboardKey(event) && activeItem.rowKind === "GROUP") {
      event.preventDefault();
      toggleProcessGroup(activeItem.processGroupKey, activeItem.processBucketKey);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      activateProcessGroup(activeItem.processGroupKey, activeItem.processBucketKey);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (isProcessGroupExpanded(activeItem.processGroupKey)) {
        collapseProcessGroup(activeItem.processGroupKey);
        syncSelectionWithProcessGroup(activeItem.processGroupKey, activeItem.processBucketKey);
        return;
      }

      focusProcessBucketHeader(activeItem.processBucketKey);
    }
  };

  const handleRowClick = (item: ProcessTableItem) => {
    if (item.rowKind === "GROUP") { return; }

    activeRowKey.value = item.id;
    expandProcessBucket(item.processBucketKey);
    selectProcessGroup(item.processGroupKey);
    expandProcessGroup(item.processGroupKey);
    if (item.fileId) {
      setSelectedFile(item.fileId);
    }
  };

  const openFile = (fileId: number) => {
    setSelectedFile(fileId);
    pushToFile(fileId);
  };

  const handleRowDblClick = (item: ProcessTableItem) => {
    if (item.rowKind === "GROUP") { return; }

    handleRowClick(item);
    if (item.fileId) {
      openFile(item.fileId);
    }
  };

  return {
    handleActiveRowChange,
    handleProcessBucketClick,
    handleProcessBucketKeydown,
    handleProcessGroupRowClick,
    handleProcessGroupRowKeydown,
    handleProcessesKeydown,
    handleRowClick,
    handleRowDblClick,
    openFile,
    toggleProcessGroup,
  };
};
