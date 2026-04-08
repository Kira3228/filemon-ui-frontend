<template>
  <div class="compact-data-table__columns-panel">
    <div class="compact-data-table__columns-header">
      <div>
        <div class="compact-data-table__columns-title">Настройка колонок</div>
        <div class="compact-data-table__columns-meta">
          Видно {{ visibleHeadersCount }} из {{ orderedHeaders.length }}
        </div>
      </div>
      <div class="compact-data-table__columns-actions">
        <button
          type="button"
          class="compact-data-table__panel-action-button"
          @click="$emit('auto-fit')"
        >
          <span class="pi pi-arrows-h" />
          <span>Автоподбор</span>
        </button>
        <button
          type="button"
          class="compact-data-table__panel-action-button"
          @click="$emit('reset')"
        >
          <span class="pi pi-refresh" />
          <span>Сбросить</span>
        </button>
        <button
          type="button"
          class="compact-data-table__panel-action-button compact-data-table__panel-action-button--primary"
          @click="$emit('close')"
        >
          <span class="pi pi-check" />
          <span>Готово</span>
        </button>
      </div>
    </div>
    <div class="compact-data-table__columns-list">
      <div
        v-for="(header, index) in orderedHeaders"
        :key="header.value"
        class="compact-data-table__column-row"
      >
        <label class="compact-data-table__column-visibility">
          <input
            type="checkbox"
            :checked="header.isVisible !== false"
            :disabled="header.isVisible !== false && visibleHeadersCount <= 1"
            @change="$emit('visibility-change', header.value, $event)"
          />
          <span class="compact-data-table__column-label">{{ header.text }}</span>
        </label>
        <div class="compact-data-table__column-controls">
          <label class="compact-data-table__column-width">
            <span>Ширина</span>
            <input
              type="number"
              min="60"
              max="1600"
              step="10"
              :value="header.width"
              @input="$emit('width-input', header.value, $event)"
            />
          </label>
          <div class="compact-data-table__column-order">
            <button
              type="button"
              class="compact-data-table__column-order-button"
              :disabled="index === 0"
              @click="$emit('move', header.value, -1)"
            >
              <span class="pi pi-arrow-up" />
            </button>
            <button
              type="button"
              class="compact-data-table__column-order-button"
              :disabled="index === orderedHeaders.length - 1"
              @click="$emit('move', header.value, 1)"
            >
              <span class="pi pi-arrow-down" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Header } from "../header.type";

defineProps<{
  orderedHeaders: Header[];
  visibleHeadersCount: number;
}>();

defineEmits<{
  (e: "auto-fit"): void;
  (e: "close"): void;
  (e: "move", value: string, delta: -1 | 1): void;
  (e: "reset"): void;
  (e: "visibility-change", value: string, event: Event): void;
  (e: "width-input", value: string, event: Event): void;
}>();
</script>

<style scoped>
.compact-data-table__columns-panel {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
  max-height: min(70vh, calc(100vh - 160px));
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 1rem;
  background: var(--dt-panel-bg);
  box-shadow: var(--dt-panel-shadow);
  overflow: hidden;
}

.compact-data-table__columns-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--app-border);
  background: var(--dt-panel-header-bg);
}

.compact-data-table__columns-title {
  font-size: 13px;
  font-weight: 700;
}

.compact-data-table__columns-meta {
  margin-top: 0.2rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__columns-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.compact-data-table__panel-action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: var(--dt-surface);
  color: var(--app-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 0.48rem 0.8rem;
  box-shadow: var(--dt-button-shadow);
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.compact-data-table__panel-action-button:hover:not(:disabled) {
  border-color: #2563eb;
  background: var(--app-surface-muted);
}

.compact-data-table__panel-action-button .pi {
  font-size: 0.8rem;
}

.compact-data-table__panel-action-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.compact-data-table__panel-action-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.compact-data-table__panel-action-button--primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.compact-data-table__columns-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
  overflow-y: auto;
  padding: 0.9rem 1rem 1rem;
}

.compact-data-table__column-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: 0.85rem;
  background: var(--dt-surface);
}

.compact-data-table__column-visibility {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.compact-data-table__column-visibility input {
  accent-color: #2563eb;
}

.compact-data-table__column-label {
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-data-table__column-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.compact-data-table__column-width {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__column-width input {
  width: 84px;
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  padding: 0.35rem 0.55rem;
  font-size: 12px;
  color: var(--app-text);
  background: var(--app-surface);
}

.compact-data-table__column-order {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.compact-data-table__column-order-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
}

.compact-data-table__column-order-button:disabled {
  opacity: 0.45;
  cursor: default;
}
</style>
