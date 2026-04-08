export type Nullable<T> = T | null;
export type {
  MonitoringAction,
  UpdateMonitoringStatusResult,
} from "@/shared/api/contracts";
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
export type AnalysisOperationType = "READ" | "WRITE";
export type AnalysisFileEventKind = "RENAME" | "MOVE" | "MOVE_RENAME" | "DELETE";

export interface AnalysisFileLink {
  id: number;
  fileId: number;
  name: string;
  path: string;
}

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

export interface AnalysisOperationItem {
  id: string;
  type: AnalysisOperationType;
  timestamp: string;
  fileId: number;
  fileName: string;
  path: string;
  inode: Nullable<number>;
  fileVersionNumber: Nullable<number>;
  processName: string;
  processVersionId: Nullable<number>;
  processVersionNumber: Nullable<number>;
  processLabel: string;
  originFileName: string;
  originFilePath: Nullable<string>;
  fileStatus: Nullable<string>;
  depth: Nullable<number>;
  user: Nullable<string>;
  count: number;
  sizeBytes: Nullable<number>;
  trackingStartedAt: Nullable<string>;
  statusTime: Nullable<string>;
  sourceIds: number[];
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
