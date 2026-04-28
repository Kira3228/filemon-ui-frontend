import { AnalysisItemWithTimestamps } from "@/pages/AnalysisWorkspace/model/analysis-report.types";

export const getItemTimestamp = (item: AnalysisItemWithTimestamps) =>
  item.timestamp ||
  item.createdAt ||
  item.trackingStartedAt ||
  item.birthTime ||
  item.lastStatusAt ||
  null;

export const matchesSnapshot = (item: AnalysisItemWithTimestamps, snapshotAt?: string,) => {
  if (!snapshotAt) {
    return true;
  }
  const ts = getItemTimestamp(item);
  if (!ts) {
    return true;
  }
  const cutoff = new Date(snapshotAt).getTime();
  return new Date(ts).getTime() <= cutoff;
};

export const matchesSource = (
  item: { sourceIds?: number[] },
  selectedSourceId?: number | null,
) => {
  if (!selectedSourceId) { return true; }
  if (!Array.isArray(item.sourceIds)) { return false; }
  return item.sourceIds.includes(selectedSourceId);
};

export const matchesFilters = (
  item: AnalysisItemWithTimestamps & { sourceIds?: number[] },
  snapshotAt?: string,
  selectedSourceId?: number | null,
) => {
  return (
    matchesSnapshot(item, snapshotAt) &&
    matchesSource(item, selectedSourceId)
  );
};
