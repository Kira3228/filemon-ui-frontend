import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import type {
  AnalysisRenameHistoryItem,

} from "./analysis-report.types";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";
import { AnalysisFileEventKind } from "@/services/rename/rename-history.type";

export interface CombinedHistoryEntry {
  id: string;
  ts: string;
  type: "STATUS" | "MANUAL_STATUS_CHANGE" | Exclude<AnalysisFileEventKind, "DELETE">;
  label: string;
}

interface UseAnalysisChainPageModelOptions {
  eventTypeLabel: (type: string) => string;
  selectedFileRenameHistory: Ref<AnalysisRenameHistoryItem[]>;
  selectedFileStatusHistory: Ref<AnalysisStatusHistoryItem[]>;
  selectedFileTimeline: Ref<AnalysisTimelineEntry[]>;
}

export const useAnalysisChainPageModel = ({
  eventTypeLabel,
  selectedFileRenameHistory,
  selectedFileStatusHistory,
  selectedFileTimeline,
}: UseAnalysisChainPageModelOptions) => {


  const exportTimelineType = (item: AnalysisTimelineEntry) => eventTypeLabel(item.type);

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
    exportHistoryType,
    exportTimelineType,
    handleTimelineRowClick,
    selectedTimelineEvent,
    selectedTimelineEventId,
  };
};
