<template>
  <div
    ref="rootRef"
    class="compact-data-table-shell tw-flex-1 tw-min-w-0 tw-min-h-0 tw-w-full tw-flex tw-flex-col"
  >
    <div class="compact-data-table__topbar">
      <div class="compact-data-table__topbar-meta">
        <slot name="select-preset" />
        <div
          v-if="hasActiveFilters"
          class="compact-data-table__active-filters"
        >
          <span>Фильтры по столбцам активны</span>
        </div>
        <div
          v-if="shadowLoading"
          class="compact-data-table__shadow-state"
        >
          Показано {{ displayedItems.length }} из {{ filteredItems.length }}
        </div>
        <div
          v-if="exportError"
          class="compact-data-table__export-error"
        >
          {{ exportError }}
        </div>
      </div>
      <div class="compact-data-table__export-panel">
        <slot name="toolbar-actions" />
        <button
          type="button"
          class="compact-data-table__export-button"
          :class="{ 'compact-data-table__export-button--primary': isColumnsPanelOpen }"
          @click="toggleColumnsPanel"
        >
          <span class="pi pi-sliders-h" />
          <span>Колонки</span>
        </button>
        <button
          v-for="action in exportActions"
          :key="action.format"
          type="button"
          class="compact-data-table__export-button"
          :class="{ 'compact-data-table__export-button--primary': action.primary }"
          :disabled="isExporting !== null"
          @click="handleExport(action.format)"
        >
          <span class="pi" :class="action.icon" />
          <span>{{ isExporting === action.format ? action.pendingLabel : action.label }}</span>
        </button>
      </div>
    </div>
    <DataTableColumnsPanel
      v-if="isColumnsPanelOpen"
      :ordered-headers="orderedHeaders"
      :visible-headers-count="visibleHeaders.length"
      @auto-fit="autoFitVisibleColumns"
      @close="isColumnsPanelOpen = false"
      @move="moveColumn"
      @reset="resetColumnLayouts"
      @visibility-change="handleColumnVisibilityChange"
      @width-input="handleHeaderWidthInput"
    />
    <div
      ref="tableFocusRef"
      class="compact-data-table-host"
      :tabindex="isKeyboardNavigationEnabled ? 0 : undefined"
      @focusin.capture="activateKeyboardScope"
      @focusout.capture="handleTableFocusOut"
    >
      <PrimeDataTable
        :key="tableRenderKey"
        :value="displayedItems"
        :data-key="resolvedItemKey"
        :row-class="getRowClass"
        class="tw-text-xs compact-data-table"
        responsive-layout="scroll"
        sort-mode="multiple"
        :multi-sort-meta="resolvedMultiSortMeta"
        :loading="isLoading"
        :selection="value"
        :row-hover="true"
        :scrollable="true"
        scroll-height="flex"
        :meta-key-selection="false"
        :auto-layout="true"
        :row-group-mode="rowGroupMode || null"
        :group-rows-by="groupRowsBy || null"
        :expandable-row-groups="expandableRowGroups"
        :expanded-row-groups="expandedRowGroups"
        resizable-columns
        reorderable-columns
        column-resize-mode="expand"
        show-gridlines
        striped-rows
        @sort="handleSort"
        @column-resize-end="handleColumnResizeEnd"
        @column-reorder="handleColumnReorder"
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblClick"
        @update:selection="handleInput"
        @update:expandedRowGroups="handleExpandedRowGroupsUpdate"
      >
        <template #empty>
          <div class="compact-data-table__empty-state">
            {{ hasActiveFilters ? "Нет данных по выбранным фильтрам" : "Нет данных" }}
          </div>
        </template>
        <template #loading>
          <div class="compact-data-table__empty-state">Загрузка данных</div>
        </template>
        <template v-if="$scopedSlots.groupheader" #groupheader="slotProps">
          <slot
            name="groupheader"
            :item="slotProps.data"
            :index="slotProps.index"
          />
        </template>

        <Column
          v-if="showSelect"
          selection-mode="multiple"
          header-style="width: 3rem"
          body-style="width: 3rem"
        />
        <Column
          v-for="header in visibleHeaders"
          :key="header.value"
          :field="header.value"
          :sortable="false"
          :header-style="getHeaderStyle(header)"
          :body-style="getBodyStyle(header)"
          :header-class="getHeaderClass()"
          :body-class="getBodyClass()"
        >
          <template #header>
            <div class="compact-data-table__header-inner">
              <button
                type="button"
                class="compact-data-table__sort-trigger"
                :class="{ 'compact-data-table__sort-trigger--sortable': header.sortable }"
                @click="handleHeaderSort(header, $event)"
              >
                <span class="compact-data-table__header-label">{{ header.text }}</span>
                <span
                  v-if="header.sortable"
                  class="compact-data-table__sort-icon pi"
                  :class="getSortIconClass(header)"
                />
              </button>
              <button
                v-if="header.filterable !== false"
                type="button"
                class="compact-data-table__filter-trigger"
                :class="{ 'compact-data-table__filter-trigger--active': isColumnFiltered(header) }"
                @click.stop="toggleColumnFilter($event, header)"
              >
                <span class="pi pi-filter" />
                <span
                  v-if="getColumnFilterCount(header) !== null"
                  class="compact-data-table__filter-badge"
                >
                  {{ getColumnFilterCount(header) }}
                </span>
              </button>
            </div>
          </template>
          <template #body="slotProps">
            <div
              class="compact-data-table__content"
              :class="getContentClass(header)"
              :title="getCellTitle(getFilterSourceValue(slotProps.data, header))"
            >
              <slot
                :name="`item.${header.value}`"
                :item="slotProps.data"
                :value="slotProps.data?.[header.value]"
                :header="header"
              >
                {{ slotProps.data?.[header.value] }}
              </slot>
            </div>
          </template>
        </Column>

        <template v-if="$slots.footer || $scopedSlots.footer" #footer>
          <slot name="footer" />
        </template>
      </PrimeDataTable>
    </div>
    <div class="compact-data-table__status-row">
      <div class="compact-data-table__status-group">
        <div class="compact-data-table__status-item">
          Всего строк: <strong>{{ totalRowsCount }}</strong>
        </div>
        <div class="compact-data-table__status-item">
          После фильтра: <strong>{{ filteredRowsCount }}</strong>
        </div>
        <div class="compact-data-table__status-item">
          Выделено: <strong>{{ selectedRowsCount }}</strong>
        </div>
      </div>
      <div
        v-if="activeFilterSummaries.length || $slots['status-filters']"
        class="compact-data-table__status-filters"
      >
        <span class="compact-data-table__status-filters-label">Фильтры:</span>
        <slot name="status-filters" />
        <span
          v-for="filter in activeFilterSummaries"
          :key="filter.key"
          class="compact-data-table__status-filter-chip"
          :title="filter.fullText"
        >
          <span class="compact-data-table__status-filter-text">
            <strong>{{ filter.label }}:</strong> {{ filter.text }}
          </span>
          <button
            type="button"
            class="compact-data-table__status-filter-remove"
            :aria-label="`Удалить фильтр ${filter.label}`"
            @click="clearColumnFilter(filter.key)"
          >
            <span class="pi pi-times" />
          </button>
        </span>
        <button
          type="button"
          class="compact-data-table__clear-all compact-data-table__clear-all--status"
          @click="clearAllFilters"
        >
          Сбросить все
        </button>
      </div>
      <div class="compact-data-table__status-item compact-data-table__status-item--muted">
        Доступно к выгрузке: <strong>{{ filteredRowsCount }}</strong>
      </div>
    </div>
    <DataTableFilterMenu
      :header="activeFilterHeader"
      :menu-style="activeFilterMenuStyle"
      :available-modes="availableFilterModes"
      :active-mode="activeFilterMode"
      :filter-mode-labels="FILTER_MODE_LABELS"
      :filter-search="filterSearch"
      :visible-options="visibleFilterOptions"
      :active-draft="activeFilterDraft"
      :contains-draft="activeContainsDraft"
      :range-draft="activeRangeDraft"
      :range-input-type="rangeInputType"
      :range-start-placeholder="rangeStartPlaceholder"
      :range-end-placeholder="rangeEndPlaceholder"
      @apply="applyActiveFilter"
      @clear-draft="clearActiveDraftSelection"
      @close="closeColumnFilter"
      @select-all="selectAllFilterOptions"
      @set-mode="setActiveFilterMode"
      @toggle-option="toggleDraftFilterOption"
      @update:contains="activeContainsDraft = $event"
      @update:filterSearch="filterSearch = $event"
      @update:range="activeRangeDraft = $event"
    />
    <slot name="modal"></slot>
  </div>
