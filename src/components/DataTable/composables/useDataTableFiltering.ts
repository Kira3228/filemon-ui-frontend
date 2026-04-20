import { computed, ComputedRef, onBeforeUnmount, onMounted, ref, Ref } from "vue";
import {
  ActiveFilterSummary,
  ColumnFilters,
  FILTER_MODE_LABELS,
  FilterMode,
} from "../types/data-table.types";
import { Header } from "../types/header.type";
import {
  applyColumnFilterState,
  buildFilterSummary,
  createFilterDraftState,
  getAvailableFilterModes as resolveAvailableFilterModes,
  getDefaultFilterMode as resolveDefaultFilterMode,
  getFilteredItems,
  getFilterOptions as resolveFilterOptions,
  getRangeValueType as resolveRangeValueType,
  passesColumnFilter as resolvePassesColumnFilter,
} from "../utils/data-table-filtering.utils";

type UseDataTableFilteringOptions = {
  rawItems: ComputedRef<unknown[]>;
  rootRef?: Ref<HTMLElement | null>;
  visibleHeaders: ComputedRef<Header[]>;
};

export const useDataTableFiltering = ({
  rawItems,
  rootRef,
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

  const getRangeValueType = (header: Header) =>
    resolveRangeValueType(header, rawItems.value);

  const getAvailableFilterModes = (header: Header) =>
    resolveAvailableFilterModes(header, rawItems.value);

  const getDefaultFilterMode = (header: Header) =>
    resolveDefaultFilterMode(header, rawItems.value);

  const passesColumnFilter = (item: unknown, header: Header, skipColumn?: string | null) =>
    resolvePassesColumnFilter(item, header, columnFilters.value, skipColumn);

  const getFilterOptions = (header: Header) =>
    resolveFilterOptions(header, rawItems.value, visibleHeaders.value, columnFilters.value);

  const filteredItems = computed(() =>
    getFilteredItems(rawItems.value, visibleHeaders.value, columnFilters.value),
  );

  const activeFilterHeader = computed(() =>
    visibleHeaders.value.find((header) => header.value === activeFilterColumn.value) || null,
  );

  const activeFilterSummaries = computed<ActiveFilterSummary[]>(() =>
    visibleHeaders.value
      .map((header) => {
        const filterState = columnFilters.value[header.value];
        if (!filterState) { return null; }
        return buildFilterSummary(header, filterState, getFilterOptions(header));
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

    const currentHeader = activeFilterHeader.value;
    const currentState = columnFilters.value[currentHeader.value];
    const availableKeys = getFilterOptions(currentHeader).map((option) => option.key);
    const defaultMode = getDefaultFilterMode(currentHeader);
    const draft = createFilterDraftState(currentState, availableKeys, defaultMode);

    activeFilterMode.value = draft.mode;
    activeFilterDraft.value = draft.selectedKeys;
    activeContainsDraft.value = draft.containsQuery;
    activeRangeDraft.value = draft.range;
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

  const getActiveFilterMenuElement = () => {
    const menu = rootRef?.value?.querySelector(".compact-data-table__filter-menu");
    return menu instanceof HTMLElement ? menu : null;
  };

  const isEventInsideActiveFilterMenu = (event: MouseEvent | Event) => {
    const menu = getActiveFilterMenuElement();
    if (!menu) { return false; }

    const target = event.target as Node | null;
    if (target && menu.contains(target)) { return true; }

    if (!(event instanceof MouseEvent)) { return false; }

    const rect = menu.getBoundingClientRect();
    const { clientX, clientY } = event;

    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const handleFilterPointerDown = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target) { return; }

    if (rootRef?.value?.contains(target)) { return; }
    if (!activeFilterHeader.value) { return; }
    if (isEventInsideActiveFilterMenu(event)) { return; }

    closeColumnFilter();
  };

  const handleViewportChange = (event?: Event) => {
    if (!activeFilterHeader.value) { return; }
    if (event && isEventInsideActiveFilterMenu(event)) { return; }

    closeColumnFilter();
  };

  if (rootRef) {
    onMounted(() => {
      document.addEventListener("mousedown", handleFilterPointerDown);
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("mousedown", handleFilterPointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    });
  }

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

    columnFilters.value = applyColumnFilterState({
      columnKey: activeFilterHeader.value.value,
      currentFilters: columnFilters.value,
      mode: activeFilterMode.value,
      selectedKeys: activeFilterDraft.value,
      availableKeys: activeFilterOptions.value.map((option) => option.key),
      containsQuery: activeContainsDraft.value,
      range: activeRangeDraft.value,
      rangeValueType: activeRangeValueType.value,
    });
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
