import { ColumnLayoutState } from "../types/data-table.types";
import { Header } from "../types/header.type";
import { normalizeColumnWidth } from "./data-table.utils";

export const normalizeColumnLayouts = (
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

export const reorderArray = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  return nextItems;
};

export const applyColumnLayoutsToHeaders = (
  headers: Header[],
  columnLayouts: ColumnLayoutState[],
): Header[] => {
  const layoutMap = new Map(columnLayouts.map((layout) => [layout.value, layout]));

  return [...headers]
    .map((header, index) => {
      const layout = layoutMap.get(header.value);
      return {
        header: {
          ...header,
          isVisible: layout?.isVisible ?? header.isVisible !== false,
          width: normalizeColumnWidth(layout?.width, normalizeColumnWidth(header.width, 160)),
        },
        order: layout?.order ?? index,
      };
    })
    .sort((first, second) => first.order - second.order)
    .map(({ header }) => header);
};

export const reorderVisibleColumnLayouts = (
  columnLayouts: ColumnLayoutState[],
  dragVisibleIndex: number,
  dropVisibleIndex: number,
) => {
  if (
    dragVisibleIndex < 0 ||
    dropVisibleIndex < 0 ||
    dragVisibleIndex === dropVisibleIndex
  ) {
    return null;
  }

  const orderedLayouts = [...columnLayouts].sort((first, second) => first.order - second.order);
  const visibleSlots = orderedLayouts
    .map((layout, index) => ({ layout, index }))
    .filter(({ layout }) => layout.isVisible !== false);

  if (
    dragVisibleIndex >= visibleSlots.length ||
    dropVisibleIndex >= visibleSlots.length
  ) {
    return null;
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

  return orderedLayouts.map((layout) => ({
    ...layout,
    order: nextOrderValues.indexOf(layout.value),
  }));
};

export const moveColumnLayout = (
  columnLayouts: ColumnLayoutState[],
  columnValue: string,
  delta: -1 | 1,
) => {
  const orderedLayouts = [...columnLayouts].sort((first, second) => first.order - second.order);
  const currentIndex = orderedLayouts.findIndex((layout) => layout.value === columnValue);
  const nextIndex = currentIndex + delta;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= orderedLayouts.length) {
    return null;
  }

  const nextLayouts = [...orderedLayouts];
  [nextLayouts[currentIndex], nextLayouts[nextIndex]] = [nextLayouts[nextIndex], nextLayouts[currentIndex]];

  return nextLayouts.map((layout, index) => ({
    ...layout,
    order: index,
  }));
};