</template>

<script lang="ts" setup>
import PrimeDataTable from "primevue/datatable";
import Column from "primevue/column";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Header } from "./header.type";
import type { RowKey, SortMeta } from "./data-table.types";
import {
  compareValues,
  getAlign,
  getCellTitle,
  getFilterSourceValue,
  inferPrimaryItemKey,
  isSameRowKey,
  normalizeColumnWidth,
  resolveExportValue,
  resolveFieldData,
  resolveRowKey,
  stringifyExportValue,
} from "./data-table.utils";
import { useDataTableStatePersistence } from "./composables/useDataTableStatePersistence";
import { useDataTableFiltering } from "./composables/useDataTableFiltering";
import { useDataTableExport } from "./composables/useDataTableExport";
import { useDataTableKeyboardNavigation } from "./composables/useDataTableKeyboardNavigation";
import DataTableColumnsPanel from "./components/DataTableColumnsPanel.vue";
import DataTableFilterMenu from "./components/DataTableFilterMenu.vue";

interface IProps<I = unknown> {
  isLoading?: boolean;
  headers?: Header[];
  items?: I[];
  itemsPerPage?: number;
  paginationLength?: number;
  totalVisible?: number;
  sortByList?: unknown;
  sortDescList?: unknown;
  page?: number;
  showSelect?: boolean;
  value?: unknown;
  itemKey?: string;
  dense?: boolean;
  exportTitle?: string;
  exportHeaders?: string[];
  exportRows?: Array<Array<unknown>>;
  exportRowKinds?: string[];
  stateKey?: string;
  rowGroupMode?: "subheader" | "rowspan" | null;
  groupRowsBy?: string | string[] | null;
  expandableRowGroups?: boolean;
  expandedRowGroups?: unknown[];
  activeRow?: I | null;
  activeRowKey?: RowKey | null;
  enableKeyboardNavigation?: boolean;
}

