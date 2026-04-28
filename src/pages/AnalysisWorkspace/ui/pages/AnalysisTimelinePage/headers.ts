import { Header } from "@/components/DataTable";
import { AnalysisTimelineEntry } from "@/services/timeline/timeline.types";
import { formatAnalysisTimestamp } from "@/shared/utils/format-analysis-timestamp";
import { getAnalysisEventTypeLabel } from "../../../model/analysis-workspace.presentation";

export const headers: Header<AnalysisTimelineEntry>[] = [
  {
    text: "#",
    value: "index",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 50,
  },
  {
    text: "Время",
    value: "timestamp",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 140,
    exportValue: (item: AnalysisTimelineEntry) =>
      formatAnalysisTimestamp(item.timestamp),
  },
  {
    text: "Тип",
    value: "type",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 90,
    exportValue: (item: AnalysisTimelineEntry) =>
      getAnalysisEventTypeLabel(item.type),
  },
  {
    text: "Файл / процесс",
    value: "entity",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 180,
    filterBy: ["fileName", "processLabel"],
    exportValue: (item: AnalysisTimelineEntry) =>
      item.fileName || item.processLabel || "—",
  },
  {
    text: "Статус",
    value: "fileStatus",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 130,
    exportValue: (item: AnalysisTimelineEntry) =>
      item.fileStatus || "—",
  },
  {
    text: "Описание",
    value: "details",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 420,
  },
];