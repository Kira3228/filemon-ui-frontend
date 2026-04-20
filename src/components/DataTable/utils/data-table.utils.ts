import { Header } from "@/common-components/src/components/DataTable";
import { EMPTY_FILTER_KEY, MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH, RangeValueType, RowKey } from "../types/data-table.types";


export const sanitizeStorageSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "table";

export const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "table_export";

export const normalizeColumnWidth = (value: unknown, fallback = 160) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) { return fallback; }
  return Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, Math.round(parsed)));
};

export const inferPrimaryItemKey = (items: unknown[]) => {
  const sample = items.find((item) => item && typeof item === "object") as Record<string, unknown> | undefined;
  if (!sample) { return "id"; }
  if (Object.prototype.hasOwnProperty.call(sample, "id")) { return "id"; }
  if (Object.prototype.hasOwnProperty.call(sample, "fileId")) { return "fileId"; }
  return "id";
};

export const resolveFieldData = (item: unknown, field?: string) => {
  if (!item || typeof item !== "object" || !field) { return undefined; }
  return field.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") { return undefined; }
    return (acc as Record<string, unknown>)[key];
  }, item);
};

export const resolveRowKey = (item: unknown, itemKey: string): RowKey | null => {
  if (!item || typeof item !== "object") { return null; }

  const explicitValue = resolveFieldData(item, itemKey);
  if (explicitValue !== null && explicitValue !== undefined && explicitValue !== "") {
    return explicitValue as RowKey;
  }

  const fallbackValue = resolveFieldData(item, "fileId");
  if (fallbackValue !== null && fallbackValue !== undefined && fallbackValue !== "") {
    return fallbackValue as RowKey;
  }

  return null;
};

export const isSameRowKey = (first: unknown, second: unknown) =>
  first !== null &&
  first !== undefined &&
  second !== null &&
  second !== undefined &&
  String(first) === String(second);

export const normalizeFilterLabel = (value: unknown): string => {
  if (value === null || value === undefined || value === "") { return "Пусто"; }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const item = entry as Record<string, unknown>;
          return String(item.name ?? item.label ?? item.title ?? item.id ?? "");
        }

        return String(entry);
      })
      .filter(Boolean)
      .join(", ") || "Пусто";
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return String(item.name ?? item.label ?? item.title ?? item.id ?? "Пусто");
  }

  return String(value);
};

export const normalizeFilterKey = (value: unknown) => {
  const label = normalizeFilterLabel(value);
  return label === "Пусто" ? EMPTY_FILTER_KEY : label;
};

export const getFilterSourceValue = (item: unknown, header: Header) => {
  if (typeof header.filterValue === "function") {
    return header.filterValue(item);
  }

  if (Array.isArray(header.filterBy)) {
    const values = header.filterBy
      .map((field) => resolveFieldData(item, field))
      .filter((value) => value !== null && value !== undefined && value !== "");

    return values.length ? values.join(" / ") : null;
  }

  if (typeof header.filterBy === "string") {
    return resolveFieldData(item, header.filterBy);
  }

  return resolveFieldData(item, header.value);
};

export const resolveExportValue = (item: unknown, header: Header) => {
  if (typeof header.exportValue === "function") {
    return header.exportValue(item);
  }

  const directValue = resolveFieldData(item, header.value);
  if (directValue !== undefined) {
    return directValue;
  }

  return getFilterSourceValue(item, header);
};

export const normalizeScalarFilterValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    if (value.length !== 1) { return null; }
    return normalizeScalarFilterValue(value[0]);
  }

  if (value instanceof Date) { return value; }
  if (value && typeof value === "object") { return null; }
  return value;
};

export const parseNumberValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) { return null; }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const parseDateValue = (value: unknown): number | null => {
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isNaN(ts) ? null : ts;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

export const resolveRangeComparableValue = (value: unknown, valueType: RangeValueType): number | null => {
  const normalizedValue = normalizeScalarFilterValue(value);
  if (normalizedValue === null || normalizedValue === undefined || normalizedValue === "") {
    return null;
  }

  return valueType === "number"
    ? parseNumberValue(normalizedValue)
    : parseDateValue(normalizedValue);
};

export const compareValues = (first: unknown, second: unknown) => {
  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  const firstText = normalizeFilterLabel(first);
  const secondText = normalizeFilterLabel(second);
  return firstText.localeCompare(secondText, "ru", { numeric: true, sensitivity: "base" });
};

export const stringifyExportValue = (value: unknown) => {
  if (value === null || value === undefined) { return ""; }
  if (typeof value === "boolean") { return value ? "Да" : "Нет"; }

  const normalizedValue = normalizeFilterLabel(value).trim();
  if (!normalizedValue) { return ""; }

  const placeholderValues = new Set(["-", "—", "–", "Пусто", "пусто"]);
  if (placeholderValues.has(normalizedValue)) {
    return "";
  }

  return normalizedValue;
};

export const getCellTitle = (value: unknown) => {
  if (value === null || value === undefined) { return ""; }
  return normalizeFilterLabel(value);
};

export const getAlign = (align?: string) => {
  if (align === "center") { return "center"; }
  if (align === "end" || align === "right") { return "right"; }
  return "left";
};
