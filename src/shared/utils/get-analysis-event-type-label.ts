import { Nullable } from "@/types/nullable";


const eventTypeLabels: Record<string, string> = {
  READ: "Чтение",
  WRITE: "Запись",
  DELETE: "Удаление",
  SOURCE: "Источник",
  TRACKING: "Начало наблюдения",
  STATUS: "Статус",
  MANUAL_STATUS_CHANGE: "Ручная смена статуса",
  MOVE: "Перемещение",
  RENAME: "Переименование",
  MOVE_RENAME: "Перемещение и переименование",
  PROCESS: "Процесс",
  FILE_VERSION: "Версия файла",
  OUT_OF_SCOPE_MOVE: "Перемещение вне области наблюдения",
};

export const getAnalysisEventTypeLabel = (type?: Nullable<string>) => {
  if (!type) { return "—"; }
  return eventTypeLabels[type] || type;
};