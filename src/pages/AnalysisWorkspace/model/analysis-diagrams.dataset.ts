import type {
  AnalysisDiagramFileVersion,
  AnalysisDiagramOperation,
  AnalysisDiagramProcessVersion,
  AnalysisReportResult,
  Nullable,
} from "./analysis-report.types";
import { clipTs, isBeforeSnapshot, minTs, normalizeSnapshotCutoff } from "./analysis-diagrams.helpers";
import { AnalysisFileItem } from "@/services/files/file.types";

export interface AggregatedDiagramOperation {
  fileVersionId: number;
  processVersionId: number;
  count: number;
  firstAt: Nullable<string>;
  lastAt: Nullable<string>;
}

export interface DiagramDataset {
  fileItems: AnalysisFileItem[];
  allowedFileIds: Set<number>;
  filteredFileVersions: AnalysisDiagramFileVersion[];
  filteredReads: AnalysisDiagramOperation[];
  filteredWrites: AnalysisDiagramOperation[];
  filteredProcessVersions: AnalysisDiagramProcessVersion[];
  sourceFileIds: Set<number>;
}

export const aggregateDiagramOps = (rows: AnalysisDiagramOperation[]) => {
  const grouped = new Map<string, AggregatedDiagramOperation>();

  for (const row of rows) {
    const fileVersionId = Number(row.fileVersionId);
    const processVersionId = Number(row.processVersionId);
    if (!Number.isFinite(fileVersionId) || !Number.isFinite(processVersionId)) { continue; }
    const key = `${fileVersionId}:${processVersionId}`;
    const current = grouped.get(key) || {
      fileVersionId,
      processVersionId,
      count: 0,
      firstAt: row.firstAt || null,
      lastAt: row.lastAt || row.firstAt || null,
    };
    current.count += Number(row.count) || 1;
    current.firstAt = minTs(current.firstAt, row.firstAt);
    current.lastAt = clipTs(row.lastAt || row.firstAt || current.lastAt);
    grouped.set(key, current);
  }

  return [...grouped.values()];
};

export const getDiagramDataset = (
  report: AnalysisReportResult | null,
  selectedSourceId: number | null,
  snapshotAt: string,
): DiagramDataset => {
  const fileItems = report?.files || [];
  const diagramData = report?.diagramData || {
    fileVersions: [],
    processVersions: [],
    reads: [],
    writes: [],
  };
  const cutoff = normalizeSnapshotCutoff(snapshotAt);
  const allowedFileIds = new Set<number>(
    fileItems
      .filter((item) => !selectedSourceId || item.sourceIds.includes(selectedSourceId))
      .map((item) => Number(item.fileId)),
  );

  const filteredFileVersions = diagramData.fileVersions.filter((row) =>
    allowedFileIds.has(Number(row.fileId)) && isBeforeSnapshot(row.createdAt, cutoff),
  );

  const filteredReads = diagramData.reads.filter((row) =>
    allowedFileIds.has(Number(row.fileId)) && isBeforeSnapshot(row.firstAt, cutoff),
  );

  const filteredWrites = diagramData.writes.filter((row) =>
    allowedFileIds.has(Number(row.fileId)) && isBeforeSnapshot(row.firstAt, cutoff),
  );

  const allowedProcessVersionIds = new Set<number>();
  for (const row of filteredFileVersions) {
    if (row.originProcessVersionId) {
      allowedProcessVersionIds.add(Number(row.originProcessVersionId));
    }
  }
  for (const row of filteredReads) {
    if (row.processVersionId) {
      allowedProcessVersionIds.add(Number(row.processVersionId));
    }
  }
  for (const row of filteredWrites) {
    if (row.processVersionId) {
      allowedProcessVersionIds.add(Number(row.processVersionId));
    }
  }

  const filteredProcessVersions = diagramData.processVersions.filter((row) =>
    allowedProcessVersionIds.has(Number(row.processVersionId)) && isBeforeSnapshot(row.createdAt, cutoff),
  );

  const sourceFileIds = new Set<number>(
    filteredFileVersions
      .filter((row) => !row.originProcessVersionId)
      .map((row) => Number(row.fileId)),
  );

  return {
    fileItems,
    allowedFileIds,
    filteredFileVersions,
    filteredReads,
    filteredWrites,
    filteredProcessVersions,
    sourceFileIds,
  };
};
