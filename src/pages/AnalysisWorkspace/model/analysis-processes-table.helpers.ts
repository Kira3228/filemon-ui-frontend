import { PROCESS_GROUP_MAX_TS } from "./analysis-processes-table.config";

export const resolveProcessTimestamp = (value?: string | null) => {
  if (!value) { return Number.NEGATIVE_INFINITY; }
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export const getProcessFileName = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) { return "-"; }
  const parts = text.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || text;
};

export const normalizeProcessSnapshotCutoff = (value?: string | null) => {
  if (!value) { return null; }
  const timestamp = new Date(String(value)).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const formatProcessMetaValue = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : value;

export const formatProcessVersionNumber = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : `v${value}`;

export const buildProcessGroupKey = (
  processVersionId: number,
  writeAt: string,
  fileId: number,
  writeIndex: number,
) => {
  const timestamp = resolveProcessTimestamp(writeAt);
  const sortPrefix = Number.isFinite(timestamp) && timestamp > Number.NEGATIVE_INFINITY
    ? String(PROCESS_GROUP_MAX_TS - timestamp).padStart(13, "0")
    : String(PROCESS_GROUP_MAX_TS);

  return [
    sortPrefix,
    String(processVersionId).padStart(12, "0"),
    String(fileId).padStart(12, "0"),
    String(writeIndex).padStart(6, "0"),
  ].join(":");
};
