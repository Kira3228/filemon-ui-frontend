import { computed } from "vue";
import type { ComputedRef, Ref } from "vue";
import { buildProcessGroupKey, getProcessFileName, resolveProcessTimestamp } from "./analysis-processes-table.helpers";
import type { Nullable } from "./analysis-report.types";
import { AnalysisFileItem } from "@/services/files/file.types";
import { AnalysisOperationItem } from "@/services/operations/analysis-operation-item.type";
import { ProcessEventRow, ProcessEventType } from "@/services/process/process.type";

interface ProcessEventSeed {
  operationId: string;
  processId: number;
  processVersionId: Nullable<number>;
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

interface BuildProcessRowsOptions {
  filesById: ComputedRef<Record<string, AnalysisFileItem>>;
  processesData: ComputedRef<AnalysisOperationItem[]>;
  selectedSourceId: Ref<number | null>;
  snapshotAt: Ref<string>;
}

const buildFallbackProcessId = (operation: AnalysisOperationItem) => {
  const source = operation.processLabel || operation.processName || "unknown";
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(index);
    hash |= 0;
  }

  return -(Math.abs(hash) || 1);
};

export const createProcessRows = ({
  filesById,
  processesData,
  selectedSourceId,
  snapshotAt,
}: BuildProcessRowsOptions) => {

  const formatProcessDisplayName = (
    processLabel?: Nullable<string>,
    processName?: Nullable<string>,
  ) => {
    const label = String(processLabel || processName || "").trim();
    return label || getProcessFileName(processName);
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

  const matchesFileScope = (operation: AnalysisOperationItem) => {
    if (!selectedSourceId.value) { return true; }
    const sourceIds = operation.sourceIds?.length
      ? operation.sourceIds
      : filesById.value[String(operation.fileId)]?.sourceIds || [];
    return sourceIds.includes(selectedSourceId.value);
  };

  const toProcessEventSeed = (operation: AnalysisOperationItem): ProcessEventSeed | null => {
    const fileId = Number(operation.fileId);
    const processVersionId = operation.processVersionId === null || operation.processVersionId === undefined
      ? null
      : Number(operation.processVersionId);
    const processId = Number.isFinite(processVersionId)
      ? Number(processVersionId)
      : buildFallbackProcessId(operation);

    if (
      !Number.isFinite(fileId)
      || !Number.isFinite(processId)
      || !isBeforeSnapshot(operation.timestamp)
      || !matchesFileScope(operation)
    ) {
      return null;
    }

    const file = filesById.value[String(fileId)];
    const path = operation.path || file?.path || `file_${fileId}`;

    return {
      operationId: operation.id,
      processId,
      processVersionId,
      processLabel: formatProcessDisplayName(operation.processLabel, operation.processName),
      executablePath: operation.processName || null,
      pid: null,
      user: operation.user || null,
      uid: null,
      processCreatedAt: null,
      fileId,
      fileName: operation.fileName || file?.name || getProcessFileName(path),
      path,
      filesystemUuid: file?.filesystemUuid || null,
      versionNumber: operation.fileVersionNumber,
      eventAt: operation.timestamp,
      eventType: operation.type,
    };
  };

  return computed<ProcessEventRow[]>(() => {
    const readsByProcess = new Map<number, ProcessEventSeed[]>();
    const writesByProcess = new Map<number, ProcessEventSeed[]>();

    for (const operation of processesData.value || []) {
      const seed = toProcessEventSeed(operation);
      if (!seed) { continue; }

      const bucket = seed.eventType === "READ" ? readsByProcess : writesByProcess;
      const items = bucket.get(seed.processId) || [];
      items.push(seed);
      bucket.set(seed.processId, items);
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
          writeSeed.processId,
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
            id: `${processGroupKey}:${event.operationId}:${event.eventType}:${event.fileId}:${eventIndex}`,
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
