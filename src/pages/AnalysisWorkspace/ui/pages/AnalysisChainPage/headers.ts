import type { Header } from "@/components/DataTable";
import type { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { formatAnalysisTimestamp } from "@/shared/utils/format-analysis-timestamp";
import type { CombinedHistoryEntry } from "../../../model/analysis-chain-page.model";
import type { AnalysisChainVersion } from "../../../model/analysis-report.types";

export const versionHeaders: Header<AnalysisChainVersion>[] = [
  {
    text: "Версия",
    value: "versionNumber",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
  },
  {
    text: "Глубина",
    value: "depth",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
  },
  {
    text: "Создана",
    value: "createdAt",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: (item) => formatAnalysisTimestamp(item.createdAt),
  },
  {
    text: "Кем создана",
    value: "createdBy",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 240,
  },
];

export const createTimelineHeaders = (
  eventTypeLabel: (type: string) => string,
): Header<AnalysisTimelineEntry>[] => [
  {
    text: "Время",
    value: "timestamp",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: (item) => formatAnalysisTimestamp(item.timestamp),
  },
  {
    text: "Тип",
    value: "type",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
    exportValue: (item) => eventTypeLabel(item.type),
  },
  {
    text: "Статус",
    value: "fileStatus",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 120,
  },
  {
    text: "Описание",
    value: "details",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 360,
  },
];

export const createHistoryHeaders = (
  eventTypeLabel: (type: string) => string,
  formatTs: (value?: string | null) => string,
): Header<CombinedHistoryEntry>[] => [
  {
    text: "Время",
    value: "ts",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: (item) => formatTs(item.ts),
  },
  {
    text: "Тип",
    value: "type",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
    exportValue: (item) => eventTypeLabel(item.type),
  },
  {
    text: "Описание",
    value: "label",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 360,
  },
];
