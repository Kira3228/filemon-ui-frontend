import {
  buildDiagramFileDisplay,
  buildProcessUserPart,
  formatDiagramProcessDisplayName,
  makeProcessGroupInfoLabel,
  shortFs,
} from "./analysis-diagrams.helpers";
import type { PropagationGraphState } from "./analysis-diagrams.propagation";
import type {
  AnalysisDiagramFileVersion,
  AnalysisDiagramProcessVersion,
  AnalysisFileItem,
} from "./analysis-report.types";

export const renderFullPropagationMermaid = (
  state: PropagationGraphState,
  filteredFileVersions: AnalysisDiagramFileVersion[],
): string => {
  const {
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
  } = state;

  const lines = ["flowchart TD"];

  for (const fileId of [...activeFileIds].sort((a, b) => a - b)) {
    const file = fileItemsById.get(fileId);
    if (!file) { continue; }
    const label = buildDiagramFileDisplay(fileId, fileItemsById, renameRowsByFile, firstSeenByFile.get(fileId));
    const fsLine = shortFs(file.filesystem || file.filesystemUuid);
    lines.push(`    F${fileId}["📄 ${label}${fsLine ? `\\nFS:${fsLine}` : ""}"]:::file`);
  }

  for (const row of [...filteredFileVersions].sort((a, b) => Number(a.fileVersionId) - Number(b.fileVersionId))) {
    const fileVersionId = Number(row.fileVersionId);
    if (!activeFileVersionIds.has(fileVersionId)) { continue; }
    const label = buildDiagramFileDisplay(Number(row.fileId), fileItemsById, renameRowsByFile, row.createdAt);
    const star = row.originProcessVersionId ? "" : "★ ";
    lines.push(`    FV${fileVersionId}["🧬 ${star}${label}\\nv${row.versionNumber} (d=${row.depth || 0})"]:::fv`);
    lines.push(`    F${row.fileId} --> FV${fileVersionId}`);
  }

  const sortedPidGroups = [...pidGroups.values()].sort((a, b) => {
    const left = a.pid === null || a.pid === undefined ? Number.MAX_SAFE_INTEGER : Number(a.pid);
    const right = b.pid === null || b.pid === undefined ? Number.MAX_SAFE_INTEGER : Number(b.pid);
    return left - right;
  });

  for (const group of sortedPidGroups) {
    const pidToken = String(group.pid ?? "unknown").replace(/[^a-zA-Z0-9_]/g, "_");
    const groupId = `PIDG_${pidToken}`;
    lines.push(`    subgraph ${groupId}`);
    const infoId = `PGI_${pidToken}`;
    lines.push(`      ${infoId}["${makeProcessGroupInfoLabel(group.pid, [...group.processIds], processesById)}"]:::procinfo`);

    for (const processId of [...group.processIds].sort((a, b) => a - b)) {
      const processInfo: Partial<AnalysisDiagramProcessVersion> = processesById.get(processId) || {};
      const exe = formatDiagramProcessDisplayName(processInfo.executablePath, processInfo.pid, "proc");
      const userPart = buildProcessUserPart(processInfo);
      const pvIds = [...(pvIdsByProcess.get(processId) || [])].sort((a, b) => a - b);
      for (const pvId of pvIds) {
        const pv: Partial<AnalysisDiagramProcessVersion> = processVersionsById.get(pvId) || {};
        lines.push(`      PV${pvId}["🧠 ${exe}\\nPID:${processInfo.pid ?? "?"} v${pv.versionNumber ?? "?"}\\nU:${userPart}"]:::pv`);
      }
    }

    lines.push("    end");
    lines.push("    style " + groupId + " fill:#f8f0fb,stroke:#9a6fb0,stroke-width:2px,stroke-dasharray: 6 4");
  }

  for (const row of aggregatedReads.sort((a, b) => a.fileVersionId - b.fileVersionId || a.processVersionId - b.processVersionId)) {
    if (!activeProcessVersionIds.has(Number(row.processVersionId))) { continue; }
    const opId = `OPR_${row.fileVersionId}_${row.processVersionId}`;
    lines.push(`    FV${row.fileVersionId} -..-> ${opId}([" 📥 READ x${row.count} "]):::opr`);
    lines.push(`    ${opId} -..-> PV${row.processVersionId}`);
  }

  for (const row of aggregatedWrites.sort((a, b) => a.processVersionId - b.processVersionId || a.fileVersionId - b.fileVersionId)) {
    if (!activeProcessVersionIds.has(Number(row.processVersionId))) { continue; }
    const opId = `OPW_${row.processVersionId}_${row.fileVersionId}`;
    lines.push(`    PV${row.processVersionId} ===> ${opId}([" 📤 WRITE x${row.count} "]):::opw`);
    lines.push(`    ${opId} ===> FV${row.fileVersionId}`);
  }

  lines.push("classDef file fill:#eef2ff,stroke:#4f46e5,stroke-width:2px");
  lines.push("classDef fv fill:#e3f2fd,stroke:#1565c0,stroke-width:2px");
  lines.push("classDef proc fill:#f3f4f6,stroke:#374151,stroke-width:2px");
  lines.push("classDef pv fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px");
  lines.push("classDef source fill:#c8e6c9,stroke:#2e7d32,stroke-width:4px");
  lines.push("classDef opr fill:#dbeafe,stroke:#2563eb,stroke-width:1px,font-size:9px");
  lines.push("classDef opw fill:#fce7f3,stroke:#be185d,stroke-width:1px,font-size:9px");
  lines.push("classDef procinfo fill:#e5e7eb,stroke:#6b7280,stroke-width:1.5px,color:#111827");

  for (const fileVersionId of [...sourceFileVersionIds].sort((a, b) => a - b)) {
    lines.push(`    class FV${fileVersionId} source`);
  }

  return lines.join("\n");
};
