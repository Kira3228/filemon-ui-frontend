import { computed, ComputedRef, ref, watch } from "vue";
import { Header } from "../types/header.type";
import { SortMeta } from "../types/data-table.types";
import {
  createSortStatePayload,
  getNextHeaderSortMeta,
  getSortIconClassByOrder,
  getSortOrder,
  normalizeSortMeta,
  resolveMultiSortMeta,
  sortDataTableItems,
  stripForcedGroupSort,
} from "../utils/data-table-sorting.utils";


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
  const multiSortMeta = ref<SortMeta[]>(
    normalizeSortMeta(sortByList.value, sortDescList.value),
  );

  const stripCurrentForcedGroupSort = (meta: SortMeta[]) =>
    stripForcedGroupSort(meta, groupSortField.value, rowGroupMode.value);

  const resolvedMultiSortMeta = computed(() =>
    resolveMultiSortMeta(
      multiSortMeta.value,
      groupSortField.value,
      rowGroupMode.value,
    ),
  );

  watch(
    () => [sortByList.value, sortDescList.value],
    ([nextSortByList, nextSortDescList]) => {
      multiSortMeta.value = stripCurrentForcedGroupSort(
        normalizeSortMeta(nextSortByList, nextSortDescList),
      );
    },
    { deep: true },
  );

  watch(
    () => [rowGroupMode.value, groupSortField.value],
    () => {
      multiSortMeta.value = stripCurrentForcedGroupSort(multiSortMeta.value);
    },
  );

  const emitCurrentSortState = (meta: SortMeta[]) => {
    emitSortState(createSortStatePayload(meta));
  };

  const handleSort = (event: { multiSortMeta?: SortMeta[] }) => {
    const meta = stripCurrentForcedGroupSort(event.multiSortMeta || []);
    multiSortMeta.value = meta;
    emitCurrentSortState(meta);
  };

  const sortedItems = computed(() =>
    sortDataTableItems(
      filteredItems.value,
      resolvedMultiSortMeta.value,
      visibleHeaders.value,
    ),
  );

  const getHeaderSortOrder = (header: Header) =>
    getSortOrder(multiSortMeta.value, header.value);

  const getSortIconClass = (header: Header) => {
    return getSortIconClassByOrder(getHeaderSortOrder(header));
  };

  const handleHeaderSort = (header: Header, event: MouseEvent) => {
    if (!header.sortable) {
      return;
    }

    const withExisting = event.ctrlKey || event.metaKey || event.shiftKey;
    const nextMeta = getNextHeaderSortMeta(
      multiSortMeta.value,
      header.value,
      withExisting,
    );

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
