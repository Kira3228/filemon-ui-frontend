import { Header } from "@/components/DataTable";
import { AnalysisStatusHistoryItem } from "@/services/status/status.type";
import { formatAnalysisTimestamp } from "@/shared/utils/format-analysis-timestamp";

export const headers: Header<AnalysisStatusHistoryItem>[] = [
  {
    text: "Файл",
    value: "fileName",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 120,
  },
  {
    text: "Путь",
    value: "path",
    align: "start",
    sortable: false,
    isVisible: true,
    width: 320,
  },
  {
    text: "UUID файловой системы",
    value: "filesystemUuid",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 180,
  },
  {
    text: "Статус",
    value: "status",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 120,
  },
  {
    text: "Источник",
    value: "changeSource",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 140,
    exportValue: (item: AnalysisStatusHistoryItem) =>
      item.changeSource === "MANUAL" ? "Ручное изменение" : "Системное изменение",
  },
  {
    text: "Время",
    value: "createdAt",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 150,
    exportValue: (item: AnalysisStatusHistoryItem) =>
      formatAnalysisTimestamp(item.createdAt),
  },
];