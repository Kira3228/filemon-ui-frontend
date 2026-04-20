import { computed, ref, watch } from "vue";
import type { ComputedRef } from "vue";
import type { Header } from "../header.type";
import type { SortMeta } from "../data-table.types";
import {
  compareValues,
  resolveExportValue,
  resolveFieldData,
} from "../data-table.utils";

interface UseDataTableSortingOptions {
  sortByList: ComputedRef<unknown>;
  sortDescList: ComputedRef<unknown>;
  groupSortField: ComputedRef<string | null>;
  rowGroupMode: ComputedRef<"subheader" | "rowspan" | null>;
  filteredItems: ComputedRef<unknown[]>;
  visibleHeaders: ComputedRef<Header[]>;
  emitSortState: (payload: { sortBy: string[]; sortDesc: boolean[] }) => void;
}

export const useDataTableSorting = ({
  sortByList,
  sortDescList,
  groupSortField,
  rowGroupMode,
  filteredItems,
  visibleHeaders,
  emitSortState,

}: UseDataTableSortingOptions) => {
  const normalizeSortMeta = (
    sortByListValue: unknown,
    sortDescListValue: unknown,
  ): SortMeta[] => {
    const sortFields = Array.isArray(sortByListValue)
      ? sortByListValue
      : sortByListValue
        ? [sortByListValue]
        : [];

    const sortDirections = Array.isArray(sortDescListValue)
      ? sortDescListValue
      : sortDescListValue !== undefined
        ? [sortDescListValue]
        : [];

    return sortFields.filter(Boolean).map((field, index) => ({
      field: String(field),
      order: sortDirections[index] ? -1 : 1,
    }));
  };

  const multiSortMeta = ref<SortMeta[]>(
    normalizeSortMeta(sortByList.value, sortDescList.value),
  );

  const stripForcedGroupSort = (meta: SortMeta[]) => {
    const field = groupSortField.value;

    if (!field || !rowGroupMode.value || !meta.length) {
      return meta;
    }

    return meta.filter((item, index) => !(index === 0 && item.field === field));
  };

  const resolveMultiSortMeta = (meta: SortMeta[]) => {
    const field = groupSortField.value;

    if (!field || !rowGroupMode.value) {
      return meta;
    }

    return [{ field, order: 1 }, ...meta.filter((item) => item.field !== field)];
  };

  const resolvedMultiSortMeta = computed(() =>
    resolveMultiSortMeta(multiSortMeta.value),
  );

  watch(
    () => [sortByList.value, sortDescList.value],
    ([nextSortByList, nextSortDescList]) => {
      multiSortMeta.value = stripForcedGroupSort(
        normalizeSortMeta(nextSortByList, nextSortDescList),
      );
    },
    { deep: true },
  );

  watch(
    () => [rowGroupMode.value, groupSortField.value],
    () => {
      multiSortMeta.value = stripForcedGroupSort(multiSortMeta.value);
    },
  );

  const emitCurrentSortState = (meta: SortMeta[]) => {
    emitSortState({
      sortBy: meta.map((item) => item.field),
      sortDesc: meta.map((item) => item.order === -1),
    });
  };

  const handleSort = (event: { multiSortMeta?: SortMeta[] }) => {
    const meta = stripForcedGroupSort(event.multiSortMeta || []);
    multiSortMeta.value = meta;
    emitCurrentSortState(meta);
  };

  const sortedItems = computed(() => {
    if (!resolvedMultiSortMeta.value.length) {
      return filteredItems.value;
    }

    return [...filteredItems.value].sort((first, second) => {
      for (const sortMeta of resolvedMultiSortMeta.value) {
        const sortHeader = visibleHeaders.value.find(
          (header) => header.value === sortMeta.field,
        );

        const firstValue = sortHeader
          ? resolveExportValue(first, sortHeader)
          : resolveFieldData(first, sortMeta.field);

        const secondValue = sortHeader
          ? resolveExportValue(second, sortHeader)
          : resolveFieldData(second, sortMeta.field);

        const delta = compareValues(firstValue, secondValue);

        if (delta !== 0) {
          return sortMeta.order === -1 ? -delta : delta;
        }
      }

      return 0;
    });
  });

  const getSortOrder = (header: Header) =>
    multiSortMeta.value.find((item) => item.field === header.value)?.order ??
    null;

  const getSortIconClass = (header: Header) => {
    const order = getSortOrder(header);

    if (order === 1) {
      return "pi-sort-amount-up-alt";
    }

    if (order === -1) {
      return "pi-sort-amount-down";
    }

    return "pi-sort-alt";
  };

  const handleHeaderSort = (header: Header, event: MouseEvent) => {
    if (!header.sortable) {
      return;
    }

    const withExisting = event.ctrlKey || event.metaKey || event.shiftKey;
    const currentSort =
      multiSortMeta.value.find((item) => item.field === header.value) || null;

    const nextMeta = withExisting
      ? [...multiSortMeta.value]
      : currentSort
        ? [{ ...currentSort }]
        : [];

    const currentIndex = nextMeta.findIndex(
      (item) => item.field === header.value,
    );

    if (currentIndex === -1) {
      nextMeta.push({ field: header.value, order: 1 });
    } else if (nextMeta[currentIndex].order === 1) {
      nextMeta[currentIndex] = { field: header.value, order: -1 };
    } else {
      nextMeta.splice(currentIndex, 1);
    }

    multiSortMeta.value = nextMeta;
    emitCurrentSortState(nextMeta);
  };

  const clearColumnSort = (columnValue: string) => {
    const nextMeta = multiSortMeta.value.filter(
      (item) => item.field !== columnValue,
    );

    if (nextMeta.length === multiSortMeta.value.length) {
      return;
    }

    multiSortMeta.value = nextMeta;
    emitCurrentSortState(nextMeta);
  };

  return {
    multiSortMeta,
    resolvedMultiSortMeta,
    sortedItems,
    handleSort,
    handleHeaderSort,
    getSortIconClass,
    clearColumnSort,
  };
};
