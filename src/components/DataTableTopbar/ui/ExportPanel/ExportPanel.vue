<template>
  <div class="compact-data-table__export-panel">
    <slot name="toolbar-actions" />
    <UiButton
      :variant="isColumnsPanelOpen ? 'primary' : 'secondary'"
      size="medium"
      @click="toggleColumnsPanel"
    >
      <span class="pi pi-sliders-h" />
      <span> Колонки </span>
    </UiButton>
    <UiButton
      v-for="action in exportActions"
      :key="action.format"
      :variant="action.primary ? 'primary' : 'secondary'"
      :disabled="isExporting !== null"
      @click="handleExport(action.format)"
    >
      <span class="pi" :class="action.icon" />
      <span>
        {{ isExporting === action.format ? action.pendingLabel : action.label }}
      </span>
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from "@/components/UiButton";
import {
  ExportAction,
  ExportFormat,
} from "@/components/DataTable/types/data-table.types";

interface Props {
  isColumnsPanelOpen?: boolean;
  isExporting: ExportFormat | null;
}

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

defineProps<Props>();

const emit = defineEmits<{
  (e: `toggle-columns-panel`): void;
  (e: `export`, format: ExportFormat): void;
}>();

const toggleColumnsPanel = () => {
  emit(`toggle-columns-panel`);
};

const handleExport = (format: ExportFormat) => {
  emit(`export`, format);
};
</script>

<style scoped src="./styles.css"></style>
