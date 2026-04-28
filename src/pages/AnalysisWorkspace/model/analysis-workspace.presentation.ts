import type { Nullable, AnalysisFileLink } from "./analysis-report.types";

export const formatAnalysisTimestamp = (value?: Nullable<string>) => {
  if (!value) { return "—"; }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) { return value; }
  return date.toLocaleString("ru-RU");
};

export const formatAnalysisLinks = (items: AnalysisFileLink[]) => {
  if (!items?.length) { return "—"; }
  return items.map((item) => item.name).join(", ");
};

const knownEventTypes = [
  "READ",
  "WRITE",
  "DELETE",
  "SOURCE",
  "TRACKING",
  "STATUS",
  "MANUAL_STATUS_CHANGE",
  "MOVE",
  "RENAME",
  "MOVE_RENAME",
  "PROCESS",
  "FILE_VERSION",
  "OUT_OF_SCOPE_MOVE",
];

export const getAnalysisBadgeClass = (type: string) => ({
  event_badge_read: type === "READ",
  event_badge_write: type === "WRITE",
  event_badge_delete: type === "DELETE",
  event_badge_source: type === "SOURCE",
  event_badge_tracking: type === "TRACKING",
  event_badge_status: type === "STATUS",
  event_badge_manual_status_change: type === "MANUAL_STATUS_CHANGE",
  event_badge_move: type === "MOVE",
  event_badge_rename: type === "RENAME",
  event_badge_move_rename: type === "MOVE_RENAME",
  event_badge_process: type === "PROCESS",
  event_badge_file_version: type === "FILE_VERSION",
  event_badge_out_of_scope_move: type === "OUT_OF_SCOPE_MOVE",
  event_badge_gray: !type || !knownEventTypes.includes(type),
});

export const getAnalysisEventColor = (type: string) => {
  if (type === "READ") { return "blue lighten-4"; }
  if (type === "WRITE") { return "orange lighten-4"; }
  if (type === "DELETE") { return "blue-grey lighten-4"; }
  if (type === "SOURCE") { return "green lighten-4"; }
  if (type === "TRACKING") { return "cyan lighten-4"; }
  if (type === "STATUS") { return "amber lighten-4"; }
  if (type === "MANUAL_STATUS_CHANGE") { return "lime lighten-4"; }
  if (type === "MOVE") { return "deep-purple lighten-4"; }
  if (type === "RENAME") { return "pink lighten-4"; }
  if (type === "MOVE_RENAME") { return "indigo lighten-4"; }
  if (type === "PROCESS") { return "grey lighten-3"; }
  if (type === "FILE_VERSION") { return "teal lighten-4"; }
  if (type === "OUT_OF_SCOPE_MOVE") { return "brown lighten-4"; }
  return "grey lighten-3";
};

export const getAnalysisStatusBadgeClass = (status?: string | null) => {
  const normalized = String(status || "").trim().toLowerCase();

  return {
    event_badge_green: normalized === "отслеживается",
    event_badge_red: normalized === "удален" || normalized === "удалён",
    event_badge_yellow: normalized === "снят с наблюдения" || normalized === "вне области наблюдения",
    event_badge_gray: !normalized || ![
      "отслеживается",
      "удален",
      "удалён",
      "снят с наблюдения",
      "вне области наблюдения",
    ].includes(normalized),
  };
};
