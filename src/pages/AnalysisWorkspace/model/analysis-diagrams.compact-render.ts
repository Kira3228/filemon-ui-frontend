import {
  buildDiagramFileDisplay,
  groupRenameRowsByFile,
  makeCompactEdgeLabel,
  minTs,
  sanitizeMermaidLabel,
  shortFs,
} from "./analysis-diagrams.helpers";
import type {
  AnalysisDiagramFileVersion,
  AnalysisDiagramProcessVersion,
  AnalysisFileItem,
  AnalysisReportResult,
} from "./analysis-report.types";
import type { CompactTreeResult } from "./analysis-diagrams.compact-tree";

interface CompactRenderState {
  fileItems: AnalysisFileItem[];
  filteredFileVersions: AnalysisDiagramFileVersion[];
  filteredProcessVersions: AnalysisDiagramProcessVersion[];
  result: CompactTreeResult;
  report: AnalysisReportResult | null;
  sourceFileIds: Set<number>;
}

export const renderCompactFileTreeMermaid = ({
  fileItems,
  filteredFileVersions,
  report,
  result,
  sourceFileIds,
}: CompactRenderState) => {
  const { nodeFileIds, edgeCounts, edgeProcessIds } = result;
  const fileItemsById = new Map<number, AnalysisFileItem>(fileItems.map((item) => [Number(item.fileId), item] as const));
  const renameRowsByFile = groupRenameRowsByFile(report);

  const firstSeenByFile = new Map<number, string | null>();
  for (const row of filteredFileVersions) {
    const fileId = Number(row.fileId);
    firstSeenByFile.set(fileId, minTs(firstSeenByFile.get(fileId) || null, row.createdAt));
  }

  const lines = ["flowchart LR"];

  for (const fileId of [...nodeFileIds].sort((a, b) => a - b)) {
    const file = fileItemsById.get(fileId);
    if (!file) { continue; }
    const label = buildDiagramFileDisplay(fileId, fileItemsById, renameRowsByFile, firstSeenByFile.get(fileId));
    const fsLine = shortFs(file.filesystem || file.filesystemUuid);
    const star = sourceFileIds.has(fileId) ? "★ " : "";
    lines.push(`    F${fileId}["📄 ${star}${label}${fsLine ? `\\nFS:${fsLine}` : ""}"]:::file`);
  }

  for (const key of [...edgeCounts.keys()].sort()) {
    const [fromId, toId] = key.split("->").map((item) => Number(item));
    const edgeLabel = makeCompactEdgeLabel(edgeProcessIds.get(key) || new Set<number>(), processesById);
    lines.push(`    F${fromId} -->|"${sanitizeMermaidLabel(edgeLabel)}"| F${toId}`);
  }

  lines.push("classDef file fill:#eef2ff,stroke:#4f46e5,stroke-width:2px");
  lines.push("classDef source fill:#c8e6c9,stroke:#2e7d32,stroke-width:4px");
  for (const fileId of [...nodeFileIds].sort((a, b) => a - b)) {
    if (sourceFileIds.has(fileId)) {
      lines.push(`    class F${fileId} source`);
    }
  }

  return lines.join("\n");
};
