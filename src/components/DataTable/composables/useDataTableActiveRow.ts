import { computed, ComputedRef, nextTick, Ref, ref } from "vue";
import { RowKey } from "../types/data-table.types";
import {
  isSameRowKey,
  resolveRowKey,
} from "../utils/data-table.utils";

type SetActiveRowOptions = {
  emitClick?: boolean;
  scrollIntoView?: boolean;
};

type UseDataTableActiveRowOptions<T> = {
  activeRow: ComputedRef<T | null | undefined>;
  activeRowKey: ComputedRef<RowKey | null | undefined>;
  itemKey: ComputedRef<string>;
  items: ComputedRef<T[]>;
  rootRef: Ref<HTMLElement | null>;
  emitClickRow: (item: T) => void;
  emitActiveRow: (item: T | null) => void;
  emitActiveRowKey: (key: RowKey | null) => void;
};

export const useDataTableActiveRow = <T = unknown>({
  activeRow,
  activeRowKey: activeRowKeyInput,
  itemKey,
  items,
  rootRef,
  emitClickRow,
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

  return {
    activeRowKey,
    getActiveRowIndex,
    getRowClass,
    isActiveRow,
    scrollActiveRowIntoView,
    setActiveRow,
  };
};
