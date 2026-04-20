<template>
  <div
    ref="rootRef"
    class="compact-data-table-shell flex-1 min-w-0 min-h-0 w-full flex flex-col"
  >
    <div class="compact-data-table__topbar">
      <div class="compact-data-table__topbar-meta">
        <slot name="select-preset" />
        <div v-if="hasActiveFilters" class="compact-data-table__active-filters">
          <span>Фильтры по столбцам активны</span>
        </div>
        <div v-if="shadowLoading" class="compact-data-table__shadow-state">
          Показано {{ displayedItems.length }} из {{ filteredItems.length }}
        </div>
        <div v-if="exportError" class="compact-data-table__export-error">
          {{ exportError }}
        </div>
      </div>
      <div class="compact-data-table__export-panel">
        <slot name="toolbar-actions" />
        <UiButton
          :variant="isColumnsPanelOpen ? 'primary' : 'secondary'"
          size="medium"
          @click="toggleColumnsPanel"
        >
          <span class="pi pi-sliders-h" />
          <span> Колонки </span>
        </UiButton>
        <UiButton
          v-for="action in exportActions"
          :key="action.format"
          :variant="action.primary ? 'primary' : 'secondary'"
          :disabled="isExporting !== null"
          @click="handleExport(action.format)"
        >
          <span class="pi" :class="action.icon" />
          <span>
            {{
              isExporting === action.format ? action.pendingLabel : action.label
            }}
          </span>
        </UiButton>
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
        class="text-xs compact-data-table"
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
            {{
              hasActiveFilters
                ? "Нет данных по выбранным фильтрам"
                : "Нет данных"
            }}
          </div>
        </template>
        <template #loading>
          <div class="compact-data-table__empty-state">Загрузка данных</div>
        </template>
        <template #groupheader="slotProps">
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
            <ColumnHeader
              :header="header"
              :sort-icon-class="getSortIconClass(header)"
              :filter-count="getColumnFilterCount(header)"
              @sort="handleHeaderSort(header, $event)"
              @filter="toggleColumnFilter($event, header)"
            />
          </template>
          <template #body="slotProps">
            <div
              class="compact-data-table__content"
              :class="getContentClass(header)"
              :title="
                getCellTitle(getFilterSourceValue(slotProps.data, header))
              "
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
        class="compact-data-table__status-filters"
        v-if="activeFilterSummaries.length || $slots['status-filters']"
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
          <UiButton
            :aria-label="`Удалить фильтр ${filter.label}`"
            variant="text"
            size="xSmall"
            @click="clearColumnFilter(filter.key)"
          >
            <span class="pi pi-times" />
          </UiButton>
        </span>
        <UiButton variant="secondary" @click="clearAllFilters">
          Сбросить все
        </UiButton>
      </div>
      <div
        class="compact-data-table__status-item compact-data-table__status-item--muted"
      >
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
import { computed, onMounted, ref, watch } from "vue";
import type { Header } from "./header.type";
import type { RowKey, SortMeta } from "./data-table.types";
import {
  compareValues,
  getAlign,
  getCellTitle,
  getFilterSourceValue,
  inferPrimaryItemKey,
  resolveExportValue,
  resolveFieldData,
} from "./data-table.utils";
import { useDataTableStatePersistence } from "./composables/useDataTableStatePersistence";
import { useDataTableFiltering } from "./composables/useDataTableFiltering";
import { useDataTableExport } from "./composables/useDataTableExport";
import { useDataTableKeyboardNavigation } from "./composables/useDataTableKeyboardNavigation";
import { useDataTableActiveRow } from "./composables/useDataTableActiveRow";
import { useDataTableColumnAutoFit } from "./composables/useDataTableColumnAutoFit";
import ColumnHeader from "./components/ColumnHeader.vue";
import DataTableColumnsPanel from "./components/DataTableColumnsPanel.vue";
import DataTableFilterMenu from "./components/DataTableFilterMenu.vue";
import UiButton from "../UiButton/UiButton.vue";
import { useDataTableSorting } from "./composables/useDataTableSorting";
import { useDataTableFilterDismiss } from "./composables/useDataTableFilterDismiss";

