import {
  ComputedRef,
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch,
} from "vue";
import { RowKey } from "../types/data-table.types";
import {
  isSameRowKey,
  resolveRowKey,
} from "../utils/data-table.utils";

type UseDataTableRowInteractionOptions<T> = {
  activeRow: ComputedRef<T | null | undefined>;
  activeRowKey: ComputedRef<RowKey | null | undefined>;
  enableKeyboardNavigation: ComputedRef<boolean>;
  itemKey: ComputedRef<string>;
  items: ComputedRef<T[]>;
  itemsPerPage: ComputedRef<number | undefined>;
  rootRef: Ref<HTMLElement | null>;
  tableFocusRef: Ref<HTMLElement | null>;
  emitClickRow: (item: T) => void;
  emitDblClickRow: (item: T) => void;
  emitActiveRow: (item: T | null) => void;
  emitActiveRowKey: (key: RowKey | null) => void;
};

type SetActiveRowOptions = {
  emitClick?: boolean;
  scrollIntoView?: boolean;
};

const INTERACTIVE_SELECTOR =
  "input, textarea, select, button, a, [role='button'], [contenteditable='true'], .compact-data-table__columns-panel";

const TABLE_BODY_SELECTOR =
  ".p-datatable-wrapper, .p-datatable-table, .p-datatable-tbody, td, tr";

export const useDataTableRowInteraction = <T = unknown>({
  activeRow,
  activeRowKey: activeRowKeyInput,
  enableKeyboardNavigation,
  itemKey,
  items,
  itemsPerPage,
  rootRef,
  tableFocusRef,
  emitClickRow,
  emitDblClickRow,
  emitActiveRow,
  emitActiveRowKey,
}: UseDataTableRowInteractionOptions<T>) => {
  const internalActiveRowKey = ref<RowKey | null>(null);
  const displayedItems = ref([]) as Ref<T[]>;
  const shadowLoading = ref(false);
  const isKeyboardScopeActive = ref(false);

  let shadowFrameId: number | null = null;
  let shadowTimeoutId: number | null = null;

  const controlledActiveRowKey = computed<RowKey | null | undefined>(() => {
    if (activeRowKeyInput.value !== undefined) {
      return activeRowKeyInput.value ?? null;
    }

    if (activeRow.value !== undefined) {
      return resolveRowKey(activeRow.value, itemKey.value);
    }

    return undefined;
  });

  const activeRowKey = computed<RowKey | null>(() =>
    controlledActiveRowKey.value !== undefined
      ? controlledActiveRowKey.value
      : internalActiveRowKey.value,
  );

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
      const nextCount = Math.min(
        displayedItems.value.length + chunkSize,
        items.value.length,
      );
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

  const ensureRowRendered = (index: number) => {
    if (index < 0) {
      return;
    }

    const minimumCount = Math.max(displayedItems.value.length, index + 1);
    if (minimumCount <= displayedItems.value.length) {
      return;
    }

    displayedItems.value = items.value.slice(0, minimumCount);
    shadowLoading.value = minimumCount < items.value.length;
  };

  const isActiveRow = (item: T) =>
    isSameRowKey(resolveRowKey(item, itemKey.value), activeRowKey.value);

  const getActiveRowIndex = () =>
    items.value.findIndex((item) =>
      isSameRowKey(resolveRowKey(item, itemKey.value), activeRowKey.value),
    );

  const scrollActiveRowIntoView = () => {
    nextTick(() => {
      const row = rootRef.value?.querySelector(
        ".compact-data-table__row--active",
      );

      if (row instanceof HTMLElement) {
        row.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
  };

  const setActiveRow = (
    item: T | null,
    options: SetActiveRowOptions = {},
  ) => {
    const nextKey = resolveRowKey(item, itemKey.value);

    if (controlledActiveRowKey.value === undefined) {
      internalActiveRowKey.value = nextKey;
    }

    emitActiveRow(item);
    emitActiveRowKey(nextKey);

    if (item && options.emitClick) {
      emitClickRow(item);
    }

    if (item && options.scrollIntoView !== false) {
      scrollActiveRowIntoView();
    }
  };

  const getRowClass = (item: T) => ({
    "compact-data-table__row--active": isActiveRow(item),
  });

  const focusTableRoot = () => {
    if (enableKeyboardNavigation.value) {
      tableFocusRef.value?.focus({ preventScroll: true });
    }
  };

  const syncKeyboardScope = () => {
    nextTick(() => {
      const scopeElement = tableFocusRef.value;
      if (!(scopeElement instanceof HTMLElement)) {
        return;
      }

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
    if (!nextTarget || !tableFocusRef.value?.contains(nextTarget)) {
      deactivateKeyboardScope();
    }
  };

  const isKeyboardEventTargetInteractive = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return target.isContentEditable || Boolean(target.closest(INTERACTIVE_SELECTOR));
  };

  const isTableBodyTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(rootRef.value?.contains(target) && target.closest(TABLE_BODY_SELECTOR));
  };

  const moveActiveRow = (nextIndex: number) => {
    if (!items.value.length) {
      return;
    }

    const boundedIndex = Math.max(
      0,
      Math.min(items.value.length - 1, nextIndex),
    );

    ensureRowRendered(boundedIndex);
    setActiveRow(items.value[boundedIndex], { emitClick: true });
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

    const currentIndex = getActiveRowIndex();

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
      setActiveRow(item, { emitClick: true });
      emitDblClickRow(item);
    }
  };

  const syncActiveRowWithItems = () => {
    if (!items.value.length) {
      if (activeRowKey.value !== null) {
        setActiveRow(null, { scrollIntoView: false });
      }
      return;
    }

    const hasActiveRow = items.value.some(isActiveRow);
    if (hasActiveRow) {
      return;
    }

    setActiveRow(items.value[0], {
      scrollIntoView: false,
    });
  };

  const handleRowClick = (event: { data: T }) => {
    activateKeyboardScope();
    focusTableRoot();
    setActiveRow(event.data, { emitClick: true });
  };

  const handleRowDblClick = (event: { data: T }) => {
    activateKeyboardScope();
    focusTableRoot();
    setActiveRow(event.data);
    emitDblClickRow(event.data);
  };

  const handleDocumentPointerDown = (event: MouseEvent) => {
    if (!enableKeyboardNavigation.value) {
      deactivateKeyboardScope();
      return;
    }

    if (isTableBodyTarget(event.target)) {
      activateKeyboardScope();
      focusTableRoot();
      return;
    }

    deactivateKeyboardScope();
  };

  onMounted(() => {
    document.addEventListener("mousedown", handleDocumentPointerDown);
    window.addEventListener("keydown", handleTableKeydown, true);
    syncKeyboardScope();
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleDocumentPointerDown);
    window.removeEventListener("keydown", handleTableKeydown, true);
    clearShadowSchedule();
  });

  watch(
    items,
    () => {
      applyShadowLoading();
      syncKeyboardScope();
      syncActiveRowWithItems();
    },
    { immediate: true },
  );

  watch(
    enableKeyboardNavigation,
    () => {
      syncKeyboardScope();
    },
    { immediate: true },
  );

  watch(
    activeRowKey,
    (key) => {
      if (key === null) {
        return;
      }

      const index = getActiveRowIndex();
      if (index < 0) {
        return;
      }

      ensureRowRendered(index);
      scrollActiveRowIntoView();
    },
    { immediate: true },
  );

  return {
    activateKeyboardScope,
    activeRowKey,
    displayedItems,
    getRowClass,
    handleRowClick,
    handleRowDblClick,
    handleTableFocusOut,
    shadowLoading,
    syncKeyboardScope,
  };
};
