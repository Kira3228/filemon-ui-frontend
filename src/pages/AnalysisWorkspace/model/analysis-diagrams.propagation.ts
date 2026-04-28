import { AnalysisFileItem } from "@/services/files/file.types";
import { aggregateDiagramOps } from "./analysis-diagrams.dataset";
import { groupRenameRowsByFile, minTs } from "./analysis-diagrams.helpers";
import type {
  AnalysisDiagramFileVersion,
  AnalysisDiagramOperation,
  AnalysisDiagramProcessVersion,
  AnalysisReportResult,
} from "./analysis-report.types";

export interface PropagationGraphState {
  activeFileIds: Set<number>;
  activeFileVersionIds: Set<number>;
  activeProcessVersionIds: Set<number>;
  aggregatedReads: ReturnType<typeof aggregateDiagramOps>;
  aggregatedWrites: ReturnType<typeof aggregateDiagramOps>;
  fileItemsById: Map<number, AnalysisFileItem>;
  firstSeenByFile: Map<number, string | null>;
  pidGroups: Map<string, { pid: number | null; processIds: Set<number> }>;
  processesById: Map<number, AnalysisDiagramProcessVersion>;
  processVersionsById: Map<number, AnalysisDiagramProcessVersion>;
  pvIdsByProcess: Map<number, number[]>;
  renameRowsByFile: ReturnType<typeof groupRenameRowsByFile>;
  sourceFileVersionIds: Set<number>;
}

export const buildPropagationGraphState = (
  report: AnalysisReportResult | null,
  fileItems: AnalysisFileItem[],
  filteredFileVersions: AnalysisDiagramFileVersion[],
  filteredReads: AnalysisDiagramOperation[],
  filteredWrites: AnalysisDiagramOperation[],
  filteredProcessVersions: AnalysisDiagramProcessVersion[],
): PropagationGraphState => {
  const fileItemsById = new Map<number, AnalysisFileItem>(fileItems.map((item) => [Number(item.fileId), item] as const));
  const renameRowsByFile = groupRenameRowsByFile(report);
  const processVersionsById = new Map<number, AnalysisDiagramProcessVersion>(filteredProcessVersions.map((row) => [Number(row.processVersionId), row] as const));
  const processesById = new Map<number, AnalysisDiagramProcessVersion>();
  for (const row of filteredProcessVersions) {
    if (row.processId !== null && row.processId !== undefined) {
      const current = processesById.get(Number(row.processId)) || row;
      processesById.set(Number(row.processId), current);
    }
  }

  const activeFileIds = new Set<number>();
  const activeFileVersionIds = new Set<number>();
  const activeProcessVersionIds = new Set<number>();
  const sourceFileVersionIds = new Set<number>();
  const firstSeenByFile = new Map<number, string | null>();

  for (const row of filteredFileVersions) {
    const fileId = Number(row.fileId);
    const fileVersionId = Number(row.fileVersionId);
    activeFileIds.add(fileId);
    activeFileVersionIds.add(fileVersionId);
    firstSeenByFile.set(fileId, minTs(firstSeenByFile.get(fileId) || null, row.createdAt));
    if (row.originProcessVersionId) {
      activeProcessVersionIds.add(Number(row.originProcessVersionId));
    } else {
      sourceFileVersionIds.add(fileVersionId);
    }
  }

  const aggregatedReads = aggregateDiagramOps(filteredReads).filter((row) =>
    activeFileVersionIds.has(Number(row.fileVersionId)),
  );
  const aggregatedWrites = aggregateDiagramOps(filteredWrites).filter((row) =>
    activeFileVersionIds.has(Number(row.fileVersionId)),
  );

  for (const row of aggregatedReads) {
    activeProcessVersionIds.add(Number(row.processVersionId));
  }
  for (const row of aggregatedWrites) {
    activeProcessVersionIds.add(Number(row.processVersionId));
  }

  const pidGroups = new Map<string, { pid: number | null; processIds: Set<number> }>();
  const pvIdsByProcess = new Map<number, number[]>();

  for (const pv of filteredProcessVersions) {
    const processVersionId = Number(pv.processVersionId);
    if (!activeProcessVersionIds.has(processVersionId)) { continue; }
    const processId = Number(pv.processId);
    if (!Number.isFinite(processId)) { continue; }
    const pid = pv.pid ?? null;
    const pidKey = String(pid ?? "unknown");
    const group = pidGroups.get(pidKey) || { pid, processIds: new Set<number>() };
    group.processIds.add(processId);
    pidGroups.set(pidKey, group);

    const list = pvIdsByProcess.get(processId) || [];
    list.push(processVersionId);
    pvIdsByProcess.set(processId, list);
  }

  return {
    activeFileIds,
    activeFileVersionIds,
    activeProcessVersionIds,
    aggregatedReads,
    aggregatedWrites,
    fileItemsById,
    firstSeenByFile,
    pidGroups,
    processesById,
    processVersionsById,
    pvIdsByProcess,
    renameRowsByFile,
    sourceFileVersionIds,
  };
};
