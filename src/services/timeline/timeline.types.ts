import { Nullable } from "@/types/nullable";

export interface AnalysisTimelineEntry {
  id: string;
  type: AnalysisTimelineType;
  timestamp: Nullable<string>;
  fileId: Nullable<number>;
  fileName: Nullable<string>;
  fileStatus: Nullable<string>;
  processVersionId: Nullable<number>;
  processLabel: Nullable<string>;
  details: string;
  sourceIds: number[];
  index: number;
}

export type AnalysisTimelineType =
  | "TRACKING"
  | "SOURCE"
  | "DELETE"
  | "STATUS"
  | "MANUAL_STATUS_CHANGE"
  | "RENAME"
  | "MOVE"
  | "MOVE_RENAME"
  | "FILE_VERSION"
  | "READ"
  | "WRITE"
  | "PROCESS";