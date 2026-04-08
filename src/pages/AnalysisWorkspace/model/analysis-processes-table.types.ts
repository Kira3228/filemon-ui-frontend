import type { Nullable } from "./analysis-report.types";
import type { ProcessEventRow, ProcessEventType } from "./analysis-processes-table.rows";

export type { ProcessEventRow } from "./analysis-processes-table.rows";

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

export interface ProcessGroupRow extends BaseProcessTableItem {
  rowKind: "GROUP";
  eventType: "WRITE";
  eventCount: number;
  readCount: number;
  writeCount: number;
  firstEventAt: Nullable<string>;
  lastEventAt: Nullable<string>;
}

export type ProcessTableItem = ProcessEventRow | ProcessGroupRow;

export interface ProcessGroup {
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
  events: ProcessEventRow[];
  eventCount: number;
  readCount: number;
  writeCount: number;
  filesystemCount: number;
  versionCount: number;
  firstEventAt: Nullable<string>;
  lastEventAt: Nullable<string>;
}

export interface ProcessBucket {
  processBucketKey: string;
  processId: number;
  processLabel: string;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  user: Nullable<string>;
  uid: Nullable<number>;
  groups: ProcessGroup[];
  groupCount: number;
  eventCount: number;
}
