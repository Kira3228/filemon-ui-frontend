import { computed } from "vue";
import type { ComputedRef, Ref } from "vue";
import { buildProcessGroupKey, getProcessFileName, resolveProcessTimestamp } from "./analysis-processes-table.helpers";
import type {
  AnalysisDiagramFileVersion,
  AnalysisDiagramOperation,
  AnalysisDiagramProcessVersion,
  AnalysisFileItem,
  AnalysisReportResult,
  Nullable,
} from "./analysis-report.types";

export type ProcessEventType = "READ" | "WRITE";

interface ProcessEventSeed {
  processId: number;
  processVersionId: number;
  processLabel: string;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  user: Nullable<string>;
  uid: Nullable<number>;
  processCreatedAt: Nullable<string>;
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  versionNumber: Nullable<number>;
  eventAt: string;
  eventType: ProcessEventType;
}

interface BaseProcessTableItem {
  id: string;
  rowKind: "GROUP" | "EVENT";
  processBucketKey: string;
  processId: number;
  processGroupKey: string;
  processVersionId: Nullable<number>;
  processLabel: string;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  user: Nullable<string>;
  uid: Nullable<number>;
  processCreatedAt: Nullable<string>;
  writeAt: string;
  writeFileId: number;
  writeFileName: string;
  writePath: string;
  writeFilesystemUuid: Nullable<string>;
  eventType: ProcessEventType;
  eventAt: string;
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  versionNumber: Nullable<number>;
}

export interface ProcessEventRow extends BaseProcessTableItem {
  rowKind: "EVENT";
  eventType: ProcessEventType;
}

interface BuildProcessRowsOptions {
  filesById: ComputedRef<Record<string, AnalysisFileItem>>;
  report: Ref<AnalysisReportResult | null>;
  selectedSourceId: Ref<number | null>;
  snapshotAt: Ref<string>;
}

