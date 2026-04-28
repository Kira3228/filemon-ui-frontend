import {
  formatProcessMetaValue,
  formatProcessVersionNumber,
  resolveProcessTimestamp,
} from "./analysis-processes-table.helpers";
import type { Nullable } from "./analysis-report.types";
import type {
  ProcessBucket,
  ProcessGroup,
} from "./analysis-processes-table.types";
import { ProcessEventRow, ProcessGroupRow } from "@/services/process/process.type";

export const buildProcessGroups = (rows: ProcessEventRow[]) =>
  Object.values(rows.reduce((accumulator: Record<string, ProcessGroup>, row) => {
    if (!accumulator[row.processGroupKey]) {
      accumulator[row.processGroupKey] = {
        processId: row.processId,
        processGroupKey: row.processGroupKey,
        processVersionId: row.processVersionId,
        processLabel: row.processLabel,
        executablePath: row.executablePath,
        pid: row.pid,
        user: row.user,
        uid: row.uid,
        processCreatedAt: row.processCreatedAt,
        writeAt: row.writeAt,
        writeFileId: row.writeFileId,
        writeFileName: row.writeFileName,
        writePath: row.writePath,
        writeFilesystemUuid: row.writeFilesystemUuid,
        events: [],
        eventCount: 0,
        readCount: 0,
        writeCount: 0,
        filesystemCount: 0,
        versionCount: 0,
        firstEventAt: null,
        lastEventAt: null,
      };
    }

    const group = accumulator[row.processGroupKey];
    group.events.push(row);
    group.eventCount += 1;
    if (row.eventType === "READ") {
      group.readCount += 1;
    } else {
      group.writeCount += 1;
    }

    if (!group.firstEventAt || resolveProcessTimestamp(row.eventAt) < resolveProcessTimestamp(group.firstEventAt)) {
      group.firstEventAt = row.eventAt;
    }

    if (!group.lastEventAt || resolveProcessTimestamp(row.eventAt) > resolveProcessTimestamp(group.lastEventAt)) {
      group.lastEventAt = row.eventAt;
    }

    return accumulator;
  }, {} as Record<string, ProcessGroup>))
    .map((group) => {
      const filesystems = new Set(group.events.map((row) => row.filesystemUuid).filter(Boolean));
      const versions = new Set(group.events.map((row) => row.versionNumber).filter((value) => value !== null && value !== undefined));

      return {
        ...group,
        events: [...group.events].sort((first, second) => {
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
        }),
        filesystemCount: filesystems.size,
        versionCount: versions.size,
      };
    })
    .sort((first, second) => first.processGroupKey.localeCompare(second.processGroupKey));

const formatMaybeTs = (
  value: string | null | undefined,
  formatTs: (value?: Nullable<string>) => string,
) => (value ? formatTs(value) : "—");

export const buildProcessExportRows = (
  groups: ProcessGroup[],
  eventTypeLabel: (type?: Nullable<string>) => string,
  formatTs: (value?: Nullable<string>) => string,
) =>
  groups.flatMap((group, index) => {
    const rows = [
      [
        "Группа записи",
        formatProcessMetaValue(group.processLabel),
        formatProcessMetaValue(group.pid),
        formatProcessMetaValue(group.uid),
        formatProcessMetaValue(group.user),
        formatProcessMetaValue(group.processVersionId),
        formatMaybeTs(group.processCreatedAt, formatTs),
        formatProcessMetaValue(group.executablePath),
        formatProcessMetaValue(group.writeFileName),
        formatMaybeTs(group.writeAt, formatTs),
        `Событий: ${group.eventCount}`,
        `Чтений: ${group.readCount}`,
        `Записей: ${group.writeCount}`,
        `UUID ФС: ${group.filesystemCount}`,
        formatMaybeTs(group.lastEventAt, formatTs),
        formatProcessMetaValue(group.writePath),
      ],
      ...group.events.map((event) => ([
        "Событие",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        eventTypeLabel(event.eventType),
        formatProcessMetaValue(event.fileName),
        formatProcessMetaValue(event.filesystemUuid),
        formatProcessVersionNumber(event.versionNumber),
        formatMaybeTs(event.eventAt, formatTs),
        formatProcessMetaValue(event.path),
      ])),
    ];

    if (index < groups.length - 1) {
      rows.push(Array(16).fill(""));
    }

    return rows;
  });

