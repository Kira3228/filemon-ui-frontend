import { Ref } from "vue";
import { ColumnLayoutState, MIN_COLUMN_WIDTH } from "../types/data-table.types";
import { Header } from "../types/header.type";
import { getCellTitle, getFilterSourceValue, normalizeColumnWidth, resolveExportValue, stringifyExportValue } from "../utils/data-table.utils";

const SAMPLE_ITEMS_LIMIT = 120;
const TEXT_WIDTH_FALLBACK_MULTIPLIER = 8;
const HEADER_BASE_PADDING = 44;
const HEADER_FILTER_PADDING = 32;
const HEADER_SORT_PADDING = 18;
const CELL_HORIZONTAL_PADDING = 28;

const HEADER_FONT_SELECTOR = ".compact-data-table__header-label";
const BODY_FONT_SELECTOR = ".compact-data-table__content";
const HEADER_FONT_FALLBACK = "normal normal 600 12px sans-serif";
const BODY_FONT_FALLBACK = "normal normal 400 12px sans-serif";

type UseDataTableColumnAutoFitOptions = {
  columnLayouts: Readonly<Ref<ColumnLayoutState[]>>;
  items: Readonly<Ref<unknown[]>>;
  rootRef: Ref<HTMLElement | null>;
  visibleHeaders: Readonly<Ref<Header[]>>;
};

export const useDataTableColumnAutoFit = ({
  columnLayouts,
  items,
  rootRef,
  visibleHeaders,
}: UseDataTableColumnAutoFitOptions) => {
  const getElementFont = (selector: string, fallback: string) => {
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

  const getMeasurementFonts = () => ({
    body: getElementFont(BODY_FONT_SELECTOR, BODY_FONT_FALLBACK),
    header: getElementFont(HEADER_FONT_SELECTOR, HEADER_FONT_FALLBACK),
  });

  const measureTextWidth = (text: string, font: string) => {
    if (typeof document === "undefined") {
      return text.length * TEXT_WIDTH_FALLBACK_MULTIPLIER;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return text.length * TEXT_WIDTH_FALLBACK_MULTIPLIER;
    }

    context.font = font;
    return context.measureText(text).width;
  };

  const resolveCellText = (item: unknown, header: Header) => {
    const directValue = resolveExportValue(item, header);
    const stringified = stringifyExportValue(directValue);
    if (stringified) {
      return stringified;
    }

    return getCellTitle(getFilterSourceValue(item, header));
  };

  const getHeaderExtraWidth = (header: Header) =>
    HEADER_BASE_PADDING +
    (header.filterable === false ? 0 : HEADER_FILTER_PADDING) +
    (header.sortable ? HEADER_SORT_PADDING : 0);

  const getHeaderWidth = (header: Header, font: string) =>
    measureTextWidth(header.text, font) + getHeaderExtraWidth(header);

  const getContentWidth = (
    header: Header,
    sampleItems: unknown[],
    font: string,
  ) =>
    sampleItems.reduce((maxWidth: number, item) => {
      const text = resolveCellText(item, header);
      if (!text) {
        return maxWidth;
      }

      return Math.max(
        maxWidth,
        measureTextWidth(text, font) + CELL_HORIZONTAL_PADDING,
      );
    }, 0);

  const getAutoFitWidth = (
    layout: ColumnLayoutState,
    header: Header,
    sampleItems: unknown[],
    fonts: ReturnType<typeof getMeasurementFonts>,
  ) =>
    normalizeColumnWidth(
      Math.max(
        getHeaderWidth(header, fonts.header),
        getContentWidth(header, sampleItems, fonts.body),
        MIN_COLUMN_WIDTH,
      ),
      layout.width,
    );

  const getAutoFitColumnLayouts = () => {
    const fonts = getMeasurementFonts();
    const sampleItems = items.value.slice(0, SAMPLE_ITEMS_LIMIT);
    const headersByValue = new Map(
      visibleHeaders.value.map((header) => [header.value, header]),
    );

    return columnLayouts.value.map((layout) => {
      const header = headersByValue.get(layout.value);
      if (!header) {
        return layout;
      }

      return {
        ...layout,
        width: getAutoFitWidth(layout, header, sampleItems, fonts),
      };
    });
  };

  return {
    getAutoFitColumnLayouts,
  };
};
