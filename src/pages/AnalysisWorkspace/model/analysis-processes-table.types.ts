import { ProcessEventRow } from "@/services/process/process.type";
import type { Nullable } from "./analysis-report.types";

export type { ProcessGroupRow, ProcessTableItem } from "@/services/process/process.type";



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
