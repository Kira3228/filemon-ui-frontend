import type {
  AnalysisDiagramProcessVersion,
  AnalysisFileItem,
  AnalysisReportResult,
  Nullable,
} from "./analysis-report.types";

export interface RenameRowView {
  createdAt: string;
  oldPath: Nullable<string>;
  newPath: Nullable<string>;
}

export const getDiagramFileName = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) { return "-"; }
  const parts = text.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || text;
};

export const formatDiagramProcessDisplayName = (
  executablePath?: string | null,
  pid?: number | null,
  fallback = "proc",
) => {
  const executable = getDiagramFileName(executablePath || fallback);
  if (pid !== null && pid !== undefined) {
    return `${executable} (PID ${pid})`;
  }
  return executable;
};

export const sanitizeMermaidLabel = (value: unknown) =>
  String(value ?? "—")
    .replace(/"/g, "'")
    .replace(/[<>]/g, "")
    .replace(/\|/g, "/")
    .replace(/\r?\n/g, "\\n");

export const shortFs = (value?: string | null) => {
  if (!value) { return ""; }
  return value.length > 15 ? `${value.slice(0, 12)}...` : value;
};

export const clipTs = (value?: string | null) => String(value || "").trim().slice(0, 19);

export const minTs = (left?: string | null, right?: string | null) => {
  const a = clipTs(left);
  const b = clipTs(right);
  if (!a) { return b || null; }
  if (!b) { return a || null; }
  return a <= b ? a : b;
};

export const normalizeSnapshotCutoff = (snapshotAt?: string | null) => {
  if (!snapshotAt) { return null; }
  const value = String(snapshotAt).trim();
  if (!value) { return null; }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const isBeforeSnapshot = (value: unknown, cutoff: number | null) => {
  if (cutoff === null) { return true; }
  if (!value) { return true; }
  const timestamp = new Date(String(value)).getTime();
  return Number.isNaN(timestamp) ? true : timestamp <= cutoff;
};

export const groupRenameRowsByFile = (report: AnalysisReportResult | null) => {
  const result = new Map<number, RenameRowView[]>();
  for (const row of report?.renameHistory || []) {
    const fileId = Number(row.fileId);
    if (!Number.isFinite(fileId)) { continue; }
    const item: RenameRowView = {
      createdAt: row.createdAt,
      oldPath: row.oldPath,
      newPath: row.newPath,
    };
    const list = result.get(fileId) || [];
    list.push(item);
    result.set(fileId, list);
  }
  for (const [fileId, rows] of result.entries()) {
    result.set(fileId, [...rows].sort((a, b) => {
      const tsA = clipTs(a.createdAt);
      const tsB = clipTs(b.createdAt);
      return tsA.localeCompare(tsB);
    }));
  }
  return result;
};

export const buildFilePathHistory = (currentPath: string, renameRows: RenameRowView[]) => {
  const history: string[] = [];
  const seen = new Set<string>();

  const addPath = (value?: string | null) => {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) { return; }
    seen.add(normalized);
    history.push(normalized);
  };

  for (const row of renameRows) {
    addPath(row.oldPath);
    addPath(row.newPath);
  }
  addPath(currentPath);
  return history;
};

export const resolveFilePathAtTimestamp = (
  currentPath: string,
  renameRows: RenameRowView[],
  createdAt?: string | null,
  includeChangesAtSameTimestamp = false,
) => {
  let resolvedPath = String(currentPath || "").trim();
  const rows = [...renameRows];
  if (!resolvedPath && rows.length) {
    const lastRow = rows[rows.length - 1];
    resolvedPath = String(lastRow.newPath || lastRow.oldPath || "").trim();
  }
  const targetTs = clipTs(createdAt);
  if (!targetTs) { return resolvedPath; }

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    const rowTs = clipTs(row.createdAt);
    if (!rowTs) { continue; }
    const shouldRewind = targetTs < rowTs || (includeChangesAtSameTimestamp && targetTs === rowTs);
    if (!shouldRewind) { continue; }
    const oldPath = String(row.oldPath || "").trim();
    const newPath = String(row.newPath || "").trim();
    if (newPath && resolvedPath === newPath) {
      resolvedPath = oldPath || resolvedPath;
    } else if (oldPath && !resolvedPath) {
      resolvedPath = oldPath;
    }
  }
  return resolvedPath;
};

export const buildDiagramFileDisplay = (
  fileId: number,
  fileItemsById: Map<number, AnalysisFileItem>,
  renameRowsByFile: Map<number, RenameRowView[]>,
  eventTs?: string | null,
) => {
  const file = fileItemsById.get(fileId);
  const currentPath = String(file?.path || `file_${fileId}`);
  const renameRows = renameRowsByFile.get(fileId) || [];
  const pathHistory = buildFilePathHistory(currentPath, renameRows);
  const nameHistory = pathHistory
    .map((item) => getDiagramFileName(item))
    .filter((item, index, list) => !!item && list.indexOf(item) === index);
  const currentName = getDiagramFileName(currentPath) || `file_${fileId}`;
  const pathAtEvent = resolveFilePathAtTimestamp(currentPath, renameRows, eventTs);
  const nameAtEvent = getDiagramFileName(pathAtEvent || currentPath) || currentName;

  if (nameHistory.length <= 1) {
    return sanitizeMermaidLabel(nameAtEvent || currentName);
  }

  const shortItems = nameHistory.length > 3 ? nameHistory.slice(-3) : nameHistory;
  return sanitizeMermaidLabel(`${nameAtEvent || currentName}\\nrename: ${shortItems.join(" -> ")}`);
};

export const buildProcessUserPart = (processInfo: Partial<AnalysisDiagramProcessVersion>) => {
  if (processInfo.username && processInfo.uid !== null && processInfo.uid !== undefined) {
    return `${processInfo.username}:${processInfo.uid}`;
  }
  if (processInfo.username) { return String(processInfo.username); }
  if (processInfo.uid !== null && processInfo.uid !== undefined) { return `uid:${processInfo.uid}`; }
  return "?";
};

export const makeProcessGroupInfoLabel = (
  pid: number | null | undefined,
  processIds: number[],
  processes: Map<number, AnalysisDiagramProcessVersion>,
) => {
  const lines = [`⚙ PID: ${pid ?? "?"}`];
  for (const processId of [...processIds].sort((a, b) => a - b)) {
    const processInfo: Partial<AnalysisDiagramProcessVersion> = processes.get(processId) || {};
    const exe = formatDiagramProcessDisplayName(processInfo.executablePath, processInfo.pid, "proc");
    lines.push(`🧑 ${exe} | U:${buildProcessUserPart(processInfo)}`);
  }
  return sanitizeMermaidLabel(lines.join("\\n"));
};

export const makeCompactEdgeLabel = (
  processIds: Set<number>,
  processes: Map<number, AnalysisDiagramProcessVersion>,
) => {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const processId of [...processIds].sort((a, b) => a - b)) {
    const processInfo: Partial<AnalysisDiagramProcessVersion> = processes.get(processId) || {};
    const exe = formatDiagramProcessDisplayName(
      processInfo.executablePath,
      processInfo.pid,
      `process_${processId}`,
    );
    const label = sanitizeMermaidLabel(`${exe} (${buildProcessUserPart(processInfo)})`).replace(/\\n/g, " ");
    if (seen.has(label)) { continue; }
    seen.add(label);
    labels.push(label);
  }

  if (!labels.length) { return "unknown (?)"; }
  if (labels.length <= 2) { return labels.join("; "); }
  return `${labels.slice(0, 2).join("; ")}; +${labels.length - 2}`;
};