const MIN_COLUMN_WIDTH = 60;

const props = defineProps<IProps>();

const emits = defineEmits<{
  (e: `update:page`, newPage: number): void;
  (e: `click-row`, data: unknown): void;
  (e: `dblclick-row`, data: unknown): void;
  (e: `input`, data: unknown[]): void;
  (e: `update:activeRow`, value: unknown | null): void;
  (e: `update:activeRowKey`, value: RowKey | null): void;
  (e: `update:sortBy`, value: unknown): void;
  (e: `update:sortDesc`, value: unknown): void;
  (e: `update:expandedRowGroups`, value: unknown[]): void;
  (e: `change`, data: { sortBy: string[]; sortDesc: boolean[] }): void;
}>();

const rawItems = computed(() => props.items || []);
const resolvedItemKey = computed(() => String(props.itemKey || inferPrimaryItemKey(rawItems.value)));
const rowGroupMode = computed(() => props.rowGroupMode || null);
const groupRowsBy = computed(() => props.groupRowsBy || null);
const expandableRowGroups = computed(() => Boolean(props.expandableRowGroups));
const expandedRowGroups = computed(() => props.expandedRowGroups || []);
const groupSortField = computed(() => {
  if (Array.isArray(groupRowsBy.value)) {
    return groupRowsBy.value[0] || null;
  }

  return groupRowsBy.value || null;
});

const rootRef = ref<HTMLElement | null>(null);
const tableFocusRef = ref<HTMLElement | null>(null);
const isColumnsPanelOpen = ref(false);
const internalActiveRowKey = ref<RowKey | null>(null);

const isKeyboardNavigationEnabled = computed(() => props.enableKeyboardNavigation !== false);
const controlledActiveRowKey = computed<RowKey | null | undefined>(() => {
  if (props.activeRowKey !== undefined) {
    return props.activeRowKey ?? null;
  }

  if (props.activeRow !== undefined) {
    return resolveRowKey(props.activeRow, resolvedItemKey.value);
  }

  return undefined;
});
const activeRowKey = computed<RowKey | null>(() =>
  controlledActiveRowKey.value !== undefined
    ? controlledActiveRowKey.value
    : internalActiveRowKey.value,
);
const {
  columnLayouts,
  orderedHeaders,
  tableRenderKey,
  visibleHeaders,
  setColumnLayouts,
  handleColumnResizeEnd,
  handleColumnReorder,
  handleHeaderVisibilityChange,
  handleHeaderWidthInput,
  moveColumn,
  resetColumnLayouts,
} = useDataTableStatePersistence({
  headers: computed(() => props.headers || []),
  stateKey: computed(() => props.stateKey),
  exportTitle: computed(() => props.exportTitle),
  showSelect: computed(() => Boolean(props.showSelect)),
});

const {
  FILTER_MODE_LABELS,
  activeContainsDraft,
  activeFilterDraft,
  activeFilterHeader,
  activeFilterMenuStyle,
  activeFilterMode,
  activeFilterSummaries,
  activeRangeDraft,
  availableFilterModes,
  clearActiveDraftSelection,
  clearAllFilters,
  clearColumnFilter,
  closeColumnFilter,
  filterSearch,
  filteredItems,
  getColumnFilterCount,
  hasActiveFilters,
  isColumnFiltered,
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
} = useDataTableFiltering({
  rawItems,
  visibleHeaders,
});

const normalizeSortMeta = (sortByList: unknown, sortDescList: unknown) => {
  const sortFields = Array.isArray(sortByList)
    ? sortByList
    : sortByList
      ? [sortByList]
      : [];
  const sortDirections = Array.isArray(sortDescList)
    ? sortDescList
    : sortDescList !== undefined
      ? [sortDescList]
      : [];

  return sortFields
    .filter(Boolean)
    .map((field, index) => ({
      field: String(field),
      order: sortDirections[index] ? -1 : 1,
    }));
};

const multiSortMeta = ref(normalizeSortMeta(props.sortByList, props.sortDescList));
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

  return [
    { field, order: 1 },
    ...meta.filter((item) => item.field !== field),
  ];
};
const resolvedMultiSortMeta = computed(() => resolveMultiSortMeta(multiSortMeta.value));

watch(
  () => [props.sortByList, props.sortDescList],
  ([sortByList, sortDescList]) => {
    multiSortMeta.value = stripForcedGroupSort(normalizeSortMeta(sortByList, sortDescList));
  },
  { deep: true },
);

watch(
  () => [rowGroupMode.value, groupSortField.value],
  () => {
    multiSortMeta.value = stripForcedGroupSort(multiSortMeta.value);
  },
);

