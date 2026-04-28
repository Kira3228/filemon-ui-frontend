import { computed } from "vue";
import type { Ref } from "vue";
import {
  buildCompactFileTreeMermaid,
  buildFullPropagationMermaid,
} from "./analysis-diagrams";
import type {
  AnalysisChainEntry,
  // AnalysisFileItem,
  AnalysisItemWithTimestamps,
  // AnalysisOperationItem,
  AnalysisProcessReadView,
  AnalysisRenameHistoryItem,
  AnalysisReportResult,
  // AnalysisReportResult,
  AnalysisSourceColumns,
  // AnalysisSourceItem,
  // AnalysisTimelineEntry,
} from "./analysis-report.types";
import { AnalysisFileItem } from "@/services/files/file.types";
import { AnalysisSourceItem } from "@/services/source/source.types";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { AnalysisOperationItem } from "@/services/operations/analysis-operation-item.type";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";

interface CreateAnalysisWorkspaceSelectorsOptions {
  report: Ref<AnalysisReportResult | null>;
  selectedFileId: Ref<number | null>;
  selectedSourceId: Ref<number | null>;
  snapshotAt: Ref<string>;
}

const getItemTimestamp = (item: AnalysisItemWithTimestamps) =>
  item.timestamp ||
  item.createdAt ||
  item.trackingStartedAt ||
  item.birthTime ||
  item.lastStatusAt ||
  null;