interface Props<I = unknown> {
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

const props = defineProps<Props>();

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
const resolvedItemKey = computed(() =>
  String(props.itemKey || inferPrimaryItemKey(rawItems.value)),
);
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

const isKeyboardNavigationEnabled = computed(
  () => props.enableKeyboardNavigation !== false,
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

const {
  resolvedMultiSortMeta,
  handleSort,
  handleHeaderSort,
  getSortIconClass,
} = useDataTableSorting({
  sortByList: computed(() => props.sortByList),
  sortDescList: computed(() => props.sortDescList),
  groupSortField,
  rowGroupMode,
  filteredItems,
  visibleHeaders,
  emitSortState: ({ sortBy, sortDesc }) => {
    emits("update:sortBy", sortBy);
    emits("update:sortDesc", sortDesc);
    emits("change", { sortBy, sortDesc });
  },
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

  return sortFields.filter(Boolean).map((field, index) => ({
    field: String(field),
    order: sortDirections[index] ? -1 : 1,
  }));
};

const multiSortMeta = ref(
  normalizeSortMeta(props.sortByList, props.sortDescList),
);
const stripForcedGroupSort = (meta: SortMeta[]) => {
  const field = groupSortField.value;
  if (!field || !rowGroupMode.value || !meta.length) {
    return meta;
  }

  return meta.filter((item, index) => !(index === 0 && item.field === field));
};

watch(
  () => [props.sortByList, props.sortDescList],
  ([sortByList, sortDescList]) => {
    multiSortMeta.value = stripForcedGroupSort(
      normalizeSortMeta(sortByList, sortDescList),
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

const emitSortState = (meta: SortMeta[]) => {
  const sortBy = meta.map((item) => item.field);
  const sortDesc = meta.map((item) => item.order === -1);
  emits("update:sortBy", sortBy);
  emits("update:sortDesc", sortDesc);
  emits("change", { sortBy, sortDesc });
};

const handleExpandedRowGroupsUpdate = (groups: unknown[]) => {
  emits("update:expandedRowGroups", Array.isArray(groups) ? groups : []);
};

const sortedExportItems = computed(() => {
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

let activateKeyboardScopeHandler: (() => void) | null = null;

const {
  activeRowKey,
  focusTableRoot,
  getActiveRowIndex,
  getRowClass,
  handleRowClick,
  handleRowDblClick,
  isActiveRow,
  setActiveRow,
} = useDataTableActiveRow({
  activeRow: computed(() => props.activeRow),
  activeRowKey: computed(() => props.activeRowKey),
  enableKeyboardNavigation: isKeyboardNavigationEnabled,
  itemKey: resolvedItemKey,
  items: sortedExportItems,
  rootRef,
  tableFocusRef,
  activateKeyboardScope: () => activateKeyboardScopeHandler?.(),
  emitClickRow: (item) => emits(`click-row`, item),
  emitDblClickRow: (item) => emits(`dblclick-row`, item),
  emitActiveRow: (item) => emits(`update:activeRow`, item),
  emitActiveRowKey: (key) => emits(`update:activeRowKey`, key),
});

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

activateKeyboardScopeHandler = activateKeyboardScope;

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
const { exportActions, exportError, handleExport, isExporting } =
  useDataTableExport({
    customExportHeaders: computed(() => props.exportHeaders),
    customExportRows: computed(() => props.exportRows),
    customExportRowKinds: computed(() => props.exportRowKinds),
    exportTitleInput: computed(() => props.exportTitle),
    filteredRowsCount,
    sortedItems: sortedExportItems,
    visibleHeaders,
  });

const { autoFitVisibleColumns } = useDataTableColumnAutoFit({
  columnLayouts,
  items: sortedExportItems,
  rootRef,
  setColumnLayouts,
  visibleHeaders,
});

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

const clearColumnDecorators = (columnValue: string) => {
  clearColumnFilter(columnValue);

  const nextMeta = multiSortMeta.value.filter(
    (item) => item.field !== columnValue,
  );
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

useDataTableFilterDismiss({
  rootRef,
  activeFilterHeader,
  closeColumnFilter,
});

onMounted(() => {
  syncKeyboardScope();
});

watch(
  rawItems,
  () => {
    if (activeFilterHeader.value) {
      syncDraftWithActiveColumn();
    }
  },
  { deep: true },
);

watch(tableRenderKey, () => {
  syncKeyboardScope();
});
</script>

<style scoped src="./DataTable.css"></style>