export const createProcessRows = ({
  filesById,
  report,
  selectedSourceId,
  snapshotAt,
}: BuildProcessRowsOptions) => {
  const formatProcessDisplayName = (
    executablePath?: Nullable<string>,
    pid?: Nullable<number>,
  ) => {
    const executableName = getProcessFileName(executablePath);
    if (pid !== null && pid !== undefined) {
      return `${executableName} (PID ${pid})`;
    }
    return executableName;
  };

  const snapshotCutoff = computed(() => {
    if (!snapshotAt.value) { return null; }
    const timestamp = new Date(String(snapshotAt.value)).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  });

  const isBeforeSnapshot = (value?: string | null) => {
    if (snapshotCutoff.value === null) { return true; }
    if (!value) { return true; }
    return resolveProcessTimestamp(value) <= snapshotCutoff.value;
  };

  const buildProcessLabel = (processVersion?: Partial<AnalysisDiagramProcessVersion> | null) => {
    return formatProcessDisplayName(processVersion?.executablePath, processVersion?.pid);
  };

  const matchesFileScope = (fileId: number) => {
    if (!selectedSourceId.value) { return true; }
    const sourceIds = filesById.value[String(fileId)]?.sourceIds || [];
    return sourceIds.includes(selectedSourceId.value);
  };

  const toProcessEventSeed = (
    operation: AnalysisDiagramOperation,
    eventType: ProcessEventType,
    processVersionsById: Map<number, AnalysisDiagramProcessVersion>,
    fileVersionsById: Map<number, AnalysisDiagramFileVersion>,
  ): ProcessEventSeed | null => {
    const processVersionId = Number(operation.processVersionId);
    const fileId = Number(operation.fileId);
    const processVersion = processVersionsById.get(processVersionId);
    const processId = Number(processVersion?.processId ?? operation.processId);
    if (
      !Number.isFinite(processVersionId)
      || !Number.isFinite(processId)
      || !Number.isFinite(fileId)
      || !isBeforeSnapshot(operation.firstAt)
      || !matchesFileScope(fileId)
    ) {
      return null;
    }

    const file = filesById.value[String(fileId)];
    const versionNumber = operation.fileVersionId !== null && operation.fileVersionId !== undefined
      ? fileVersionsById.get(Number(operation.fileVersionId))?.versionNumber ?? null
      : null;
    const path = file?.path || `file_${fileId}`;

    return {
      processId,
      processVersionId,
      processLabel: buildProcessLabel(processVersion),
      executablePath: processVersion?.executablePath || null,
      pid: processVersion?.pid ?? null,
      user: processVersion?.username || null,
      uid: processVersion?.uid ?? null,
      processCreatedAt: processVersion?.createdAt || operation.firstAt,
      fileId,
      fileName: file?.name || getProcessFileName(path),
      path,
      filesystemUuid: file?.filesystemUuid || null,
      versionNumber,
      eventAt: operation.firstAt,
      eventType,
    };
  };

  return computed<ProcessEventRow[]>(() => {
    if (!report.value) { return []; }

    const processVersionsById = new Map<number, AnalysisDiagramProcessVersion>(
      (report.value.diagramData.processVersions || [])
        .map((item) => [Number(item.processVersionId), item] as const)
        .filter(([key]) => Number.isFinite(key)),
    );
    const fileVersionsById = new Map<number, AnalysisDiagramFileVersion>(
      (report.value.diagramData.fileVersions || [])
        .map((item) => [Number(item.fileVersionId), item] as const)
        .filter(([key]) => Number.isFinite(key)),
    );

    const readsByProcess = new Map<number, ProcessEventSeed[]>();
    const writesByProcess = new Map<number, ProcessEventSeed[]>();

    for (const operation of report.value.diagramData.reads || []) {
      const seed = toProcessEventSeed(operation, "READ", processVersionsById, fileVersionsById);
      if (!seed) { continue; }
      const items = readsByProcess.get(seed.processId) || [];
      items.push(seed);
      readsByProcess.set(seed.processId, items);
    }

    for (const operation of report.value.diagramData.writes || []) {
      const seed = toProcessEventSeed(operation, "WRITE", processVersionsById, fileVersionsById);
      if (!seed) { continue; }
      const items = writesByProcess.get(seed.processId) || [];
      items.push(seed);
      writesByProcess.set(seed.processId, items);
    }

    const rows: ProcessEventRow[] = [];

    for (const [processId, writeSeeds] of writesByProcess.entries()) {
      const sortedWrites = [...writeSeeds].sort((first, second) =>
        resolveProcessTimestamp(first.eventAt) - resolveProcessTimestamp(second.eventAt),
      );
      const sortedReads = [...(readsByProcess.get(processId) || [])].sort((first, second) =>
        resolveProcessTimestamp(first.eventAt) - resolveProcessTimestamp(second.eventAt),
      );

      let readIndex = 0;

      sortedWrites.forEach((writeSeed, writeIndex) => {
        const assignedReads: ProcessEventSeed[] = [];
        const writeTimestamp = resolveProcessTimestamp(writeSeed.eventAt);

        while (readIndex < sortedReads.length && resolveProcessTimestamp(sortedReads[readIndex].eventAt) <= writeTimestamp) {
          assignedReads.push(sortedReads[readIndex]);
          readIndex += 1;
        }

        const processGroupKey = buildProcessGroupKey(
          writeSeed.processVersionId,
          writeSeed.eventAt,
          writeSeed.fileId,
          writeIndex,
        );
        const groupEvents = [...assignedReads, writeSeed].sort((first, second) => {
          const timestampDelta = resolveProcessTimestamp(second.eventAt) - resolveProcessTimestamp(first.eventAt);
          if (timestampDelta !== 0) {
            return timestampDelta;
          }

          if (first.eventType !== second.eventType) {
            return first.eventType === "WRITE" ? -1 : 1;
          }

          return String(first.fileName || "").localeCompare(String(second.fileName || ""), "ru", {
            numeric: true,
            sensitivity: "base",
          });
        });

        groupEvents.forEach((event, eventIndex) => {
          rows.push({
            id: `${processGroupKey}:${event.eventType}:${event.fileId}:${eventIndex}`,
            rowKind: "EVENT",
            processBucketKey: String(event.processId),
            processId: event.processId,
            processGroupKey,
            processVersionId: event.processVersionId,
            processLabel: event.processLabel,
            executablePath: event.executablePath,
            pid: event.pid,
            user: event.user,
            uid: event.uid,
            processCreatedAt: event.processCreatedAt,
            writeAt: writeSeed.eventAt,
            writeFileId: writeSeed.fileId,
            writeFileName: writeSeed.fileName,
            writePath: writeSeed.path,
            writeFilesystemUuid: writeSeed.filesystemUuid,
            eventType: event.eventType,
            eventAt: event.eventAt,
            fileId: event.fileId,
            fileName: event.fileName,
            path: event.path,
            filesystemUuid: event.filesystemUuid,
            versionNumber: event.versionNumber,
          });
        });
      });
    }

    return rows.sort((first, second) => {
      const groupDelta = first.processGroupKey.localeCompare(second.processGroupKey);
      if (groupDelta !== 0) {
        return groupDelta;
      }

      const timestampDelta = resolveProcessTimestamp(second.eventAt) - resolveProcessTimestamp(first.eventAt);
      if (timestampDelta !== 0) {
        return timestampDelta;
      }

      if (first.eventType !== second.eventType) {
        return first.eventType === "WRITE" ? -1 : 1;
      }

      return String(first.fileName || "").localeCompare(String(second.fileName || ""), "ru", {
        numeric: true,
        sensitivity: "base",
      });
    });
  });
};
