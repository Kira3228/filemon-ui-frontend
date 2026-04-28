import { computed, ref, watch } from "vue";
import type { ComputedRef } from "vue";
import type {
  AnalysisChainVersion,
  AnalysisFileEventKind,
  AnalysisRenameHistoryItem,

} from "./analysis-report.types";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";

export interface CombinedHistoryEntry {
  id: string;
  ts: string;
  type: "STATUS" | "MANUAL_STATUS_CHANGE" | Exclude<AnalysisFileEventKind, "DELETE">;
  label: string;
}

interface UseAnalysisChainPageModelOptions {
  eventTypeLabel: (type: string) => string;
  formatTs: (value?: string | null) => string;
  selectedFileRenameHistory: ComputedRef<AnalysisRenameHistoryItem[]>;
  selectedFileStatusHistory: ComputedRef<AnalysisStatusHistoryItem[]>;
  selectedFileTimeline: ComputedRef<AnalysisTimelineEntry[]>;
}

export const useAnalysisChainPageModel = ({
  eventTypeLabel,
  formatTs,
  selectedFileRenameHistory,
  selectedFileStatusHistory,
  selectedFileTimeline,
}: UseAnalysisChainPageModelOptions) => {
  const exportVersionCreatedAt = (item: AnalysisChainVersion) => formatTs(item.createdAt);
  const exportTimelineTimestamp = (item: AnalysisTimelineEntry) => formatTs(item.timestamp);
  const exportTimelineType = (item: AnalysisTimelineEntry) => eventTypeLabel(item.type);
  const exportHistoryTimestamp = (item: CombinedHistoryEntry) => formatTs(item.ts);
  const exportHistoryType = (item: CombinedHistoryEntry) => eventTypeLabel(item.type);

  const selectedTimelineEventId = ref<string | null>(null);

  watch(selectedFileTimeline, (items) => {
    const current = selectedTimelineEventId.value
      ? items.find((item) => item.id === selectedTimelineEventId.value) || null
      : null;
    selectedTimelineEventId.value = current?.id || items[0]?.id || null;
  }, { immediate: true });

  const selectedTimelineEvent = computed<AnalysisTimelineEntry | null>(() =>
    selectedTimelineEventId.value
      ? selectedFileTimeline.value.find((item) => item.id === selectedTimelineEventId.value) || null
      : null,
  );

  const handleTimelineRowClick = (item: AnalysisTimelineEntry) => {
    selectedTimelineEventId.value = item.id;
  };

  const toCombinedStatusHistoryEntry = (item: AnalysisStatusHistoryItem): CombinedHistoryEntry => ({
    id: `status-${item.id}`,
    ts: item.createdAt,
    type: item.isManual ? "MANUAL_STATUS_CHANGE" : "STATUS",
    label: item.isManual
      ? `Ручная смена статуса: ${item.previousStatus} -> ${item.nextStatus} | ${item.path}`
      : `${item.status} | ${item.path}`,
  });

  const toCombinedRenameHistoryEntry = (item: AnalysisRenameHistoryItem): CombinedHistoryEntry => ({
    id: `rename-${item.id}`,
    ts: item.createdAt,
    type: item.eventType,
    label: `${item.oldPath} -> ${item.newPath}`,
  });

  const combinedHistory = computed<CombinedHistoryEntry[]>(() =>
    [
      ...selectedFileStatusHistory.value.map(toCombinedStatusHistoryEntry),
      ...selectedFileRenameHistory.value.map(toCombinedRenameHistoryEntry),
    ].sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || ""))),
  );

  return {
    combinedHistory,
    exportHistoryTimestamp,
    exportHistoryType,
    exportTimelineTimestamp,
    exportTimelineType,
    exportVersionCreatedAt,
    handleTimelineRowClick,
    selectedTimelineEvent,
    selectedTimelineEventId,
  };
};
