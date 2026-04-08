import type { Header } from "@/common-components/src/components/DataTable";

export const PROCESS_GROUP_MAX_TS = 9999999999999;

export const processHeaders: Header[] = [
  { text: "Событие", value: "eventType", align: "start", sortable: true, isVisible: true, width: 120 },
  { text: "Файл", value: "fileName", align: "start", sortable: true, isVisible: true, width: 220, wrap: true },
  { text: "UUID файловой системы", value: "filesystemUuid", align: "start", sortable: true, isVisible: true, width: 180 },
  { text: "Версия файла", value: "versionNumber", align: "start", sortable: true, isVisible: true, width: 104 },
  { text: "Время события", value: "eventAt", align: "start", sortable: true, isVisible: true, width: 170 },
  { text: "Путь", value: "path", align: "start", sortable: true, isVisible: true, width: 340 },
];

export const processExportHeaders = [
  "Тип записи",
  "Процесс",
  "PID",
  "UID",
  "Пользователь",
  "PV",
  "Создан",
  "Путь процесса",
  "Файл записи",
  "Время записи",
  "Событие",
  "Файл",
  "UUID файловой системы",
  "Версия файла",
  "Время события",
  "Путь файла",
];
