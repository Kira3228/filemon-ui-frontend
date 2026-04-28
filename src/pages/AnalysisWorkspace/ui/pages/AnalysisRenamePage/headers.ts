import { Header } from "@/components/DataTable";
import { AnalysisRenameHistoryItem } from "@/pages/AnalysisWorkspace/model/analysis-report.types";
import { getAnalysisEventTypeLabel } from "@/pages/AnalysisWorkspace/model/analysis-workspace.presentation";
import { formatAnalysisTimestamp } from "@/shared/utils/format-analysis-timestamp";

export const headers: Header<AnalysisRenameHistoryItem>[] = [
  {
    text: "Время",
    value: "createdAt",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: (item: AnalysisRenameHistoryItem) =>
      formatAnalysisTimestamp(item.createdAt),
  },
  {
    text: "Тип",
    value: "eventType",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 100,
    exportValue: (item: AnalysisRenameHistoryItem) =>
      getAnalysisEventTypeLabel(item.eventType),
  },
  {
    text: "Файл",
    value: "fileName",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 120,
  },
  {
    text: "Старый путь",
    value: "oldPath",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 250,
  },
  {
    text: "Новый путь",
    value: "newPath",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 250,
  },
  {
    text: "Детали (JSON)",
    value: "details",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 240,
    exportValue: (item: AnalysisRenameHistoryItem) =>
      JSON.stringify(item.details),
  },
];
