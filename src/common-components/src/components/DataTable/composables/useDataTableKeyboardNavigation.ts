import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { ComputedRef, Ref } from "vue";
import { scrollActiveRowIntoView } from "../data-table.utils";

type UseDataTableKeyboardNavigationOptions<T> = {
  activeRowKey: ComputedRef<string | number | null>;
  enableKeyboardNavigation: ComputedRef<boolean>;
  findActiveRowIndex: () => number;
  focusTableRoot: () => void;
  hasActiveItem: (item: T) => boolean;
  items: ComputedRef<T[]>;
  itemsPerPage: ComputedRef<number | undefined>;
  onActivateRow: (item: T | null, options?: { emitClick?: boolean; scrollIntoView?: boolean }) => void;
  onConfirmRow?: (item: T) => void;
  rootRef: Ref<HTMLElement | null>;
  tableFocusRef: Ref<HTMLElement | null>;
};

export const useDataTableKeyboardNavigation = <T>({
  activeRowKey,
  enableKeyboardNavigation,
  findActiveRowIndex,
  focusTableRoot,
  hasActiveItem,
  items,
  itemsPerPage,
  onActivateRow,
  onConfirmRow,
  rootRef,
  tableFocusRef,
}: UseDataTableKeyboardNavigationOptions<T>) => {
  const displayedItems = ref<unknown[]>([]);
  const shadowLoading = ref(false);
  const isKeyboardScopeActive = ref(false);

  let shadowFrameId: number | null = null;
  let shadowTimeoutId: number | null = null;

  const clearShadowSchedule = () => {
    if (shadowFrameId !== null) {
      window.cancelAnimationFrame(shadowFrameId);
      shadowFrameId = null;
    }

    if (shadowTimeoutId !== null) {
      window.clearTimeout(shadowTimeoutId);
      shadowTimeoutId = null;
    }
  };

  const ensureRowRendered = (index: number) => {
    if (index < 0) { return; }

    const minimumCount = Math.max(displayedItems.value.length, index + 1);
    if (minimumCount <= displayedItems.value.length) { return; }

    displayedItems.value = items.value.slice(0, minimumCount);
    shadowLoading.value = minimumCount < items.value.length;
  };



  const syncKeyboardScope = () => {
    nextTick(() => {
      const scopeElement = tableFocusRef.value;
      if (!(scopeElement instanceof HTMLElement)) { return; }

      scopeElement.tabIndex = enableKeyboardNavigation.value ? 0 : -1;
      scopeElement.classList.add("compact-data-table__keyboard-scope");
      scopeElement.setAttribute("role", "grid");
    });
  };

  const activateKeyboardScope = () => {
    isKeyboardScopeActive.value = true;
  };

  const deactivateKeyboardScope = () => {
    isKeyboardScopeActive.value = false;
  };

  const handleTableFocusOut = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && tableFocusRef.value?.contains(nextTarget)) { return; }
    deactivateKeyboardScope();
  };

  const isKeyboardEventTargetInteractive = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) { return false; }
    if (target.isContentEditable) { return true; }

    return Boolean(target.closest(
      "input, textarea, select, button, a, [role='button'], [contenteditable='true'], .compact-data-table__columns-panel",
    ));
  };

  const isTableBodyTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) { return false; }
    if (!rootRef.value?.contains(target)) { return false; }

    return Boolean(target.closest(
      ".p-datatable-wrapper, .p-datatable-table, .p-datatable-tbody, td, tr",
    ));
  };

  const handleDocumentPointerDown = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target) { return; }

    if (isTableBodyTarget(target)) {
      activateKeyboardScope();
      focusTableRoot();
      return;
    }

    deactivateKeyboardScope();
  };

  const moveActiveRow = (nextIndex: number) => {
    if (!items.value.length) { return; }

    const boundedIndex = Math.max(0, Math.min(items.value.length - 1, nextIndex));
    ensureRowRendered(boundedIndex);
    onActivateRow(items.value[boundedIndex], { emitClick: true });
  };

  const handleTableKeydown = (event: KeyboardEvent) => {
    if (!enableKeyboardNavigation.value || !isKeyboardScopeActive.value) {
      return;
    }

    if (isKeyboardEventTargetInteractive(event.target)) {
      return;
    }

    if (!items.value.length) {
      return;
    }

    const currentIndex = findActiveRowIndex();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveRow(currentIndex < 0 ? 0 : currentIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveRow(currentIndex < 0 ? 0 : currentIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveActiveRow(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveActiveRow(items.value.length - 1);
      return;
    }

    if (event.key === "Enter" && currentIndex >= 0) {
      event.preventDefault();
      const item = items.value[currentIndex];
      onActivateRow(item, { emitClick: true });
      onConfirmRow?.(item);
    }
  };

  const getShadowChunkSize = () => {
    const baseSize = Number(itemsPerPage.value) || 50;
    return Math.max(40, Math.min(200, baseSize * 3));
  };

  const applyShadowLoading = () => {
    clearShadowSchedule();

    const chunkSize = getShadowChunkSize();
    if (items.value.length <= chunkSize) {
      displayedItems.value = items.value;
      shadowLoading.value = false;
      return;
    }

    displayedItems.value = items.value.slice(0, chunkSize);
    shadowLoading.value = true;

    const appendChunk = () => {
      const nextCount = Math.min(displayedItems.value.length + chunkSize, items.value.length);
      displayedItems.value = items.value.slice(0, nextCount);

      if (nextCount >= items.value.length) {
        shadowLoading.value = false;
        clearShadowSchedule();
        return;
      }

      shadowTimeoutId = window.setTimeout(() => {
        shadowFrameId = window.requestAnimationFrame(appendChunk);
      }, 16);
    };

    shadowTimeoutId = window.setTimeout(() => {
      shadowFrameId = window.requestAnimationFrame(appendChunk);
    }, 16);
  };

  const syncActiveRowWithItems = () => {
    if (!items.value.length) {
      if (activeRowKey.value !== null) {
        onActivateRow(null, { scrollIntoView: false });
      }
      return;
    }

    const hasActiveRow = items.value.some(hasActiveItem);
    if (hasActiveRow) {
      return;
    }

    onActivateRow(items.value[0], {
      emitClick: true,
      scrollIntoView: false,
    });
  };

  onMounted(() => {
    document.addEventListener("mousedown", handleDocumentPointerDown);
    window.addEventListener("keydown", handleTableKeydown, true);
    syncKeyboardScope();
  });

  onBeforeUnmount(() => {
    clearShadowSchedule();
    document.removeEventListener("mousedown", handleDocumentPointerDown);
    window.removeEventListener("keydown", handleTableKeydown, true);
  });

  watch(items, () => {
    applyShadowLoading();
    syncKeyboardScope();
    syncActiveRowWithItems();
  }, { immediate: true });

  watch(enableKeyboardNavigation, () => {
    syncKeyboardScope();
  }, { immediate: true });

  watch(activeRowKey, (key) => {
    if (key === null) { return; }

    const index = findActiveRowIndex();
    if (index < 0) { return; }

    ensureRowRendered(index);
    scrollActiveRowIntoView(rootRef);
  }, { immediate: true });

  return {
    activateKeyboardScope,
    clearShadowSchedule,
    deactivateKeyboardScope,
    displayedItems,
    ensureRowRendered,
    handleDocumentPointerDown,
    handleTableFocusOut,
    isKeyboardScopeActive,
    shadowLoading,
    syncActiveRowWithItems,
    syncKeyboardScope,
  };
};
