import type {
  ActiveFilterSummary,
  ColumnFilters,
  ColumnFilterState,
  FilterMode,
  FilterOption,
  RangeValueType,
} from "../types/data-table.types";
import type { DataTableFilterValueType, Header } from "../types/header.type";
import {
  getFilterSourceValue,
  normalizeFilterKey,
  normalizeFilterLabel,
  normalizeScalarFilterValue,
  parseDateValue,
  parseNumberValue,
  resolveRangeComparableValue,
} from "./data-table.utils";

type RangeDraft = {
  from: string;
  to: string;
};

export type FilterDraftState = {
  mode: FilterMode;
  selectedKeys: string[];
  containsQuery: string;
  range: RangeDraft;
};

type ApplyColumnFilterParams = {
  columnKey: string;
  currentFilters: ColumnFilters;
  mode: FilterMode;
  selectedKeys: string[];
  availableKeys: string[];
  containsQuery: string;
  range: RangeDraft;
  rangeValueType: RangeValueType | null;
};

export const inferFilterValueType = (
  header: Header,
  rawItems: unknown[],
): DataTableFilterValueType => {
  if (header.filterValueType) { return header.filterValueType; }

  const samples = rawItems
    .map((item) => getFilterSourceValue(item, header))
    .map((value) => normalizeScalarFilterValue(value))
    .filter((value) => value !== null && value !== undefined && value !== "")
    .slice(0, 25);

  if (!samples.length) { return "text"; }
  if (samples.every((sample) => parseNumberValue(sample) !== null)) { return "number"; }
  if (samples.every((sample) => parseDateValue(sample) !== null)) { return "date"; }
  return "text";
};

export const getRangeValueType = (
  header: Header,
  rawItems: unknown[],
): RangeValueType | null => {
  const valueType = inferFilterValueType(header, rawItems);
  return valueType === "number" || valueType === "date" ? valueType : null;
};

export const getAvailableFilterModes = (
  header: Header,
  rawItems: unknown[],
): FilterMode[] => {
  const requestedModes: FilterMode[] = Array.isArray(header.filterModes) && header.filterModes.length
    ? [...header.filterModes]
    : ["select", "contains", "range"];

  return requestedModes.filter((mode, index, list) => {
    if (list.indexOf(mode) !== index) { return false; }
    if (mode !== "range") { return true; }
    return getRangeValueType(header, rawItems) !== null;
  });
};

export const getDefaultFilterMode = (
  header: Header,
  rawItems: unknown[],
): FilterMode => {
  const availableModes = getAvailableFilterModes(header, rawItems);
  if (header.filterMode && availableModes.includes(header.filterMode)) {
    return header.filterMode;
  }
  return availableModes[0] || "select";
};

export const passesColumnFilter = (
  item: unknown,
  header: Header,
  columnFilters: ColumnFilters,
  skipColumn?: string | null,
) => {
  if (header.filterable === false) { return true; }
  if (skipColumn && header.value === skipColumn) { return true; }

  const filterState = columnFilters[header.value];
  if (!filterState) { return true; }

  const rawValue = getFilterSourceValue(item, header);

  if (filterState.mode === "select") {
    const valueKey = normalizeFilterKey(rawValue);
    return filterState.selectedKeys.includes(valueKey);
  }

  if (filterState.mode === "contains") {
    const query = filterState.query.trim().toLowerCase();
    if (!query) { return true; }
    return normalizeFilterLabel(rawValue).toLowerCase().includes(query);
  }

  const comparableValue = resolveRangeComparableValue(rawValue, filterState.valueType);
  if (comparableValue === null) { return false; }

  const fromValue = filterState.from
    ? resolveRangeComparableValue(filterState.from, filterState.valueType)
    : null;
  const toValue = filterState.to
    ? resolveRangeComparableValue(filterState.to, filterState.valueType)
    : null;

  if (fromValue !== null && comparableValue < fromValue) { return false; }
  if (toValue !== null && comparableValue > toValue) { return false; }
  return true;
};

export const getFilteredItems = (
  rawItems: unknown[],
  visibleHeaders: Header[],
  columnFilters: ColumnFilters,
) =>
  rawItems.filter((item) =>
    visibleHeaders.every((header) => passesColumnFilter(item, header, columnFilters)),
  );

