import { Ref } from "vue";
import { ColumnLayoutState, MIN_COLUMN_WIDTH } from "../types/data-table.types";
import { Header } from "../types/header.type";
import { getCellTitle, getFilterSourceValue, normalizeColumnWidth, resolveExportValue, stringifyExportValue } from "../utils/data-table.utils";


type UseDataTableColumnAutoFitOptions = {
  columnLayouts: Ref<ColumnLayoutState[]>;
  items: Ref<unknown[]>;
  rootRef: Ref<HTMLElement | null>;
  setColumnLayouts: (layouts: ColumnLayoutState[]) => void;
  visibleHeaders: Ref<Header[]>;
};

export const useDataTableColumnAutoFit = ({
  columnLayouts,
  items,
  rootRef,
  setColumnLayouts,
  visibleHeaders,
}: UseDataTableColumnAutoFitOptions) => {

  const getMeasurementFont = (selector: string, fallback: string) => {
    if (typeof window === "undefined") {
      return fallback;
    }

    const element = rootRef.value?.querySelector(selector);

    if (!(element instanceof HTMLElement)) {
      return fallback;
    }

    const styles = window.getComputedStyle(element);
    const fontStyle = styles.fontStyle || "normal";
    const fontVariant = styles.fontVariant || "normal";
    const fontWeight = styles.fontWeight || "400";
    const fontSize = styles.fontSize || "12px";
    const lineHeight =
      styles.lineHeight && styles.lineHeight !== "normal"
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
    if (stringified) {
      return stringified;
    }
    return getCellTitle(getFilterSourceValue(item, header));
  };

  const autoFitVisibleColumns = () => {
    const headerFont = getMeasurementFont(
      ".compact-data-table__header-label",
      "normal normal 600 12px sans-serif",
    );
    const bodyFont = getMeasurementFont(
      ".compact-data-table__content",
      "normal normal 400 12px sans-serif",
    );
    const sampleItems = items.value.slice(0, 120);

    setColumnLayouts(
      columnLayouts.value.map((layout) => {
        const header = visibleHeaders.value.find(
          (entry) => entry.value === layout.value,
        );
        if (!header) {
          return layout;
        }

        const headerWidth =
          measureTextWidth(String(header.text || ""), headerFont) +
          (header.filterable === false ? 44 : 76) +
          (header.sortable ? 18 : 0);

        const contentWidth = sampleItems.reduce((maxWidth: number, item) => {
          const text = resolveAutoFitValue(item, header);
          if (!text) {
            return maxWidth;
          }
          return Math.max(maxWidth, measureTextWidth(text, bodyFont) + 28);
        }, 0);

        return {
          ...layout,
          width: normalizeColumnWidth(
            Math.max(headerWidth, contentWidth, MIN_COLUMN_WIDTH),
            layout.width,
          ),
        };
      }),
    );
  };

  return {
    autoFitVisibleColumns,
  };
};
