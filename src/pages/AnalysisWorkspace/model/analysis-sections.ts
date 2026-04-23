export type TAnalysisSectionKey =
  | "sources"
  | "sourcesTest"
  | "files"
  | "operations"
  | "timeline"
  | "statuses"
  | "rename"
  | "processes"
  | "graph"
  | "files-tree"
  | "propagation-diagram"
  | "settings";

export interface TAnalysisSection {
  key: TAnalysisSectionKey;
  label: string;
  to: string;
}

export const DEFAULT_ANALYSIS_SECTION_KEY: TAnalysisSectionKey = "sources";

export const analysisSections: TAnalysisSection[] = [
  { key: "sources", label: "Источники", to: "/analysis/sources" },
  { key: "sourcesTest", label: "ИсточникиTest", to: "/analysis/sourcesTest" },
  { key: "files", label: "Файлы", to: "/analysis/files" },
  { key: "operations", label: "Операции", to: "/analysis/operations" },
  { key: "timeline", label: "События", to: "/analysis/timeline" },
  { key: "statuses", label: "Статусы", to: "/analysis/statuses" },
  { key: "rename", label: "Перемещение/Переименоание", to: "/analysis/rename" },
  { key: "processes", label: "Процессы", to: "/analysis/processes" },
  { key: "graph", label: "Граф", to: "/analysis/graph" },
  { key: "files-tree", label: "Дерево файлов", to: "/analysis/files-tree" },
  { key: "propagation-diagram", label: "Диаграмма распространения от источников", to: "/analysis/propagation-diagram" },
  { key: "settings", label: "Настройки", to: "/analysis/settings" },
];

export const isAnalysisSectionKey = (value: unknown): value is TAnalysisSectionKey =>
  typeof value === "string" && analysisSections.some((section) => section.key === value);

export const getAnalysisSectionByKey = (key: string | null | undefined) =>
  analysisSections.find((section) => section.key === key) || null;

export const getAnalysisSectionByPath = (path: string | null | undefined) =>
  analysisSections.find((section) => section.to === path || path?.startsWith(`${section.to}/`)) || null;

export const normalizeAnalysisSectionKeys = (
  keys: readonly string[],
  fallbackKey: TAnalysisSectionKey = DEFAULT_ANALYSIS_SECTION_KEY,
) => {
  const uniqueKeys = new Set(keys.filter(isAnalysisSectionKey));
  if (!uniqueKeys.size) {
    uniqueKeys.add(fallbackKey);
  }

  return analysisSections
    .map((section) => section.key)
    .filter((key) => uniqueKeys.has(key));
};
