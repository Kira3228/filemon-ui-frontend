import { Header } from "@/common-components/src/components/DataTable";
import { computed, ComputedRef, ref } from "vue";
import { ActiveFilterSummary, ColumnFilters, ColumnFilterState, FILTER_MODE_LABELS, FilterMode, FilterOption, RangeValueType } from "../types/data-table.types";
import { DataTableFilterValueType } from "../types/header.type";
import { getFilterSourceValue, normalizeFilterKey, normalizeFilterLabel, normalizeScalarFilterValue, parseDateValue, parseNumberValue, resolveRangeComparableValue } from "../utils/data-table.utils";


type UseDataTableFilteringOptions = {
  rawItems: ComputedRef<unknown[]>;
  visibleHeaders: ComputedRef<Header[]>;
};

export const useDataTableFiltering = ({
  rawItems,
  visibleHeaders,
}: UseDataTableFilteringOptions) => {
  const columnFilters = ref<ColumnFilters>({});
  const activeFilterColumn = ref<string | null>(null);
  const activeFilterDraft = ref<string[]>([]);
  const filterSearch = ref("");
  const activeFilterMode = ref<FilterMode>("select");
  const activeContainsDraft = ref("");
  const activeRangeDraft = ref({ from: "", to: "" });
  const activeFilterMenuStyle = ref<Record<string, string>>({});

  const inferFilterValueType = (header: Header): DataTableFilterValueType => {
    if (header.filterValueType) { return header.filterValueType; }

    const samples = rawItems.value
      .map((item) => getFilterSourceValue(item, header))
      .map((value) => normalizeScalarFilterValue(value))
      .filter((value) => value !== null && value !== undefined && value !== "")
      .slice(0, 25);

    if (!samples.length) { return "text"; }
    if (samples.every((sample) => parseNumberValue(sample) !== null)) { return "number"; }
    if (samples.every((sample) => parseDateValue(sample) !== null)) { return "date"; }
    return "text";
  };

  const getRangeValueType = (header: Header): RangeValueType | null => {
    const valueType = inferFilterValueType(header);
    return valueType === "number" || valueType === "date" ? valueType : null;
  };

  const getAvailableFilterModes = (header: Header): FilterMode[] => {
    const requestedModes: FilterMode[] = Array.isArray(header.filterModes) && header.filterModes.length
      ? [...header.filterModes]
      : ["select", "contains", "range"];

    return requestedModes.filter((mode, index, list) => {
      if (list.indexOf(mode) !== index) { return false; }
      if (mode !== "range") { return true; }
      return getRangeValueType(header) !== null;
    });
  };

  const getDefaultFilterMode = (header: Header): FilterMode => {
    const availableModes = getAvailableFilterModes(header);
    if (header.filterMode && availableModes.includes(header.filterMode)) {
      return header.filterMode;
    }
    return availableModes[0] || "select";
  };

  const formatRangeDraftValue = (value: string, valueType: RangeValueType) => {
    if (!value) { return ""; }
    if (valueType === "number") { return value; }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) { return value; }
    return parsed.toLocaleString("ru-RU");
  };

  const passesColumnFilter = (item: unknown, header: Header, skipColumn?: string | null) => {
    if (header.filterable === false) { return true; }
    if (skipColumn && header.value === skipColumn) { return true; }

    const filterState = columnFilters.value[header.value];
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

  const filteredItems = computed(() =>
    rawItems.value.filter((item) =>
      visibleHeaders.value.every((header) => passesColumnFilter(item, header)),
    ),
  );

  const getFilterOptions = (header: Header): FilterOption[] => {
    const scopedItems = rawItems.value.filter((item) =>
      visibleHeaders.value.every((columnHeader) =>
        passesColumnFilter(item, columnHeader, header.value),
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

  const buildSelectFilterSummary = (header: Header, selectedKeys: string[]) => {
    const optionLabels = new Map(
      getFilterOptions(header).map((option) => [option.key, option.label]),
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

  const buildFilterSummary = (header: Header, filterState: ColumnFilterState): ActiveFilterSummary => {
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

    const selectSummary = buildSelectFilterSummary(header, filterState.selectedKeys);
    return {
      key: header.value,
      label: header.text,
      text: selectSummary.text,
      fullText: selectSummary.fullText,
    };
  };

  const activeFilterHeader = computed(() =>
    visibleHeaders.value.find((header) => header.value === activeFilterColumn.value) || null,
  );

  const activeFilterSummaries = computed<ActiveFilterSummary[]>(() =>
    visibleHeaders.value
      .map((header) => {
        const filterState = columnFilters.value[header.value];
        if (!filterState) { return null; }
        return buildFilterSummary(header, filterState);
      })
      .filter(Boolean) as ActiveFilterSummary[],
  );

  const availableFilterModes = computed(() =>
    activeFilterHeader.value ? getAvailableFilterModes(activeFilterHeader.value) : [],
  );

  const activeRangeValueType = computed(() =>
    activeFilterHeader.value ? getRangeValueType(activeFilterHeader.value) : null,
  );

  const rangeInputType = computed(() =>
    activeRangeValueType.value === "number" ? "number" : "datetime-local",
  );

  const rangeStartPlaceholder = computed(() =>
    activeRangeValueType.value === "number" ? "Минимум" : "Начало диапазона",
  );

  const rangeEndPlaceholder = computed(() =>
    activeRangeValueType.value === "number" ? "Максимум" : "Конец диапазона",
  );

  const activeFilterOptions = computed(() =>
    activeFilterHeader.value ? getFilterOptions(activeFilterHeader.value) : [],
  );

  const visibleFilterOptions = computed(() => {
    const query = filterSearch.value.trim().toLowerCase();
    if (!query) { return activeFilterOptions.value; }

    return activeFilterOptions.value.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  });

  const hasActiveFilters = computed(() =>
    Object.values(columnFilters.value).some((value) => Boolean(value)),
  );

  const syncDraftWithActiveColumn = () => {
    if (!activeFilterHeader.value) { return; }

    const currentState = columnFilters.value[activeFilterHeader.value.value];
    const availableKeys = getFilterOptions(activeFilterHeader.value).map((option) => option.key);
    const defaultMode = getDefaultFilterMode(activeFilterHeader.value);

    activeFilterMode.value = currentState?.mode || defaultMode;
    activeFilterDraft.value = currentState?.mode === "select"
      ? currentState.selectedKeys.filter((key) => availableKeys.includes(key))
      : availableKeys;
    activeContainsDraft.value = currentState?.mode === "contains" ? currentState.query : "";
    activeRangeDraft.value = currentState?.mode === "range"
      ? { from: currentState.from, to: currentState.to }
      : { from: "", to: "" };

    if (!currentState && activeFilterMode.value === "select") {
      activeFilterDraft.value = availableKeys;
    }
  };

  const updateFilterMenuPosition = (button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    const width = Math.max(260, rect.width + 120);
    const preferredHeight = 520;
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    const top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - preferredHeight - 12));
    const maxHeight = Math.max(320, window.innerHeight - top - 12);

    activeFilterMenuStyle.value = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: "1300",
    };
  };

  const closeColumnFilter = () => {
    activeFilterColumn.value = null;
    filterSearch.value = "";
    activeFilterDraft.value = [];
    activeFilterMode.value = "select";
    activeContainsDraft.value = "";
    activeRangeDraft.value = { from: "", to: "" };
  };

  const toggleColumnFilter = (event: Event, header: Header) => {
    const button = event.currentTarget as HTMLElement | null;
    if (!button) { return; }

    if (activeFilterColumn.value === header.value) {
      closeColumnFilter();
      return;
    }

    activeFilterColumn.value = header.value;
    filterSearch.value = "";
    updateFilterMenuPosition(button);
    syncDraftWithActiveColumn();
  };

  const toggleDraftFilterOption = (key: string) => {
    if (activeFilterDraft.value.includes(key)) {
      activeFilterDraft.value = activeFilterDraft.value.filter((value) => value !== key);
      return;
    }

    activeFilterDraft.value = [...activeFilterDraft.value, key];
  };

  const setActiveFilterMode = (mode: FilterMode) => {
    activeFilterMode.value = mode;
  };

  const selectAllFilterOptions = () => {
    activeFilterDraft.value = visibleFilterOptions.value.map((option) => option.key);
  };

  const clearActiveDraftSelection = () => {
    activeFilterDraft.value = [];
  };

  const applyActiveFilter = () => {
    if (!activeFilterHeader.value) { return; }

    const columnKey = activeFilterHeader.value.value;
    const nextFilters = { ...columnFilters.value };

    if (activeFilterMode.value === "select") {
      const allKeys = activeFilterOptions.value.map((option) => option.key);
      const isUnfilteredState =
        activeFilterDraft.value.length === allKeys.length &&
        activeFilterDraft.value.every((key) => allKeys.includes(key));

      if (isUnfilteredState) {
        delete nextFilters[columnKey];
      } else {
        nextFilters[columnKey] = {
          mode: "select",
          selectedKeys: [...activeFilterDraft.value],
        };
      }
    } else if (activeFilterMode.value === "contains") {
      const query = activeContainsDraft.value.trim();
      if (!query) {
        delete nextFilters[columnKey];
      } else {
        nextFilters[columnKey] = {
          mode: "contains",
          query,
        };
      }
    } else {
      const valueType = activeRangeValueType.value;
      const from = activeRangeDraft.value.from.trim();
      const to = activeRangeDraft.value.to.trim();

      if (!valueType || (!from && !to)) {
        delete nextFilters[columnKey];
      } else {
        nextFilters[columnKey] = {
          mode: "range",
          from,
          to,
          valueType,
        };
      }
    }

    columnFilters.value = nextFilters;
    closeColumnFilter();
  };

  const clearAllFilters = () => {
    columnFilters.value = {};
    closeColumnFilter();
  };

  const clearColumnFilter = (columnKey: string) => {
    if (!columnFilters.value[columnKey]) { return; }

    const nextFilters = { ...columnFilters.value };
    delete nextFilters[columnKey];
    columnFilters.value = nextFilters;

    if (activeFilterColumn.value === columnKey) {
      closeColumnFilter();
    }
  };

  const isColumnFiltered = (header: Header) => Boolean(columnFilters.value[header.value]);

  const getColumnFilterCount = (header: Header) => {
    const filterState = columnFilters.value[header.value];
    if (!filterState) { return null; }
    if (filterState.mode === "select") { return filterState.selectedKeys.length; }
    return 1;
  };

  return {
    FILTER_MODE_LABELS,
    activeContainsDraft,
    activeFilterColumn,
    activeFilterDraft,
    activeFilterHeader,
    activeFilterMenuStyle,
    activeFilterMode,
    activeFilterOptions,
    activeFilterSummaries,
    activeRangeDraft,
    activeRangeValueType,
    availableFilterModes,
    clearActiveDraftSelection,
    clearAllFilters,
    clearColumnFilter,
    closeColumnFilter,
    columnFilters,
    filterSearch,
    filteredItems,
    getColumnFilterCount,
    getFilterOptions,
    hasActiveFilters,
    isColumnFiltered,
    passesColumnFilter,
    rangeEndPlaceholder,
    rangeInputType,
    rangeStartPlaceholder,
    selectAllFilterOptions,
    setActiveFilterMode,
    syncDraftWithActiveColumn,
    toggleColumnFilter,
    toggleDraftFilterOption,
    visibleFilterOptions,
    applyActiveFilter,
  };
};
