<template>
  <div class="compact-data-table__topbar">
    <div class="compact-data-table__topbar-meta">
      <slot name="select-preset" />
      <div v-if="hasActiveFilters" class="compact-data-table__active-filters">
        <span>Фильтры по столбцам активны</span>
      </div>
      <div v-if="shadowLoading" class="compact-data-table__shadow-state">
        Показано {{ displayedItems.length }} из {{ filteredItems.length }}
      </div>
      <div v-if="exportError" class="compact-data-table__export-error">
        {{ exportError }}
      </div>
    </div>
    <ExportPanel
      :is-columns-panel-open="isColumnsPanelOpen"
      :export-actions="exportActions"
      :is-exporting="isExporting"
      @toggle-columns-panel="emit('toggle-columns-panel')"
      @export="emit('export', $event)"
    >
      <template #toolbar-actions>
        <slot name="toolbar-actions" />
      </template>
    </ExportPanel>
  </div>
</template>

<script setup lang="ts">
import {
  ExportAction,
  ExportFormat,
} from "@/components/DataTable/types/data-table.types";
import ExportPanel from "./ExportPanel/ExportPanel.vue";

interface Props {
  hasActiveFilters?: boolean;
  shadowLoading?: boolean;
  displayedItems: unknown[];
  filteredItems: unknown[];
  exportError?: string | null;
  isColumnsPanelOpen?: boolean;
  exportActions: ExportAction[];
  isExporting: ExportFormat | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: `toggle-columns-panel`): void;
  (e: `export`, format: ExportFormat): void;
}>();
</script>

<style scoped>
.compact-data-table__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--dt-topbar-border);
  border-radius: 0.9rem;
  background: var(--dt-topbar-bg);
  box-shadow: var(--dt-topbar-shadow);
  position: sticky;
  top: 0;
  z-index: 6;
}

.compact-data-table__topbar-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: wrap;
}

.compact-data-table__active-filters {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__shadow-state {
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__export-error {
  font-size: 11px;
  color: #b91c1c;
}
</style>