const emitSortState = (meta: SortMeta[]) => {
  const sortBy = meta.map((item) => item.field);
  const sortDesc = meta.map((item) => item.order === -1);
  emits("update:sortBy", sortBy);
  emits("update:sortDesc", sortDesc);
  emits("change", { sortBy, sortDesc });
};

const handleSort = (event: { multiSortMeta?: SortMeta[] }) => {
  const meta = stripForcedGroupSort(event.multiSortMeta || []);
  multiSortMeta.value = meta;
  emitSortState(meta);
};

const handleExpandedRowGroupsUpdate = (groups: unknown[]) => {
  emits("update:expandedRowGroups", Array.isArray(groups) ? groups : []);
};

const isActiveRow = (item: unknown) => isSameRowKey(resolveRowKey(item, resolvedItemKey.value), activeRowKey.value);

const getActiveRowIndex = () =>
  sortedExportItems.value.findIndex((item) => isSameRowKey(resolveRowKey(item, resolvedItemKey.value), activeRowKey.value));

const scrollActiveRowIntoView = () => {
  nextTick(() => {
    const row = rootRef.value?.querySelector(".compact-data-table__row--active");
    if (!(row instanceof HTMLElement)) { return; }
    row.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
};

const focusTableRoot = () => {
  if (!isKeyboardNavigationEnabled.value) { return; }
  activateKeyboardScope();
  tableFocusRef.value?.focus({ preventScroll: true });
};

const setActiveRow = (item: unknown | null, options: { emitClick?: boolean; scrollIntoView?: boolean } = {}) => {
  const nextKey = resolveRowKey(item, resolvedItemKey.value);

  if (controlledActiveRowKey.value === undefined) {
    internalActiveRowKey.value = nextKey;
  }

  emits(`update:activeRow`, item);
  emits(`update:activeRowKey`, nextKey);

  if (item && options.emitClick) {
    emits(`click-row`, item);
  }

  if (item && options.scrollIntoView !== false) {
    scrollActiveRowIntoView();
  }
};

const getRowClass = (item: unknown) => ({
  "compact-data-table__row--active": isActiveRow(item),
});
const sortedExportItems = computed(() => {
  if (!resolvedMultiSortMeta.value.length) {
    return filteredItems.value;
  }

  return [...filteredItems.value].sort((first, second) => {
    for (const sortMeta of resolvedMultiSortMeta.value) {
      const sortHeader = visibleHeaders.value.find((header) => header.value === sortMeta.field);
      const firstValue = sortHeader
        ? resolveExportValue(first, sortHeader)
        : resolveFieldData(first, sortMeta.field);
      const secondValue = sortHeader
        ? resolveExportValue(second, sortHeader)
        : resolveFieldData(second, sortMeta.field);
      const delta = compareValues(
        firstValue,
        secondValue,
      );

      if (delta !== 0) {
        return sortMeta.order === -1 ? -delta : delta;
      }
    }

    return 0;
  });
});
const totalRowsCount = computed(() => rawItems.value.length);
const filteredRowsCount = computed(() => filteredItems.value.length);
const selectedRowsCount = computed(() => {
  if (Array.isArray(props.value)) {
    return props.value.length;
  }

  if (props.value && typeof props.value === "object") {
    return Object.keys(props.value).length;
  }

  return props.value ? 1 : 0;
});
const {
  exportActions,
  exportError,
  handleExport,
  isExporting,
} = useDataTableExport({
  customExportHeaders: computed(() => props.exportHeaders),
  customExportRows: computed(() => props.exportRows),
  customExportRowKinds: computed(() => props.exportRowKinds),
  exportTitleInput: computed(() => props.exportTitle),
  filteredRowsCount,
  sortedItems: sortedExportItems,
  visibleHeaders,
});

const handleRowClick = (event: { data: unknown }) => {
  focusTableRoot();
  setActiveRow(event.data, { emitClick: true });
};

const handleRowDblClick = (event: { data: unknown }) => {
  focusTableRoot();
  setActiveRow(event.data);
  emits(`dblclick-row`, event.data);
};

const handleInput = (data: unknown) => {
  emits(`input`, Array.isArray(data) ? data : []);
};

const getHeaderStyle = (header: Header) => ({
  flex: `0 0 ${header.width}px`,
  width: `${header.width}px`,
  minWidth: `${MIN_COLUMN_WIDTH}px`,
  textAlign: getAlign(header.align),
});

const getBodyStyle = (header: Header) => ({
  flex: `0 0 ${header.width}px`,
  width: `${header.width}px`,
  minWidth: `${MIN_COLUMN_WIDTH}px`,
  textAlign: getAlign(header.align),
});

const getHeaderClass = () => ({
  "compact-data-table__header": true,
  "compact-data-table__header--dense": props.dense !== false,
});

const getBodyClass = () => ({
  "compact-data-table__cell": true,
  "compact-data-table__cell--dense": props.dense !== false,
});

const getContentClass = (header: Header) => ({
  "compact-data-table__content--truncate": !header.wrap,
  "compact-data-table__content--wrap": header.wrap,
});

const getMeasurementFont = (selector: string, fallback: string) => {
  if (typeof window === "undefined") { return fallback; }

  const element = rootRef.value?.querySelector(selector);
  if (!(element instanceof HTMLElement)) { return fallback; }

  const styles = window.getComputedStyle(element);
  const fontStyle = styles.fontStyle || "normal";
  const fontVariant = styles.fontVariant || "normal";
  const fontWeight = styles.fontWeight || "400";
  const fontSize = styles.fontSize || "12px";
  const lineHeight = styles.lineHeight && styles.lineHeight !== "normal"
    ? `/${styles.lineHeight}`
    : "";
  const fontFamily = styles.fontFamily || "sans-serif";

  return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}${lineHeight} ${fontFamily}`;
};

const measureTextWidth = (text: string, font: string) => {
  if (typeof document === "undefined") {
    return text.length * 8;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return text.length * 8;
  }

  context.font = font;
  return context.measureText(text).width;
};

const resolveAutoFitValue = (item: unknown, header: Header) => {
  const directValue = resolveExportValue(item, header);
  const stringified = stringifyExportValue(directValue);
  if (stringified) { return stringified; }

  return getCellTitle(getFilterSourceValue(item, header));
};

const autoFitVisibleColumns = () => {
  const headerFont = getMeasurementFont(".compact-data-table__header-label", "normal normal 600 12px sans-serif");
  const bodyFont = getMeasurementFont(".compact-data-table__content", "normal normal 400 12px sans-serif");
  const sampleItems = sortedExportItems.value.slice(0, 120);

  setColumnLayouts(
    columnLayouts.value.map((layout) => {
      const header = visibleHeaders.value.find((entry) => entry.value === layout.value);
      if (!header) { return layout; }

      const headerWidth = measureTextWidth(String(header.text || ""), headerFont)
        + (header.filterable === false ? 44 : 76)
        + (header.sortable ? 18 : 0);

      const contentWidth = sampleItems.reduce((maxWidth, item) => {
        const text = resolveAutoFitValue(item, header);
        if (!text) { return maxWidth; }
        return Math.max(maxWidth, measureTextWidth(text, bodyFont) + 28);
      }, 0);

      return {
        ...layout,
        width: normalizeColumnWidth(Math.max(headerWidth, contentWidth, MIN_COLUMN_WIDTH), layout.width),
      };
    }),
  );
};

const {
  displayedItems,
  shadowLoading,
  activateKeyboardScope,
  handleTableFocusOut,
  syncKeyboardScope,
} = useDataTableKeyboardNavigation({
  activeRowKey,
  enableKeyboardNavigation: isKeyboardNavigationEnabled,
  findActiveRowIndex: getActiveRowIndex,
  focusTableRoot,
  hasActiveItem: (item) => isActiveRow(item),
  items: sortedExportItems,
  itemsPerPage: computed(() => props.itemsPerPage),
  onActivateRow: setActiveRow,
  onConfirmRow: (item) => emits(`dblclick-row`, item),
  rootRef,
  tableFocusRef,
});

const getSortOrder = (header: Header) =>
  multiSortMeta.value.find((item) => item.field === header.value)?.order ?? null;

const getSortIconClass = (header: Header) => {
  const order = getSortOrder(header);
  if (order === 1) { return "pi-sort-amount-up-alt"; }
  if (order === -1) { return "pi-sort-amount-down"; }
  return "pi-sort-alt";
};

const handleHeaderSort = (header: Header, event: MouseEvent) => {
  if (!header.sortable) { return; }

  const withExisting = event.ctrlKey || event.metaKey || event.shiftKey;
  const currentSort = multiSortMeta.value.find((item) => item.field === header.value) || null;
  const nextMeta = withExisting
    ? [...multiSortMeta.value]
    : currentSort
      ? [{ ...currentSort }]
      : [];
  const currentIndex = nextMeta.findIndex((item) => item.field === header.value);

  if (currentIndex === -1) {
    nextMeta.push({ field: header.value, order: 1 });
  } else if (nextMeta[currentIndex].order === 1) {
    nextMeta[currentIndex] = { field: header.value, order: -1 };
  } else {
    nextMeta.splice(currentIndex, 1);
  }

  multiSortMeta.value = nextMeta;
  emitSortState(nextMeta);
};

const clearColumnDecorators = (columnValue: string) => {
  clearColumnFilter(columnValue);

  const nextMeta = multiSortMeta.value.filter((item) => item.field !== columnValue);
  if (nextMeta.length !== multiSortMeta.value.length) {
    multiSortMeta.value = nextMeta;
    emitSortState(nextMeta);
  }
};

const handleColumnVisibilityChange = (columnValue: string, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const isVisible = Boolean(target?.checked);
  handleHeaderVisibilityChange(columnValue, event);

  if (!isVisible) {
    clearColumnDecorators(columnValue);
  }
};

const toggleColumnsPanel = () => {
  isColumnsPanelOpen.value = !isColumnsPanelOpen.value;
};

const getActiveFilterMenuElement = () => {
  const menu = rootRef.value?.querySelector(".compact-data-table__filter-menu");
  return menu instanceof HTMLElement ? menu : null;
};

const isEventInsideActiveFilterMenu = (event: MouseEvent | Event) => {
  const menu = getActiveFilterMenuElement();
  if (!menu) { return false; }

  const target = event.target as Node | null;
  if (target && menu.contains(target)) {
    return true;
  }

  if (event instanceof MouseEvent) {
    const rect = menu.getBoundingClientRect();
    const { clientX, clientY } = event;

    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  return false;
};

const handleFilterPointerDown = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!target) { return; }

  if (rootRef.value?.contains(target)) { return; }
  if (!activeFilterHeader.value) { return; }
  if (isEventInsideActiveFilterMenu(event)) { return; }
  closeColumnFilter();
};

const handleViewportChange = (event?: Event) => {
  if (activeFilterHeader.value) {
    if (event && isEventInsideActiveFilterMenu(event)) { return; }
    closeColumnFilter();
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleFilterPointerDown);
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);
  syncKeyboardScope();
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleFilterPointerDown);
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});

watch(rawItems, () => {
  if (activeFilterHeader.value) {
    syncDraftWithActiveColumn();
  }
}, { deep: true });

watch(tableRenderKey, () => {
  syncKeyboardScope();
});
</script>

<style scoped>
.compact-data-table-shell {
  --dt-surface: var(--app-surface);
  --dt-surface-muted: var(--app-surface-muted);
  --dt-muted-strip-bg: var(--app-surface-muted);
  --dt-topbar-border: rgba(37, 99, 235, 0.18);
  --dt-topbar-bg:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 34%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30%),
    linear-gradient(180deg, var(--app-surface-muted), var(--app-surface));
  --dt-topbar-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 24px rgba(37, 99, 235, 0.08);
  --dt-toolbar-panel-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04)),
    var(--app-surface);
  --dt-panel-bg: var(--app-surface);
  --dt-panel-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  --dt-panel-header-bg: var(--app-surface-muted);
  --dt-rowgroup-bg: var(--app-surface-muted);
  --dt-rowgroup-border: var(--app-border);
  --dt-row-bg: var(--dt-surface);
  --dt-row-alt-bg: var(--app-surface-muted);
  --dt-row-hover-bg: rgba(37, 99, 235, 0.16);
  --dt-active-row-bg: rgba(37, 99, 235, 0.28);
  --dt-active-row-hover-bg: rgba(37, 99, 235, 0.36);
  --dt-active-row-text: var(--app-text);
  --dt-text-selection-bg: rgba(37, 99, 235, 0.42);
  --dt-text-selection-text: #ffffff;
  --dt-filter-panel-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  --dt-filter-options-bg: var(--app-surface-muted);
  --dt-chip-remove-hover-bg: var(--app-surface-muted);
  --dt-button-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  --dt-resizer-bg: rgba(37, 99, 235, 0.2);
}

.compact-data-table-host {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  outline: none;
  border-radius: 1rem;
  background: var(--dt-surface);
}

.compact-data-table-host:focus-visible {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

:deep(.compact-data-table__keyboard-scope) {
  outline: none;
}

:deep(.compact-data-table__keyboard-scope:focus-visible) {
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.28);
}

:deep(.no-wrap-table th),
:deep(.no-wrap-table td) {
  white-space: nowrap !important;
}

:deep(.compact-data-table .p-datatable-wrapper) {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--app-border) var(--dt-surface);
  background: var(--dt-surface);
}

:deep(.compact-data-table .p-datatable-wrapper::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

:deep(.compact-data-table .p-datatable-wrapper::-webkit-scrollbar-track) {
  background: var(--dt-surface);
}

:deep(.compact-data-table .p-datatable-wrapper::-webkit-scrollbar-thumb) {
  border: 2px solid var(--dt-surface);
  border-radius: 999px;
  background: var(--app-border);
}

:deep(.compact-data-table .p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
  background: var(--app-text-muted);
}

:deep(.compact-data-table) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  overflow: hidden;
  background: var(--app-surface);
}

:deep(.compact-data-table .p-datatable-wrapper),
:deep(.compact-data-table .p-datatable-table),
:deep(.compact-data-table .p-datatable-tbody),
:deep(.compact-data-table .p-datatable-emptymessage),
:deep(.compact-data-table .p-datatable-emptymessage > td) {
  background: var(--dt-surface) !important;
  background-color: var(--dt-surface) !important;
  color: var(--app-text);
}

:deep(.compact-data-table .p-datatable-table) {
  table-layout: fixed;
  width: 100%;
  min-width: 100%;
  background: var(--dt-surface);
}

:deep(.compact-data-table .p-rowgroup-header > td) {
  padding: 0.5rem 0.7rem;
  background: var(--dt-rowgroup-bg);
  border-top: 1px solid var(--dt-rowgroup-border);
  color: var(--app-text);
}

:deep(.compact-data-table .p-rowgroup-header:first-child > td) {
  border-top: none;
}

.compact-data-table__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--dt-topbar-border);
  border-radius: 0.9rem;
  background: var(--dt-topbar-bg);
  box-shadow: var(--dt-topbar-shadow);
  position: sticky;
  top: 0;
  z-index: 6;
}

.compact-data-table__topbar-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: wrap;
}

.compact-data-table__export-panel {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.6rem;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 0.85rem;
  background: var(--dt-toolbar-panel-bg);
}

.compact-data-table__columns-panel {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
  max-height: min(70vh, calc(100vh - 160px));
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 1rem;
  background: var(--dt-panel-bg);
  box-shadow: var(--dt-panel-shadow);
  overflow: hidden;
}

.compact-data-table__columns-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--app-border);
  background: var(--dt-panel-header-bg);
}

.compact-data-table__columns-title {
  font-size: 13px;
  font-weight: 700;
}

.compact-data-table__columns-meta {
  margin-top: 0.2rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__columns-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.compact-data-table__panel-action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: var(--dt-surface);
  color: var(--app-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 0.48rem 0.8rem;
  box-shadow: var(--dt-button-shadow);
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.compact-data-table__panel-action-button:hover:not(:disabled) {
  border-color: #2563eb;
  background: var(--app-surface-muted);
}

.compact-data-table__panel-action-button .pi {
  font-size: 0.8rem;
}

.compact-data-table__panel-action-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.compact-data-table__panel-action-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.compact-data-table__panel-action-button--primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.compact-data-table__columns-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
  overflow-y: auto;
  padding: 0.9rem 1rem 1rem;
}

.compact-data-table__column-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: 0.85rem;
  background: var(--dt-surface);
}

.compact-data-table__column-visibility {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.compact-data-table__column-label {
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-data-table__column-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.compact-data-table__column-width {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__column-width input {
  width: 84px;
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  padding: 0.35rem 0.55rem;
  font-size: 12px;
  color: var(--app-text);
  background: var(--app-surface);
}

.compact-data-table__column-order {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.compact-data-table__column-order-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
}

.compact-data-table__column-order-button:disabled {
  opacity: 0.45;
  cursor: default;
}

.compact-data-table__active-filters {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__shadow-state {
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--app-border);
  background: var(--dt-surface);
  color: var(--app-text);
  border-radius: 999px;
  padding: 0.42rem 0.92rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--dt-button-shadow);
}

.compact-data-table__export-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.compact-data-table__export-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.compact-data-table__export-error {
  font-size: 11px;
  color: #b91c1c;
}

.compact-data-table__clear-all {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
}

.compact-data-table__clear-all--status {
  border: 1px solid rgba(37, 99, 235, 0.28);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  background: rgba(37, 99, 235, 0.08);
  font-weight: 600;
}

:deep(.compact-data-table .p-datatable-thead > tr > th) {
  white-space: nowrap;
  padding: 3px 6px !important;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--app-text-muted);
  background: var(--dt-surface-muted);
  border-color: var(--app-border);
}

:deep(.compact-data-table .p-datatable-thead),
:deep(.compact-data-table .p-datatable-thead > tr) {
  background: var(--dt-surface-muted);
  color: var(--app-text-muted);
}

:deep(.compact-data-table .p-datatable-tbody > tr) {
  background: var(--dt-row-bg);
  color: var(--app-text);
}

:deep(.compact-data-table .p-datatable-tbody > tr:nth-child(even)) {
  background: var(--dt-row-alt-bg);
}

:deep(.compact-data-table .p-datatable-tbody > tr > td) {
  padding: 3px 6px !important;
  height: auto !important;
  font-size: 10px;
  line-height: 1.2;
  vertical-align: top;
  overflow: hidden;
  border-color: var(--app-border);
  background: transparent;
  color: var(--app-text);
}

:deep(.compact-data-table .p-datatable-tbody > tr:hover) {
  background: var(--dt-row-hover-bg);
}

:deep(.compact-data-table .p-datatable-tbody > tr:hover > td) {
  background: transparent;
}

:deep(.compact-data-table.p-datatable.p-datatable-hoverable-rows .p-datatable-tbody > tr:not(.p-highlight):hover) {
  background: var(--dt-row-hover-bg) !important;
  color: var(--app-text) !important;
}

:deep(.compact-data-table.p-datatable.p-datatable-hoverable-rows .p-datatable-tbody > tr:not(.p-highlight):hover > td) {
  background: transparent !important;
  color: var(--app-text) !important;
}

:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active) {
  background: var(--dt-active-row-bg);
  box-shadow:
    inset 0 1px 0 rgba(37, 99, 235, 0.24),
    inset 0 -1px 0 rgba(37, 99, 235, 0.24);
}

:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active:hover) {
  background: var(--dt-active-row-hover-bg);
}

:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active > td) {
  background: transparent;
  color: var(--dt-active-row-text);
}

:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active:hover > td) {
  background: transparent;
  color: var(--dt-active-row-text);
}

:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active .compact-data-table__content),
:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active a),
:deep(.compact-data-table .p-datatable-tbody > tr.compact-data-table__row--active button) {
  color: var(--dt-active-row-text);
}

:deep(.compact-data-table .p-datatable-tbody > tr > td ::selection),
:deep(.compact-data-table .p-datatable-thead > tr > th ::selection),
.compact-data-table__content::selection,
.compact-data-table__header-label::selection {
  background: var(--dt-text-selection-bg);
  color: var(--dt-text-selection-text);
}

:deep(.compact-data-table .p-selection-column) {
  width: 3rem;
}

:deep(.compact-data-table .p-checkbox .p-checkbox-box) {
  border-color: var(--app-border);
  background: var(--dt-surface);
  color: #2563eb;
}

:deep(.compact-data-table .p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box:hover) {
  border-color: #2563eb;
}

:deep(.compact-data-table .p-checkbox .p-checkbox-box.p-highlight) {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

:deep(.compact-data-table .p-column-resizer) {
  background: var(--dt-resizer-bg);
}

:deep(.compact-data-table .p-column-resizer-helper) {
  background: #2563eb;
}

.compact-data-table__header--dense {
  height: auto;
  padding: 3px 6px !important;
}

.compact-data-table__cell--dense {
  padding: 3px 6px !important;
}

.compact-data-table__content {
  display: block;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.compact-data-table__empty-state {
  padding: 1.5rem 0.75rem;
  text-align: center;
  color: var(--app-text-muted);
  background: var(--dt-surface);
}

.compact-data-table__content--truncate {
  white-space: nowrap;
  text-overflow: ellipsis;
}

.compact-data-table__content--wrap {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.compact-data-table__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  min-width: 0;
}

.compact-data-table__sort-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  font: inherit;
}

.compact-data-table__sort-trigger--sortable {
  cursor: pointer;
}

.compact-data-table__header-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-data-table__sort-icon {
  font-size: 10px;
  color: #2563eb;
}

.compact-data-table__filter-trigger {
  position: relative;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.compact-data-table__filter-trigger--active {
  border-color: rgba(37, 99, 235, 0.25);
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.compact-data-table__filter-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 8px;
  line-height: 12px;
  text-align: center;
}

.compact-data-table__filter-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: min(360px, calc(100vh - 24px));
  padding: 0.75rem;
  border: 1px solid var(--app-border);
  border-radius: 0.9rem;
  background: var(--app-surface);
  box-shadow: var(--dt-filter-panel-shadow);
}

.compact-data-table__status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--app-border);
  padding: 0.45rem 0.75rem;
  background: var(--dt-muted-strip-bg);
  color: var(--app-text-muted);
  font-size: 11px;
}

.compact-data-table__status-group {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.compact-data-table__status-filters {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: wrap;
}

.compact-data-table__status-filters-label {
  color: var(--app-text-muted);
}

.compact-data-table__status-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  min-width: 0;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-text);
  padding: 0.18rem 0.55rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-data-table__status-filter-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-data-table__status-filter-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  flex: 0 0 auto;
  padding: 0;
}

.compact-data-table__status-filter-remove:hover {
  background: var(--dt-chip-remove-hover-bg);
  color: var(--app-text);
}

.compact-data-table__status-item strong {
  color: var(--app-text);
  font-weight: 600;
}

.compact-data-table__status-item--muted {
  color: var(--app-text-muted);
}

.compact-data-table__filter-menu-title {
  font-size: 12px;
  font-weight: 600;
}

.compact-data-table__filter-modes {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.compact-data-table__filter-mode {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
}

.compact-data-table__filter-mode--active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.compact-data-table__filter-hint {
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__filter-search {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  padding: 0.45rem 0.6rem;
  font-size: 12px;
  background: var(--app-surface);
  color: var(--app-text);
}

.compact-data-table__filter-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.5rem;
}

.compact-data-table__filter-range-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__filter-actions,
.compact-data-table__filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.compact-data-table__filter-action,
.compact-data-table__filter-footer-button {
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
  font-size: 11px;
  padding: 0.35rem 0.6rem;
}

.compact-data-table__filter-footer-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.compact-data-table__filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  padding: 0.35rem;
  background: var(--dt-filter-options-bg);
}

.compact-data-table__column-visibility input,
.compact-data-table__filter-option input {
  accent-color: #2563eb;
}

.compact-data-table__filter-option {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  border-radius: 0.5rem;
  padding: 0.3rem 0.35rem;
  font-size: 11px;
}

.compact-data-table__filter-option:hover {
  background: rgba(37, 99, 235, 0.08);
}

.compact-data-table__filter-option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-data-table__filter-option-count {
  color: var(--app-text-muted);
}

.compact-data-table__filter-empty {
  padding: 0.5rem;
  font-size: 11px;
  color: var(--app-text-muted);
  text-align: center;
}

@media (max-width: 960px) {
  .compact-data-table__columns-header,
  .compact-data-table__column-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .compact-data-table__columns-header {
    display: flex;
    flex-direction: column;
  }

  .compact-data-table__column-controls {
    justify-content: space-between;
  }
}
</style>
