import { SortMeta } from "../types/data-table.types";
import { Header } from "../types/header.type";
import {
  compareValues,
  resolveExportValue,
  resolveFieldData,
} from "./data-table.utils";

type RowGroupMode = "subheader" | "rowspan" | null;

export type SortStatePayload = {
  sortBy: string[];
  sortDesc: boolean[];
};

export const normalizeSortMeta = (
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

export const stripForcedGroupSort = (
  meta: SortMeta[],
  groupSortField: string | null,
  rowGroupMode: RowGroupMode,
) => {
  if (!groupSortField || !rowGroupMode || !meta.length) {
    return meta;
  }

  return meta.filter(
    (item, index) => !(index === 0 && item.field === groupSortField),
  );
};

export const resolveMultiSortMeta = (
  meta: SortMeta[],
  groupSortField: string | null,
  rowGroupMode: RowGroupMode,
) => {
  if (!groupSortField || !rowGroupMode) {
    return meta;
  }

  return [
    { field: groupSortField, order: 1 },
    ...meta.filter((item) => item.field !== groupSortField),
  ];
};

export const createSortStatePayload = (
  meta: SortMeta[],
): SortStatePayload => ({
  sortBy: meta.map((item) => item.field),
  sortDesc: meta.map((item) => item.order === -1),
});

export const getNextHeaderSortMeta = (
  currentMeta: SortMeta[],
  field: string,
  withExisting: boolean,
) => {
  const currentSort =
    currentMeta.find((item) => item.field === field) || null;

  const nextMeta = withExisting
    ? [...currentMeta]
    : currentSort
      ? [{ ...currentSort }]
      : [];

  const currentIndex = nextMeta.findIndex((item) => item.field === field);

  if (currentIndex === -1) {
    nextMeta.push({ field, order: 1 });
  } else if (nextMeta[currentIndex].order === 1) {
    nextMeta[currentIndex] = { field, order: -1 };
  } else {
    nextMeta.splice(currentIndex, 1);
  }

  return nextMeta;
};

export const getSortOrder = (meta: SortMeta[], field: string) =>
  meta.find((item) => item.field === field)?.order ?? null;

export const getSortIconClassByOrder = (order: number | null) => {
  if (order === 1) {
    return "pi-sort-amount-up-alt";
  }

  if (order === -1) {
    return "pi-sort-amount-down";
  }

  return "pi-sort-alt";
};

export const sortDataTableItems = (
  items: unknown[],
  sortMeta: SortMeta[],
  visibleHeaders: Header[],
) => {
  if (!sortMeta.length) {
    return items;
  }

  const headerByValue = new Map(
    visibleHeaders.map((header) => [header.value, header]),
  );

  return [...items].sort((first, second) => {
    for (const item of sortMeta) {
      const sortHeader = headerByValue.get(item.field);

      const firstValue = sortHeader
        ? resolveExportValue(first, sortHeader)
        : resolveFieldData(first, item.field);

      const secondValue = sortHeader
        ? resolveExportValue(second, sortHeader)
        : resolveFieldData(second, item.field);

      const delta = compareValues(firstValue, secondValue);

      if (delta !== 0) {
        return item.order === -1 ? -delta : delta;
      }
    }

    return 0;
  });
};
