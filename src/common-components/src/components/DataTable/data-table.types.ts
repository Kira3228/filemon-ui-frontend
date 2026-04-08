import type { DataTableFilterMode, DataTableFilterValueType, Header } from "./header.type";

export type RowKey = string | number;
export type FilterMode = DataTableFilterMode;
export type RangeValueType = Exclude<DataTableFilterValueType, "text">;

export type SortMeta = {
  field: string;
  order: number;
};

export type ColumnFilterState =
  | { mode: "select"; selectedKeys: string[] }
  | { mode: "contains"; query: string }
  | { mode: "range"; from: string; to: string; valueType: RangeValueType };

export type ColumnFilters = Record<string, ColumnFilterState | undefined>;

export type FilterOption = {
  key: string;
  label: string;
  count: number;
};

export type ExportFormat = "csv" | "pdf";

export type ExportAction = {
  format: ExportFormat;
  label: string;
  pendingLabel: string;
  icon: string;
  primary: boolean;
};

export type ActiveFilterSummary = {
  key: string;
  label: string;
  text: string;
  fullText: string;
};

export type ColumnLayoutState = {
  value: string;
  isVisible: boolean;
  width: number;
  order: number;
};

export type ExportHeader = Pick<Header, "text" | "value">;

export const EMPTY_FILTER_KEY = "__EMPTY_FILTER_VALUE__";
export const MIN_COLUMN_WIDTH = 60;
export const MAX_COLUMN_WIDTH = 1600;
export const API_BASE_URL = process.env.VUE_APP_API_URL || "http://localhost:5000";

export const FILTER_MODE_LABELS: Record<FilterMode, string> = {
  select: "Список",
  contains: "Вхождение",
  range: "Диапазон",
};
