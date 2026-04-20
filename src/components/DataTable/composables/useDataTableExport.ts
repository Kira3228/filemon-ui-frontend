import { computed, ComputedRef, ref } from "vue";
import { Header } from "../types/header.type";
import { API_BASE_URL, ExportAction, ExportFormat, ExportHeader } from "../types/data-table.types";
import { resolveExportValue, sanitizeFileName, stringifyExportValue } from "../utils/data-table.utils";

type UseDataTableExportOptions = {
  customExportHeaders: ComputedRef<string[] | undefined>;
  customExportRows: ComputedRef<Array<Array<unknown>> | undefined>;
  customExportRowKinds: ComputedRef<string[] | undefined>;
  exportTitleInput: ComputedRef<string | undefined>;
  filteredRowsCount: ComputedRef<number>;
  sortedItems: ComputedRef<unknown[]>;
  visibleHeaders: ComputedRef<Header[]>;
};

const exportActions: ExportAction[] = [
  {
    format: "csv",
    label: "Экспорт CSV",
    pendingLabel: "Экспорт CSV...",
    icon: "pi-download",
    primary: false,
  },
  {
    format: "pdf",
    label: "Экспорт PDF",
    pendingLabel: "Экспорт PDF...",
    icon: "pi-file-pdf",
    primary: true,
  },
];

export const useDataTableExport = ({
  customExportHeaders,
  customExportRows,
  customExportRowKinds,
  exportTitleInput,
  filteredRowsCount,
  sortedItems,
  visibleHeaders,
}: UseDataTableExportOptions) => {
  const isExporting = ref<ExportFormat | null>(null);
  const exportError = ref("");

  const exportHeaders = computed<ExportHeader[]>(() => {
    if (customExportHeaders.value?.length) {
      return customExportHeaders.value.map((header, index) => ({
        text: String(header ?? ""),
        value: `custom-export-${index}`,
      }));
    }

    const allowedHeaders = visibleHeaders.value.filter((header) => header.exportable !== false);
    return allowedHeaders.length ? allowedHeaders : visibleHeaders.value;
  });

  const exportTitle = computed(() => {
    const fallback = typeof document !== "undefined" && document.title ? document.title : "table";
    return String(exportTitleInput.value || fallback || "table");
  });

  const exportRows = computed(() => {
    if (customExportRows.value?.length) {
      return customExportRows.value.map((row) =>
        exportHeaders.value.map((_, index) =>
          stringifyExportValue(row?.[index]),
        ),
      );
    }

    return sortedItems.value.map((item) =>
      exportHeaders.value.map((header) =>
        stringifyExportValue(resolveExportValue(item, header as Header)),
      ),
    );
  });

  const exportRowKinds = computed(() => {
    if (!customExportRows.value?.length) { return []; }
    return Array.isArray(customExportRowKinds.value)
      ? customExportRowKinds.value.map((kind) => String(kind || ""))
      : [];
  });

  const isExportEnabled = computed(() => exportHeaders.value.length > 0);

  const createCsvBlob = () => {
    const escapeCell = (value: string) => {
      if (/[;"\r\n]/.test(value)) {
        return `"${value.replace(/"/g, `""`)}"`;
      }

      return value;
    };

    const lines = [
      exportHeaders.value.map((header) => header.text),
      ...exportRows.value,
    ].map((row) => row.map((cell) => escapeCell(cell)).join(";"));

    return new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  };

  const triggerBlobDownload = (blob: Blob, extension: string) => {
    const fileName = `${sanitizeFileName(exportTitle.value)}.${extension}`;

    const legacyNavigator = window.navigator as Navigator & {
      msSaveOrOpenBlob?: (downloadBlob: Blob, defaultName?: string) => boolean;
    };

    if (typeof legacyNavigator.msSaveOrOpenBlob === "function") {
      legacyNavigator.msSaveOrOpenBlob(blob, fileName);
      return;
    }

    const href = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);

    window.setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(href);
      }, 1000);
    }, 0);
  };

  const exportPdf = async () => {
    const response = await fetch(`${API_BASE_URL}/analysis/export-table`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: exportTitle.value,
        format: "pdf",
        headers: exportHeaders.value.map((header) => header.text),
        rows: exportRows.value,
        rowKinds: exportRowKinds.value,
      }),
    });

    if (!response.ok) {
      let details = "";

      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const body = await response.json();
          details = body?.message || body?.error || "";
        } else {
          details = await response.text();
        }
      } catch (error) {
        details = "";
      }

      throw new Error(details || `PDF export failed: ${response.status}`);
    }

    const blob = await response.blob();
    triggerBlobDownload(blob, "pdf");
  };

  const handleExport = async (format: ExportFormat) => {
    if (isExporting.value !== null) { return; }

    if (!isExportEnabled.value) {
      exportError.value = "Для этой таблицы нет доступных колонок для выгрузки";
      return;
    }

    if (!filteredRowsCount.value) {
      exportError.value = "Нет данных для выгрузки по текущему фильтру";
      return;
    }

    exportError.value = "";
    isExporting.value = format;

    try {
      if (format === "csv") {
        triggerBlobDownload(createCsvBlob(), "csv");
      } else {
        await exportPdf();
      }
    } catch (error) {
      exportError.value = error instanceof Error ? error.message : "Не удалось выгрузить таблицу";
      console.error(error);
    } finally {
      isExporting.value = null;
    }
  };

  return {
    exportActions,
    exportError,
    exportHeaders,
    exportRowKinds,
    exportRows,
    exportTitle,
    handleExport,
    isExportEnabled,
    isExporting,
  };
};
