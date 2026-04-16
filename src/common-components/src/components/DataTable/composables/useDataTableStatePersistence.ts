import { computed, ref, watch } from "vue";
import type { ComputedRef } from "vue";
import type { Header } from "../header.type";
import type { ColumnLayoutState } from "../data-table.types";
import {
  normalizeColumnWidth,
  sanitizeStorageSegment,
} from "../data-table.utils";

type UseDataTableStatePersistenceOptions = {
  headers: ComputedRef<Header[]>;
  stateKey: ComputedRef<string | undefined>;
  exportTitle: ComputedRef<string | undefined>;
  showSelect: ComputedRef<boolean>;
};

const normalizeColumnLayouts = (
  headers: Header[],
  incomingLayouts: ColumnLayoutState[] = [],
) => {
  const layoutMap = new Map(incomingLayouts.map((layout) => [layout.value, layout]));

  return headers
    .map((header, index) => {
      const saved = layoutMap.get(header.value);
      return {
        value: header.value,
        isVisible: saved?.isVisible ?? header.isVisible !== false,
        width: normalizeColumnWidth(saved?.width, normalizeColumnWidth(header.width, 160)),
        order: Number.isFinite(saved?.order) ? Number(saved?.order) : index,
      };
    })
    .sort((first, second) => first.order - second.order)
    .map((layout, index) => ({
      ...layout,
      order: index,
    }));
};

const loadColumnLayouts = (storageKey: string): ColumnLayoutState[] => {
  if (typeof window === "undefined") { return []; }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) { return []; }

    const parsed = JSON.parse(raw);
    const layouts = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.columns)
        ? parsed.columns
        : [];

    return (layouts as Array<Record<string, unknown>>)
      .filter((item) => item && typeof item.value === "string")
      .map((item, index) => ({
        value: String(item.value),
        isVisible: item.isVisible !== false,
        width: normalizeColumnWidth(item.width, 160),
        order: Number.isFinite(item.order) ? Number(item.order) : index,
      }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const reorderArray = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  return nextItems;
};

export const useDataTableStatePersistence = ({
  headers,
  stateKey,
  exportTitle,
  showSelect,
}: UseDataTableStatePersistenceOptions) => {
  const columnLayouts = ref<ColumnLayoutState[]>([]);

  const tableStateKey = computed(() => {
    const explicit = String(stateKey.value || "").trim();
    if (explicit) {
      return `compact-data-table:${sanitizeStorageSegment(explicit)}`;
    }

    const titleKey = String(exportTitle.value || "table");
    const headersKey = headers.value.map((header) => header.value).join("_");
    return `compact-data-table:${sanitizeStorageSegment(titleKey)}:${sanitizeStorageSegment(headersKey || "columns")}`;
  });

  const persistColumnLayouts = () => {
    if (typeof window === "undefined") { return; }

    try {
      window.localStorage.setItem(tableStateKey.value, JSON.stringify({
        columns: columnLayouts.value,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const orderedHeaders = computed<Header[]>(() => {
    const layoutMap = new Map(columnLayouts.value.map((layout) => [layout.value, layout]));

    return [...headers.value]
      .map((header, index) => {
        const layout = layoutMap.get(header.value);
        return {
          ...header,
          isVisible: layout?.isVisible ?? header.isVisible !== false,
          width: normalizeColumnWidth(layout?.width, normalizeColumnWidth(header.width, 160)),
          __order: layout?.order ?? index,
        };
      })
      .sort((first, second) => (first as Header & { __order: number }).__order - (second as Header & { __order: number }).__order)
      .map((header) => {
        const { ...cleanHeader } = header as Header & { __order: number };
        return cleanHeader;
      });
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
    const dragVisibleIndex = event.dragIndex - offset;
    const dropVisibleIndex = event.dropIndex - offset;

    if (
      dragVisibleIndex < 0 ||
      dropVisibleIndex < 0 ||
      dragVisibleIndex === dropVisibleIndex
    ) {
      return;
    }

    const orderedLayouts = [...columnLayouts.value].sort((first, second) => first.order - second.order);
    const visibleSlots = orderedLayouts
      .map((layout, index) => ({ layout, index }))
      .filter(({ layout }) => layout.isVisible !== false);

    if (
      dragVisibleIndex >= visibleSlots.length ||
      dropVisibleIndex >= visibleSlots.length
    ) {
      return;
    }

    const reorderedVisibleValues = reorderArray(
      visibleSlots.map(({ layout }) => layout.value),
      dragVisibleIndex,
      dropVisibleIndex,
    );

    const nextOrderValues = orderedLayouts.map((layout) => layout.value);
    visibleSlots.forEach(({ index }, visibleIndex) => {
      nextOrderValues[index] = reorderedVisibleValues[visibleIndex];
    });

    setColumnLayouts(
      orderedLayouts.map((layout) => ({
        ...layout,
        order: nextOrderValues.indexOf(layout.value),
      })),
    );
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
    const orderedLayouts = [...columnLayouts.value].sort((first, second) => first.order - second.order);
    const currentIndex = orderedLayouts.findIndex((layout) => layout.value === columnValue);
    const nextIndex = currentIndex + delta;

    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= orderedLayouts.length) { return; }

    const nextLayouts = [...orderedLayouts];
    [nextLayouts[currentIndex], nextLayouts[nextIndex]] = [nextLayouts[nextIndex], nextLayouts[currentIndex]];

    setColumnLayouts(
      nextLayouts.map((layout, index) => ({
        ...layout,
        order: index,
      })),
    );
  };

  const resetColumnLayouts = () => {
    setColumnLayouts(normalizeColumnLayouts(headers.value, []));
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