export const buildProcessExportRowKinds = (groups: ProcessGroup[]) =>
  groups.flatMap((group, index) => {
    const rowKinds = [
      "process",
      ...group.events.map(() => "event"),
    ];

    if (index < groups.length - 1) {
      rowKinds.push("spacer");
    }

    return rowKinds;
  });

export const buildProcessBuckets = (groups: ProcessGroup[]) =>
  Object.values(groups.reduce((accumulator: Record<string, ProcessBucket>, group) => {
    const bucketKey = String(group.processId);
    if (!accumulator[bucketKey]) {
      accumulator[bucketKey] = {
        processBucketKey: bucketKey,
        processId: group.processId,
        processLabel: group.processLabel,
        executablePath: group.executablePath,
        pid: group.pid,
        user: group.user,
        uid: group.uid,
        groups: [],
        groupCount: 0,
        eventCount: 0,
      };
    }

    const bucket = accumulator[bucketKey];
    bucket.groups.push(group);
    bucket.groupCount += 1;
    bucket.eventCount += group.eventCount;
    return accumulator;
  }, {} as Record<string, ProcessBucket>))
    .map((bucket) => ({
      ...bucket,
      groups: [...bucket.groups].sort((first, second) => first.processGroupKey.localeCompare(second.processGroupKey)),
    }))
    .sort((first, second) => {
      const firstTs = first.groups[0]?.writeAt || null;
      const secondTs = second.groups[0]?.writeAt || null;
      return resolveProcessTimestamp(secondTs) - resolveProcessTimestamp(firstTs);
    });

export const buildProcessBucketSummary = (buckets: ProcessBucket[]) =>
  buckets.reduce((accumulator, bucket) => {
    accumulator[bucket.processBucketKey] = bucket;
    return accumulator;
  }, {} as Record<string, ProcessBucket>);

export const buildProcessGroupRow = (group: ProcessGroup): ProcessGroupRow => {
  const groupFileNames = Array.from(new Set(group.events.map((event) => event.fileName).filter(Boolean)));
  const groupPaths = Array.from(new Set(group.events.map((event) => event.path).filter(Boolean)));
  const groupFilesystems = Array.from(new Set(group.events.map((event) => event.filesystemUuid).filter(Boolean)));

  return {
    id: `${group.processGroupKey}:group`,
    rowKind: "GROUP",
    processBucketKey: String(group.processId),
    processId: group.processId,
    processGroupKey: group.processGroupKey,
    processVersionId: group.processVersionId,
    processLabel: group.processLabel,
    executablePath: group.executablePath,
    pid: group.pid,
    user: group.user,
    uid: group.uid,
    processCreatedAt: group.processCreatedAt,
    writeAt: group.writeAt,
    writeFileId: group.writeFileId,
    writeFileName: group.writeFileName,
    writePath: group.writePath,
    writeFilesystemUuid: group.writeFilesystemUuid,
    eventType: "WRITE",
    eventAt: group.writeAt,
    fileId: group.writeFileId,
    fileName: groupFileNames.join(" · ") || group.writeFileName,
    path: groupPaths.join(" · ") || group.writePath,
    filesystemUuid: groupFilesystems.join(" · ") || group.writeFilesystemUuid,
    versionNumber: null,
    eventCount: group.eventCount,
    readCount: group.readCount,
    writeCount: group.writeCount,
    firstEventAt: group.firstEventAt,
    lastEventAt: group.lastEventAt,
  };
};

export const buildProcessTableItems = (
  buckets: ProcessBucket[],
  expandedGroupKeys: string[],
) =>
  buckets.flatMap((bucket) =>
    bucket.groups.flatMap((group) => {
      const groupRow = buildProcessGroupRow(group);
      const visibleEvents = expandedGroupKeys.includes(group.processGroupKey)
        ? group.events
        : [];

      return [groupRow, ...visibleEvents];
    }),
  );

export const buildProcessGroupRowsByKey = (groups: ProcessGroup[]) =>
  groups.reduce((accumulator, group) => {
    accumulator[group.processGroupKey] = buildProcessGroupRow(group);
    return accumulator;
  }, {} as Record<string, ProcessGroupRow>);

export const buildProcessTableItemsById = (items: Array<ProcessEventRow | ProcessGroupRow>) =>
  items.reduce((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {} as Record<string, ProcessEventRow | ProcessGroupRow>);
