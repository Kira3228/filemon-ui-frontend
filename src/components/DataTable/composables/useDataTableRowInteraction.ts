import {
  ComputedRef,
  onBeforeUnmount,
  onMounted,
  Ref,
  watch,
} from "vue";
import { RowKey } from "../types/data-table.types";
import { useDataTableActiveRow } from "./useDataTableActiveRow";
import { useDataTableKeyboardScope } from "./useDataTableKeyboardScope";
import { useDataTableShadowItems } from "./useDataTableShadowItems";

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
  const {
    activeRowKey,
    getActiveRowIndex,
    getRowClass,
    isActiveRow,
    scrollActiveRowIntoView,
    setActiveRow,
  } = useDataTableActiveRow({
    activeRow,
    activeRowKey: activeRowKeyInput,
    itemKey,
    items,
    rootRef,
    emitClickRow,
    emitActiveRow,
    emitActiveRowKey,
  });

  const {
    applyShadowLoading,
    displayedItems,
    ensureRowRendered,
    shadowLoading,
  } = useDataTableShadowItems({
    items,
    itemsPerPage,
  });

  const {
    activateKeyboardScope,
    focusTableRoot,
    handleTableFocusOut,
    isKeyboardEventTargetInteractive,
    isKeyboardScopeActive,
    syncKeyboardScope,
  } = useDataTableKeyboardScope({
    enableKeyboardNavigation,
    rootRef,
    tableFocusRef,
  });

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

  onMounted(() => {
    window.addEventListener("keydown", handleTableKeydown, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleTableKeydown, true);
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
