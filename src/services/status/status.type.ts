import { Nullable } from "@/types/nullable";

export interface AnalysisStatusHistoryItem {
  id: number;
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  status: string;
  createdAt: string;
  isManual: boolean;
  changeSource: "MANUAL" | "SYSTEM";
  manualAction: Nullable<string>;
  previousStatus: Nullable<string>;
  nextStatus: string;
  sourceIds: number[];
}