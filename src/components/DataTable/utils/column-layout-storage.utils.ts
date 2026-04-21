import { ColumnLayoutState } from "../types/data-table.types";
import { Header } from "../types/header.type";
import { normalizeColumnWidth, sanitizeStorageSegment } from "./data-table.utils";

type BuildDataTableStateKeyOptions = {
  headers: Header[];
  stateKey?: string;
  exportTitle?: string;
};

export const buildDataTableStateKey = ({
  headers,
  stateKey,
  exportTitle,
}: BuildDataTableStateKeyOptions) => {
  const explicit = String(stateKey || "").trim();
  if (explicit) {
    return `compact-data-table:${sanitizeStorageSegment(explicit)}`;
  }

  const titleKey = String(exportTitle || "table");
  const headersKey = headers.map((header) => header.value).join("_");
  return `compact-data-table:${sanitizeStorageSegment(titleKey)}:${sanitizeStorageSegment(headersKey || "columns")}`;
};

export const loadColumnLayouts = (storageKey: string): ColumnLayoutState[] => {
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

export const saveColumnLayouts = (
  storageKey: string,
  columnLayouts: ColumnLayoutState[],
) => {
  if (typeof window === "undefined") { return; }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify({
      columns: columnLayouts,
    }));
  } catch (error) {
    console.error(error);
  }
};
