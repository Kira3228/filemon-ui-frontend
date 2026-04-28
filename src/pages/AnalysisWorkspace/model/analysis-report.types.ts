import { AnalysisFileItem } from "@/services/files/file.types";
import { AnalysisOperationItem } from "@/services/operations/analysis-operation-item.type";
import { AnalysisProcessReadFile, AnalysisProcessReadGroup } from "@/services/process/process.type";
import { AnalysisFileEventKind } from "@/services/rename/rename-history.type";
import { AnalysisSourceItem } from "@/services/source/source.types";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";

export type Nullable<T> = T | null;
export type {
  MonitoringAction,
  UpdateMonitoringStatusResult,
} from "@/shared/api/contracts";

export type AnalysisOperationType = "READ" | "WRITE";


export interface AnalysisFileLink {
  id: number;
  fileId: number;
  name: string;
  path: string;
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

export interface AnalysisRenameHistoryItem {
  id: number;
  fileId: number;
  fileName: string;
  eventType: Exclude<AnalysisFileEventKind, "DELETE">;
  eventLabel: string;
  oldPath: Nullable<string>;
  newPath: Nullable<string>;
  outOfScope: boolean;
  createdAt: string;
  sourceIds: number[];
  details: Record<string, unknown>;
}







export interface AnalysisChainProcessEvent {
  processVersionId: Nullable<number>;
  label: string;
  count: number;
  firstAt: string;
  lastAt: Nullable<string>;
}

export interface AnalysisChainVersion {
  id: number;
  versionNumber: number;
  depth: number;
  createdAt: string;
  processVersionId: Nullable<number>;
  createdBy: string;
  originFileId: Nullable<number>;
  originFileName: string;
}

export interface AnalysisChainEntry {
  fileId: number;
  name: string;
  path: string;
  sourceIds: number[];
  sourceLabels: AnalysisFileLink[];
  parents: AnalysisFileLink[];
  children: AnalysisFileLink[];
  readers: AnalysisChainProcessEvent[];
  writes: AnalysisChainProcessEvent[];
  versions: AnalysisChainVersion[];
}

export interface AnalysisDiagramFileVersion {
  id: number;
  fileVersionId: number;
  fileId: number;
  versionNumber: number;
  depth: number;
  createdAt: string;
  originProcessVersionId: Nullable<number>;
  processId: Nullable<number>;
  processVersionNumber: Nullable<number>;
  processVersionCreatedAt: Nullable<string>;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  originFileId: Nullable<number>;
  originFilePath: Nullable<string>;
}

export interface AnalysisDiagramProcessVersion {
  id: number;
  processVersionId: number;
  processId: Nullable<number>;
  versionNumber: Nullable<number>;
  createdAt: Nullable<string>;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  originFileId: Nullable<number>;
  originFilePath: Nullable<string>;
}

export interface AnalysisDiagramOperation {
  fileId: number;
  fileVersionId: Nullable<number>;
  processVersionId: Nullable<number>;
  processId: Nullable<number>;
  firstAt: string;
  lastAt: Nullable<string>;
  count: number;
}

export interface AnalysisDiagramData {
  fileVersions: AnalysisDiagramFileVersion[];
  processVersions: AnalysisDiagramProcessVersion[];
  reads: AnalysisDiagramOperation[];
  writes: AnalysisDiagramOperation[];
}

export interface AnalysisReportCapabilities {
  hasFileEvents: boolean;
  hasFileStatuses: boolean;
  hasDiagram: boolean;
}

export interface AnalysisReportOverview {
  files: number;
  fileVersions: number;
  sources: number;
  maxDepth: number;
  reads: number;
  writes: number;
}

export interface AnalysisReportResult {
  generatedAt: string;
  capabilities: AnalysisReportCapabilities;
  overview: AnalysisReportOverview;
  sources: AnalysisSourceItem[];
  timeline: AnalysisTimelineEntry[];
  files: AnalysisFileItem[];
  statusHistory: AnalysisStatusHistoryItem[];
  renameHistory: AnalysisRenameHistoryItem[];
  processReads: AnalysisProcessReadGroup[];
  operations: AnalysisOperationItem[];
  diagramData: AnalysisDiagramData;
  chains: Record<string, AnalysisChainEntry>;
  notices: string[];
}

export interface AnalysisItemWithSourceIds {
  sourceIds?: number[];
}

export interface AnalysisItemWithTimestamps extends AnalysisItemWithSourceIds {
  timestamp?: Nullable<string>;
  createdAt?: Nullable<string>;
  trackingStartedAt?: Nullable<string>;
  birthTime?: Nullable<string>;
  lastStatusAt?: Nullable<string>;
}

export interface AnalysisProcessReadView extends AnalysisProcessReadGroup {
  label: string;
  files: AnalysisProcessReadFile[];
}

export interface AnalysisSourceColumnItem extends AnalysisFileItem {
  chain: AnalysisChainEntry;
  childIds: number[];
}

export type AnalysisSourceColumns = AnalysisSourceColumnItem[][];
