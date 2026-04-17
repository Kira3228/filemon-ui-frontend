import { computed, nextTick, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import type { RowKey } from "../data-table.types";
import {
  isSameRowKey,
  resolveRowKey,
} from "../data-table.utils";

type SetActiveRowOptions = {
  emitClick?: boolean;
  scrollIntoView?: boolean;
};

type UseDataTableActiveRowOptions<T> = {
  activeRow: ComputedRef<T | null | undefined>;
  activeRowKey: ComputedRef<RowKey | null | undefined>;
  enableKeyboardNavigation: ComputedRef<boolean>;
  itemKey: ComputedRef<string>;
  items: ComputedRef<T[]>;
  rootRef: Ref<HTMLElement | null>;
  tableFocusRef: Ref<HTMLElement | null>;
  activateKeyboardScope?: () => void;
  emitClickRow: (item: T) => void;
  emitDblClickRow: (item: T) => void;
  emitActiveRow: (item: T | null) => void;
  emitActiveRowKey: (key: RowKey | null) => void;
};

export const useDataTableActiveRow = <T = unknown>({
  activeRow,
  activeRowKey: activeRowKeyInput,
  enableKeyboardNavigation,
  itemKey,
  items,
  rootRef,
  tableFocusRef,
  activateKeyboardScope,
  emitClickRow,
  emitDblClickRow,
  emitActiveRow,
  emitActiveRowKey,
}: UseDataTableActiveRowOptions<T>) => {
  const internalActiveRowKey = ref<RowKey | null>(null);

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
      if (!(row instanceof HTMLElement)) {
        return;
      }
      row.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  };

  const focusTableRoot = () => {
    if (!enableKeyboardNavigation.value) {
      return;
    }
    tableFocusRef.value?.focus({ preventScroll: true });
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

  const handleRowClick = (event: { data: T }) => {
    activateKeyboardScope?.();
    focusTableRoot();
    setActiveRow(event.data, { emitClick: true });
  };

  const handleRowDblClick = (event: { data: T }) => {
    activateKeyboardScope?.();
    focusTableRoot();
    setActiveRow(event.data);
    emitDblClickRow(event.data);
  };

  return {
    activeRowKey,
    focusTableRoot,
    getActiveRowIndex,
    getRowClass,
    handleRowClick,
    handleRowDblClick,
    isActiveRow,
    setActiveRow,
  };
};
