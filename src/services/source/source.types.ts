import { AnalysisFileItem } from "@/pages/AnalysisWorkspace/model/analysis-report.types";
import { Nullable } from "@/types/nullable";


export interface AnalysisSourceItem {
  id: number;
  fileId: number;
  name: string;
  path: string;
  filesystemUuid: Nullable<string>;
  trackingStartedAt: string;
  sourceIds: number[];
  stats: AnalysisSourceStats;
  readers: AnalysisSourceReader[];
  produced: AnalysisFileItem[];
}



export interface AnalysisSourceReader {
  processVersionId: Nullable<number>;
  label: string;
  count: number;
  firstAt: string;
}


export interface AnalysisSourceStats {
  processes: number;
  producedFiles: number;
  maxDepth: number;
  readOps: number;
}