export const getFilterOptions = (
  header: Header,
  rawItems: unknown[],
  visibleHeaders: Header[],
  columnFilters: ColumnFilters,
): FilterOption[] => {
  const scopedItems = rawItems.filter((item) =>
    visibleHeaders.every((columnHeader) =>
      passesColumnFilter(item, columnHeader, columnFilters, header.value),
    ),
  );

  const optionsMap = new Map<string, FilterOption>();

  for (const item of scopedItems) {
    const rawValue = getFilterSourceValue(item, header);
    const key = normalizeFilterKey(rawValue);
    const label = normalizeFilterLabel(rawValue);
    const existing = optionsMap.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      optionsMap.set(key, { key, label, count: 1 });
    }
  }

  return Array.from(optionsMap.values()).sort((first, second) =>
    first.label.localeCompare(second.label, "ru", { numeric: true, sensitivity: "base" }),
  );
};

export const formatRangeDraftValue = (value: string, valueType: RangeValueType) => {
  if (!value) { return ""; }
  if (valueType === "number") { return value; }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) { return value; }
  return parsed.toLocaleString("ru-RU");
};

const buildSelectFilterSummary = (
  selectedKeys: string[],
  filterOptions: FilterOption[],
) => {
  const optionLabels = new Map(
    filterOptions.map((option) => [option.key, option.label]),
  );
  const labels = selectedKeys.map((key) => optionLabels.get(key) || key);

  if (!labels.length) {
    return {
      text: "ничего не выбрано",
      fullText: "ничего не выбрано",
    };
  }

  const preview = labels.length > 2
    ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`
    : labels.join(", ");

  return {
    text: preview,
    fullText: labels.join(", "),
  };
};

export const buildFilterSummary = (
  header: Header,
  filterState: ColumnFilterState,
  filterOptions: FilterOption[],
): ActiveFilterSummary => {
  if (filterState.mode === "contains") {
    const summary = `содержит "${filterState.query}"`;
    return {
      key: header.value,
      label: header.text,
      text: summary,
      fullText: summary,
    };
  }

  if (filterState.mode === "range") {
    const fromText = filterState.from
      ? formatRangeDraftValue(filterState.from, filterState.valueType)
      : "";
    const toText = filterState.to
      ? formatRangeDraftValue(filterState.to, filterState.valueType)
      : "";
    const summary = fromText && toText
      ? `${fromText} - ${toText}`
      : fromText
        ? `от ${fromText}`
        : `до ${toText}`;

    return {
      key: header.value,
      label: header.text,
      text: summary,
      fullText: summary,
    };
  }

  const selectSummary = buildSelectFilterSummary(filterState.selectedKeys, filterOptions);
  return {
    key: header.value,
    label: header.text,
    text: selectSummary.text,
    fullText: selectSummary.fullText,
  };
};

export const createFilterDraftState = (
  currentState: ColumnFilterState | undefined,
  availableKeys: string[],
  defaultMode: FilterMode,
): FilterDraftState => ({
  mode: currentState?.mode || defaultMode,
  selectedKeys: currentState?.mode === "select"
    ? currentState.selectedKeys.filter((key) => availableKeys.includes(key))
    : availableKeys,
  containsQuery: currentState?.mode === "contains" ? currentState.query : "",
  range: currentState?.mode === "range"
    ? { from: currentState.from, to: currentState.to }
    : { from: "", to: "" },
});

export const applyColumnFilterState = ({
  columnKey,
  currentFilters,
  mode,
  selectedKeys,
  availableKeys,
  containsQuery,
  range,
  rangeValueType,
}: ApplyColumnFilterParams): ColumnFilters => {
  const nextFilters = { ...currentFilters };

  if (mode === "select") {
    const isUnfilteredState =
      selectedKeys.length === availableKeys.length &&
      selectedKeys.every((key) => availableKeys.includes(key));

    if (isUnfilteredState) {
      delete nextFilters[columnKey];
    } else {
      nextFilters[columnKey] = {
        mode: "select",
        selectedKeys: [...selectedKeys],
      };
    }

    return nextFilters;
  }

  if (mode === "contains") {
    const query = containsQuery.trim();
    if (!query) {
      delete nextFilters[columnKey];
    } else {
      nextFilters[columnKey] = {
        mode: "contains",
        query,
      };
    }

    return nextFilters;
  }

  const from = range.from.trim();
  const to = range.to.trim();

  if (!rangeValueType || (!from && !to)) {
    delete nextFilters[columnKey];
  } else {
    nextFilters[columnKey] = {
      mode: "range",
      from,
      to,
      valueType: rangeValueType,
    };
  }

  return nextFilters;
};
