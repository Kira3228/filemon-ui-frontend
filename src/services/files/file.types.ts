import { Nullable } from "@/types/nullable";

export interface AnalysisFileItem {
  id: number;
  fileId: number;
  name: string;
  path: string;
  pathHistory: string[];
  filesystem: Nullable<string>;
  filesystemUuid: Nullable<string>;
  sizeBytes: Nullable<number>;
  versionCount: number;
  depth: number;
  parents: AnalysisFileLink[];
  sourceIds: number[];
  sourceLabels: AnalysisFileLink[];
  originProcess: string;
  user: string;
  currentStatusCode: number;
  currentStatus: string;
  trackingStartedAt: string;
  birthTime: Nullable<string>;
  lastStatusAt: Nullable<string>;
  inode: Nullable<number>;
}

export interface AnalysisFileLink {
  id: number;
  fileId: number;
  name: string;
  path: string;
}