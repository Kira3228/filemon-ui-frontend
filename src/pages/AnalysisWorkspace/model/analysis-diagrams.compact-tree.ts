import { clipTs } from "./analysis-diagrams.helpers";
import type {
  AnalysisDiagramFileVersion,
  AnalysisDiagramOperation,
  AnalysisDiagramProcessVersion,
} from "./analysis-report.types";

export interface CompactTreeResult {
  nodeFileIds: Set<number>;
  edgeCounts: Map<string, number>;
  edgeProcessIds: Map<string, Set<number>>;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const reduceTransitiveCompactEdges = (
  edgeCounts: Map<string, number>,
  edgeProcessIds: Map<string, Set<number>>,
) => {
  const edges = [...edgeCounts.keys()].map((key) => key.split("->").map((item) => Number(item)) as [number, number]);
  if (edges.length < 3) {
    return { edgeCounts, edgeProcessIds };
  }

  const adjacency = new Map<number, Set<number>>();
  for (const [from, to] of edges) {
    const next = adjacency.get(from) || new Set<number>();
    next.add(to);
    adjacency.set(from, next);
  }

  const hasAltPath = (src: number, dst: number, skipKey: string) => {
    const stack = [src];
    const visited = new Set<number>([src]);
    while (stack.length) {
      const current = stack.pop();
      if (current === undefined) { continue; }
      for (const next of adjacency.get(current) || []) {
        if (`${current}->${next}` === skipKey) { continue; }
        if (next === dst) { return true; }
        if (visited.has(next)) { continue; }
        visited.add(next);
        stack.push(next);
      }
    }
    return false;
  };

  const reducedCounts = new Map<string, number>();
  const reducedProcesses = new Map<string, Set<number>>();

  for (const [from, to] of edges) {
    const key = `${from}->${to}`;
    if (hasAltPath(from, to, key)) { continue; }
    reducedCounts.set(key, edgeCounts.get(key) || 0);
    reducedProcesses.set(key, edgeProcessIds.get(key) || new Set<number>());
  }

  return { edgeCounts: reducedCounts, edgeProcessIds: reducedProcesses };
};

export const buildCompactFileTree = (
  fileVersionsById: Map<number, AnalysisDiagramFileVersion>,
  processVersionsById: Map<number, AnalysisDiagramProcessVersion>,
  reads: AnalysisDiagramOperation[],
  writes: AnalysisDiagramOperation[],
  allowedFileIds: Set<number>,
  requiredFileIds: Set<number>,
): CompactTreeResult => {
  const readsByProcess = new Map<number, AnalysisDiagramOperation[]>();
  const writesByProcess = new Map<number, AnalysisDiagramOperation[]>();

  const resolveFileId = (row: AnalysisDiagramOperation) => {
    if (row.fileId !== null && row.fileId !== undefined) { return Number(row.fileId); }
    const version = fileVersionsById.get(Number(row.fileVersionId));
    return version ? Number(version.fileId) : null;
  };

  for (const row of reads) {
    const processVersion = processVersionsById.get(Number(row.processVersionId));
    const processId = Number(processVersion?.processId ?? row.processId);
    if (!Number.isFinite(processId)) { continue; }
    const list = readsByProcess.get(processId) || [];
    list.push(row);
    readsByProcess.set(processId, list);
  }

  for (const row of writes) {
    const processVersion = processVersionsById.get(Number(row.processVersionId));
    const processId = Number(processVersion?.processId ?? row.processId);
    if (!Number.isFinite(processId)) { continue; }
    const list = writesByProcess.get(processId) || [];
    list.push(row);
    writesByProcess.set(processId, list);
  }

  const nodeFileIds = new Set<number>();
  const edgeCounts = new Map<string, number>();
  const edgeProcessIds = new Map<string, Set<number>>();

  for (const [processId, readRows] of readsByProcess.entries()) {
    const writeRows = writesByProcess.get(processId) || [];
    if (!writeRows.length) { continue; }

    for (const readRow of readRows) {
      const inFileId = resolveFileId(readRow);
      if (!isFiniteNumber(inFileId) || !allowedFileIds.has(inFileId)) { continue; }

      for (const writeRow of writeRows) {
        const outFileId = resolveFileId(writeRow);
        if (!isFiniteNumber(outFileId) || !allowedFileIds.has(outFileId) || inFileId === outFileId) { continue; }

        const readTs = clipTs(readRow.firstAt);
        const writeTs = clipTs(writeRow.firstAt);
        if (readTs && writeTs && writeTs < readTs) { continue; }

        nodeFileIds.add(inFileId);
        nodeFileIds.add(outFileId);

        const key = `${inFileId}->${outFileId}`;
        const increment = Math.max(Number(readRow.count) || 1, Number(writeRow.count) || 1);
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + increment);
        const processIds = edgeProcessIds.get(key) || new Set<number>();
        processIds.add(processId);
        edgeProcessIds.set(key, processIds);
      }
    }
  }

  for (const fileId of requiredFileIds) {
    if (allowedFileIds.has(fileId)) {
      nodeFileIds.add(fileId);
    }
  }

  return { nodeFileIds, edgeCounts, edgeProcessIds };
};
