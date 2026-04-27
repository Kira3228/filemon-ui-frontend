import { Header } from "@/components/DataTable";
import { AnalysisSourceItem } from "@/services/source/source.types";

export const headers: Header<AnalysisSourceItem>[] = [
  {
    text: "Файл",
    value: "name",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 240,
    wrap: true,
    filterBy: ["name", "path"],
    exportValue: (item: AnalysisSourceItem) =>
      `${item.name || "—"} | ${item.path || "—"}`,
  },
  {
    text: "Файловая система",
    value: "filesystem",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 180,
    filterBy: ["filesystem", "filesystemUuid"],
    exportValue: (item: AnalysisSourceItem) =>
      item.filesystemUuid || "—",
  },
  {
    text: "Процессов",
    value: "processes",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 92,
    exportValue: (item: AnalysisSourceItem) =>
      item.stats?.processes ?? 0,
  },
  {
    text: "Порождено",
    value: "producedFiles",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 92,
    exportValue: (item: AnalysisSourceItem) =>
      item.stats?.producedFiles ?? 0,
  },
  {
    text: "Глубина",
    value: "maxDepth",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 84,
    exportValue: (item: AnalysisSourceItem) =>
      item.stats?.maxDepth ?? 0,
  },
  {
    text: "Чтений",
    value: "readOps",
    align: "start",
    sortable: true,
    isVisible: true,
    width: 84,
    exportValue: (item: AnalysisSourceItem) =>
      item.stats?.readOps ?? 0,
  },
];