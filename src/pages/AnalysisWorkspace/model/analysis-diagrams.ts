import {
  AnalysisDiagramFileVersion,
  AnalysisDiagramProcessVersion,
  AnalysisReportResult,
} from "./analysis-report.types";
import { getDiagramDataset } from "./analysis-diagrams.dataset";
import { buildCompactFileTree, reduceTransitiveCompactEdges } from "./analysis-diagrams.compact-tree";
import { buildPropagationGraphState } from "./analysis-diagrams.propagation";
import { renderFullPropagationMermaid } from "./analysis-diagrams.render";
import { renderCompactFileTreeMermaid } from "./analysis-diagrams.compact-render";

export const buildCompactFileTreeMermaid = (
  report: AnalysisReportResult | null,
  selectedSourceId: number | null,
  snapshotAt: string,
) => {
  const {
    fileItems,
    allowedFileIds,
    filteredFileVersions,
    filteredReads,
    filteredWrites,
    filteredProcessVersions,
    sourceFileIds,
  } = getDiagramDataset(report, selectedSourceId, snapshotAt);

  if (!filteredFileVersions.length && !sourceFileIds.size) {
    return `flowchart LR\n    empty["Нет файлов для дерева"]`;
  }

  const fileVersionsById = new Map<number, AnalysisDiagramFileVersion>(filteredFileVersions.map((row) => [Number(row.fileVersionId), row] as const));
  const processVersionsById = new Map<number, AnalysisDiagramProcessVersion>(filteredProcessVersions.map((row) => [Number(row.processVersionId), row] as const));

  const result = buildCompactFileTree(
    fileVersionsById,
    processVersionsById,
    filteredReads,
    filteredWrites,
    allowedFileIds,
    sourceFileIds,
  );
  const reduced = reduceTransitiveCompactEdges(result.edgeCounts, result.edgeProcessIds);

  return renderCompactFileTreeMermaid({
    fileItems,
    filteredFileVersions,
    filteredProcessVersions,
    report,
    result: {
      nodeFileIds: result.nodeFileIds,
      edgeCounts: reduced.edgeCounts,
      edgeProcessIds: reduced.edgeProcessIds,
    },
    sourceFileIds,
  });
};

export const buildFullPropagationMermaid = (
  report: AnalysisReportResult | null,
  selectedSourceId: number | null,
  snapshotAt: string,
) => {
  const {
    fileItems,
    filteredFileVersions,
    filteredReads,
    filteredWrites,
    filteredProcessVersions,
  } = getDiagramDataset(report, selectedSourceId, snapshotAt);

  if (!filteredFileVersions.length) {
    return `flowchart TD\n    empty["Нет файлов для диаграммы"]`;
  }

  const state = buildPropagationGraphState(
    report,
    fileItems,
    filteredFileVersions,
    filteredReads,
    filteredWrites,
    filteredProcessVersions,
  );

  return renderFullPropagationMermaid(state, filteredFileVersions);
};
