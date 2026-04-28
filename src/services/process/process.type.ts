import { Nullable } from "@/types/nullable";

export interface AnalysisProcessReadGroup {
  processVersionId: Nullable<number>;
  label: string;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  user: Nullable<string>;
  uid: Nullable<number>;
  createdAt: string;
  sourceIds: number[];
  files: AnalysisProcessReadFile[];
}

export interface AnalysisProcessReadFile {
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  versionNumber: Nullable<number>;
  count: number;
  firstAt: string;
  lastAt: Nullable<string>;
}

export type ProcessTableItem = ProcessEventRow | ProcessGroupRow;

export interface ProcessEventRow extends BaseProcessTableItem {
  rowKind: "EVENT";
  eventType: ProcessEventType;
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

export type ProcessEventType = "READ" | "WRITE";
