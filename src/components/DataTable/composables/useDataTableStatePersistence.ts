import { computed, ComputedRef, ref, watch } from "vue";
import { Header } from "../types/header.type";
import { ColumnLayoutState } from "../types/data-table.types";
import { normalizeColumnWidth } from "../utils/data-table.utils";
import {
  applyColumnLayoutsToHeaders,
  moveColumnLayout,
  normalizeColumnLayouts,
  reorderVisibleColumnLayouts,
} from "../utils/column-layout.utils";
import {
  buildDataTableStateKey,
  loadColumnLayouts,
  saveColumnLayouts,
} from "../utils/column-layout-storage.utils";


type UseDataTableStatePersistenceOptions = {
  headers: ComputedRef<Header[]>;
  stateKey: ComputedRef<string | undefined>;
  exportTitle: ComputedRef<string | undefined>;
  showSelect: ComputedRef<boolean>;
};

export const useDataTableStatePersistence = ({
  headers,
  stateKey,
  exportTitle,
  showSelect,
}: UseDataTableStatePersistenceOptions) => {
  const columnLayouts = ref<ColumnLayoutState[]>([]);

  const tableStateKey = computed(() => {
    return buildDataTableStateKey({
      headers: headers.value,
      stateKey: stateKey.value,
      exportTitle: exportTitle.value,
    });
  });

  const persistColumnLayouts = () => {
    saveColumnLayouts(tableStateKey.value, columnLayouts.value);
  };

  const orderedHeaders = computed<Header[]>(() => {
    return applyColumnLayoutsToHeaders(headers.value, columnLayouts.value);
  });

  const visibleHeaders = computed(() =>
    orderedHeaders.value.filter((header) => header?.isVisible !== false),
  );

  const tableRenderKey = computed(() =>
    visibleHeaders.value
      .map((header, index) => `${header.value}:${header.width}:${index}`)
      .join("|"),
  );

  const setColumnLayouts = (nextLayouts: ColumnLayoutState[]) => {
    columnLayouts.value = normalizeColumnLayouts(headers.value, nextLayouts);
  };

  watch(
    [headers, tableStateKey],
    ([nextHeaders]) => {
      const persistedLayouts = loadColumnLayouts(tableStateKey.value);
      const sourceLayouts = persistedLayouts.length ? persistedLayouts : columnLayouts.value;
      columnLayouts.value = normalizeColumnLayouts(nextHeaders, sourceLayouts);
    },
    { immediate: true, deep: true },
  );

  watch(columnLayouts, () => {
    persistColumnLayouts();
  }, { deep: true });

  const getVisibleColumnOffset = () => (showSelect.value ? 1 : 0);

  const handleColumnResizeEnd = (event: { element?: HTMLElement | null }) => {
    const element = event.element as HTMLTableCellElement | null | undefined;
    if (!element) { return; }

    const visibleIndex = element.cellIndex - getVisibleColumnOffset();
    const header = visibleHeaders.value[visibleIndex];
    if (!header) { return; }

    const nextWidth = normalizeColumnWidth(element.offsetWidth, header.width);
    setColumnLayouts(
      columnLayouts.value.map((layout) =>
        layout.value === header.value ? { ...layout, width: nextWidth } : layout),
    );
  };

  const handleColumnReorder = (event: { dragIndex: number; dropIndex: number }) => {
    const offset = getVisibleColumnOffset();
    const nextLayouts = reorderVisibleColumnLayouts(
      columnLayouts.value,
      event.dragIndex - offset,
      event.dropIndex - offset,
    );

    if (nextLayouts) { setColumnLayouts(nextLayouts); }
  };

  const handleHeaderVisibilityChange = (columnValue: string, event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const isVisible = Boolean(target?.checked);

    if (!isVisible && visibleHeaders.value.length <= 1) { return; }

    setColumnLayouts(
      columnLayouts.value.map((layout) =>
        layout.value === columnValue ? { ...layout, isVisible } : layout),
    );
  };

  const handleHeaderWidthInput = (columnValue: string, event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) { return; }

    setColumnLayouts(
      columnLayouts.value.map((layout) =>
        layout.value === columnValue
          ? { ...layout, width: normalizeColumnWidth(target.value, layout.width) }
          : layout),
    );
  };

  const moveColumn = (columnValue: string, delta: -1 | 1) => {
    const nextLayouts = moveColumnLayout(columnLayouts.value, columnValue, delta);
    if (nextLayouts) { setColumnLayouts(nextLayouts); }
  };

  const resetColumnLayouts = () => {
    setColumnLayouts([]);
  };

  return {
    columnLayouts,
    orderedHeaders,
    tableRenderKey,
    tableStateKey,
    visibleHeaders,
    setColumnLayouts,
    handleColumnResizeEnd,
    handleColumnReorder,
    handleHeaderVisibilityChange,
    handleHeaderWidthInput,
    moveColumn,
    resetColumnLayouts,
  };
};