export const createAnalysisWorkspaceSelectors = ({
  report,
  selectedFileId,
  selectedSourceId,
  snapshotAt,
}: CreateAnalysisWorkspaceSelectorsOptions) => {
  const matchesSnapshot = (item: AnalysisItemWithTimestamps) => {
    if (!snapshotAt.value) { return true; }
    const ts = getItemTimestamp(item);
    if (!ts) { return true; }
    const cutoff = new Date(snapshotAt.value).getTime();
    return new Date(ts).getTime() <= cutoff;
  };

  const matchesSource = (item: { sourceIds?: number[] }) => {
    if (!selectedSourceId.value) { return true; }
    if (!Array.isArray(item.sourceIds)) { return false; }
    return item.sourceIds.includes(selectedSourceId.value);
  };

  const matchesFilters = <T extends AnalysisItemWithTimestamps>(item: T) => {
    return matchesSnapshot(item) && matchesSource(item);

  }

  const filesById = computed<Record<string, AnalysisFileItem>>(() => {
    const map: Record<string, AnalysisFileItem> = {};
    for (const file of report.value?.files || []) {
      map[String(file.fileId)] = file;
    }
    return map;
  });

  const visibleSources = computed<AnalysisSourceItem[]>(() =>
    (report.value?.sources || []).filter((item) => matchesFilters(item)),
  );

  const allSources = computed<AnalysisSourceItem[]>(() => report.value?.sources || []);

  const filteredTimeline = computed<AnalysisTimelineEntry[]>(() =>
    (report.value?.timeline || []).filter((item) => matchesFilters(item)),
  );

  const filteredFiles = computed<AnalysisFileItem[]>(() =>
    (report.value?.files || []).filter((item) => matchesFilters(item)),
  );

  const filteredStatusHistory = computed<AnalysisStatusHistoryItem[]>(() =>
    (report.value?.statusHistory || []).filter((item) => matchesFilters(item)),
  );

  const filteredRenameHistory = computed<AnalysisRenameHistoryItem[]>(() =>
    (report.value?.renameHistory || []).filter((item) => matchesFilters(item)),
  );

  const filteredProcessReads = computed<AnalysisProcessReadView[]>(() =>
    (report.value?.processReads || [])
      .map((process): AnalysisProcessReadView => {
        const files = (process.files || []).filter((file) => {
          const reportFile = filesById.value[String(file.fileId)];
          const sourceIds = reportFile?.sourceIds || process.sourceIds || [];
          return matchesFilters({
            ...file,
            createdAt: file.firstAt || process.createdAt,
            sourceIds,
          });
        });

        return {
          ...process,
          label: process.label || (
            process.executablePath
              ? `${process.executablePath.split(/[\\/]/).filter(Boolean).pop() || process.executablePath}${process.pid !== null && process.pid !== undefined ? ` (PID ${process.pid})` : ""}`
              : `PID ${process.pid ?? "—"}`
          ),
          files,
        };
      })
      .filter((process) => {
        if (!process.files.length) { return false; }
        return matchesSnapshot({ createdAt: process.createdAt });
      }),
  );

  const filteredOperations = computed<AnalysisOperationItem[]>(() =>
    (report.value?.operations || []).filter((item) => matchesFilters(item)),
  );

  const propagationDiagramMermaid = computed(() =>
    buildFullPropagationMermaid(report.value, selectedSourceId.value, snapshotAt.value),
  );

  const fileTreeDiagramMermaid = computed(() =>
    buildCompactFileTreeMermaid(report.value, selectedSourceId.value, snapshotAt.value),
  );

  const selectedFile = computed<AnalysisFileItem | null>(() =>
    selectedFileId.value ? filesById.value[String(selectedFileId.value)] || null : null,
  );

  const selectedSource = computed<AnalysisSourceItem | null>(() =>
    selectedSourceId.value
      ? allSources.value.find((item) => item.fileId === selectedSourceId.value) || null
      : null,
  );

  const selectedChain = computed<AnalysisChainEntry | null>(() => {
    if (!report.value || !selectedFileId.value) { return null; }
    return report.value.chains[String(selectedFileId.value)] || null;
  });

  const selectedFileTimeline = computed<AnalysisTimelineEntry[]>(() =>
    selectedFileId.value
      ? filteredTimeline.value.filter((item) => item.fileId === selectedFileId.value)
      : [],
  );

  const selectedFileRenameHistory = computed<AnalysisRenameHistoryItem[]>(() =>
    selectedFileId.value
      ? filteredRenameHistory.value.filter((item) => item.fileId === selectedFileId.value)
      : [],
  );

  const selectedFileStatusHistory = computed<AnalysisStatusHistoryItem[]>(() =>
    selectedFileId.value
      ? filteredStatusHistory.value.filter((item) => item.fileId === selectedFileId.value)
      : [],
  );

  const sourceColumns = (sourceFileId: number): AnalysisSourceColumns => {
    const chains = report.value?.chains || {};
    const levels: AnalysisSourceColumns = [];
    const seen = new Set<number>();
    let currentIds = [sourceFileId];

    while (currentIds.length) {
      const currentLevel = currentIds
        .map((fileId) => {
          const chain = chains[String(fileId)];
          const file = filesById.value[String(fileId)];
          if (!chain || !file) { return null; }
          if (!matchesFilters(file)) { return null; }
          return {
            ...file,
            chain,
            childIds: (chain.children || [])
              .map((child) => child.fileId)
              .filter((id) => {
                const childFile = filesById.value[String(id)];
                return Boolean(childFile && matchesFilters(childFile));
              }),
          };
        })
        .filter((item): item is AnalysisSourceColumns[number][number] => Boolean(item));

      if (!currentLevel.length) { break; }
      levels.push(currentLevel);

      const nextIds: number[] = [];
      for (const item of currentLevel) {
        seen.add(item.fileId);
        for (const childId of item.childIds) {
          if (!seen.has(childId)) {
            nextIds.push(childId);
          }
        }
      }
      currentIds = Array.from(new Set(nextIds));
    }

    return levels;
  };

  return {
    allSources,
    fileTreeDiagramMermaid,
    filesById,
    filteredFiles,
    filteredOperations,
    filteredProcessReads,
    filteredRenameHistory,
    filteredStatusHistory,
    filteredTimeline,
    propagationDiagramMermaid,
    selectedChain,
    selectedFile,
    selectedFileRenameHistory,
    selectedFileStatusHistory,
    selectedFileTimeline,
    selectedSource,
    sourceColumns,
    visibleSources,
  };
};
