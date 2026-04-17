<template>
  <div
    v-if="header"
    class="compact-data-table__filter-menu"
    :style="menuStyle"
    @mousedown.stop
    @click.stop
  >
    <div class="compact-data-table__filter-menu-title">
      {{ header.text }}
    </div>
    <div class="compact-data-table__filter-modes">
      <UiButton variant="secondary" active size="medium">Список</UiButton>
      <UiButton variant="secondary" size="medium">Вхождение</UiButton>
      <button
        v-for="mode in availableModes"
        :key="mode"
        type="button"
        class="compact-data-table__filter-mode"
        :class="{
          'compact-data-table__filter-mode--active': activeMode === mode,
        }"
        @click="$emit('set-mode', mode)"
      >
        {{ filterModeLabels[mode] }}
      </button>
    </div>
    <template v-if="activeMode === 'select'">
      <input
        :value="filterSearch"
        type="text"
        class="compact-data-table__filter-search"
        placeholder="Поиск значений"
        @input="handleSearchInput"
      />
      <div class="compact-data-table__filter-actions">
        <button
          type="button"
          class="compact-data-table__filter-action"
          @click="$emit('select-all')"
        >
          Выделить все
        </button>
        <button
          type="button"
          class="compact-data-table__filter-action"
          @click="$emit('clear-draft')"
        >
          Снять все
        </button>
      </div>
      <div class="compact-data-table__filter-options">
        <label
          v-for="option in visibleOptions"
          :key="option.key"
          class="compact-data-table__filter-option"
        >
          <input
            type="checkbox"
            :checked="activeDraft.includes(option.key)"
            @change="$emit('toggle-option', option.key)"
          />
          <span class="compact-data-table__filter-option-label">{{
            option.label
          }}</span>
          <span class="compact-data-table__filter-option-count">{{
            option.count
          }}</span>
        </label>
        <div
          v-if="!visibleOptions.length"
          class="compact-data-table__filter-empty"
        >
          Нет значений
        </div>
      </div>
    </template>
    <template v-else-if="activeMode === 'contains'">
      <div class="compact-data-table__filter-hint">
        Оставляет строки, где значение содержит указанный фрагмент.
      </div>
      <input
        :value="containsDraft"
        type="text"
        class="compact-data-table__filter-search"
        placeholder="Введите часть значения"
        @input="handleContainsInput"
      />
    </template>
    <template v-else-if="activeMode === 'range'">
      <div class="compact-data-table__filter-hint">
        Диапазон работает включительно по границам.
      </div>
      <div class="compact-data-table__filter-range">
        <label class="compact-data-table__filter-range-field">
          <span>От</span>
          <input
            :value="rangeDraft.from"
            :type="rangeInputType"
            class="compact-data-table__filter-search"
            :placeholder="rangeStartPlaceholder"
            step="any"
            @input="handleRangeInput('from', $event)"
          />
        </label>
        <label class="compact-data-table__filter-range-field">
          <span>До</span>
          <input
            :value="rangeDraft.to"
            :type="rangeInputType"
            class="compact-data-table__filter-search"
            :placeholder="rangeEndPlaceholder"
            step="any"
            @input="handleRangeInput('to', $event)"
          />
        </label>
      </div>
    </template>
    <div class="compact-data-table__filter-footer">
      <button
        type="button"
        class="compact-data-table__filter-footer-button"
        @click="$emit('close')"
      >
        Отмена
      </button>
      <button
        type="button"
        class="compact-data-table__filter-footer-button compact-data-table__filter-footer-button--primary"
        @click="$emit('apply')"
      >
        Применить
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Header } from "../header.type";
import type { FilterMode, FilterOption } from "../data-table.types";
import { UiButton } from "./../../UiButton";

const props = defineProps<{
  activeDraft: string[];
  activeMode: FilterMode;
  availableModes: FilterMode[];
  containsDraft: string;
  filterModeLabels: Record<FilterMode, string>;
  filterSearch: string;
  header: Header | null;
  menuStyle: Record<string, string>;
  rangeDraft: { from: string; to: string };
  rangeEndPlaceholder: string;
  rangeInputType: string;
  rangeStartPlaceholder: string;
  visibleOptions: FilterOption[];
}>();

const emits = defineEmits<{
  (e: "apply"): void;
  (e: "clear-draft"): void;
  (e: "close"): void;
  (e: "set-mode", mode: FilterMode): void;
  (e: "select-all"): void;
  (e: "toggle-option", key: string): void;
  (e: "update:contains", value: string): void;
  (e: "update:filterSearch", value: string): void;
  (e: "update:range", value: { from: string; to: string }): void;
}>();

const handleSearchInput = (event: Event) => {
  emits(
    "update:filterSearch",
    (event.target as HTMLInputElement | null)?.value || "",
  );
};

const handleContainsInput = (event: Event) => {
  emits(
    "update:contains",
    (event.target as HTMLInputElement | null)?.value || "",
  );
};

const handleRangeInput = (key: "from" | "to", event: Event) => {
  emits("update:range", {
    ...props.rangeDraft,
    [key]: (event.target as HTMLInputElement | null)?.value || "",
  });
};
</script>

<style scoped>
.compact-data-table__filter-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 260px;
  width: min(28rem, calc(100vw - 24px));
  height: min(32rem, calc(100vh - 24px));
  min-height: 22rem;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 12px);
  resize: both;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid var(--app-border);
  border-radius: 0.9rem;
  background: var(--app-surface);
  box-shadow: var(--dt-filter-panel-shadow);
}

.compact-data-table__filter-menu-title {
  font-size: 12px;
  font-weight: 600;
}

.compact-data-table__filter-modes {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.compact-data-table__filter-mode {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
}

.compact-data-table__filter-mode--active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.compact-data-table__filter-hint {
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__filter-search {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  padding: 0.45rem 0.6rem;
  font-size: 12px;
  background: var(--app-surface);
  color: var(--app-text);
}

.compact-data-table__filter-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.5rem;
}

.compact-data-table__filter-range-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 11px;
  color: var(--app-text-muted);
}

.compact-data-table__filter-actions,
.compact-data-table__filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.compact-data-table__filter-action,
.compact-data-table__filter-footer-button {
  border: 1px solid var(--app-border);
  border-radius: 0.65rem;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
  font-size: 11px;
  padding: 0.35rem 0.6rem;
}

.compact-data-table__filter-footer-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.compact-data-table__filter-options {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 8rem;
  width: 100%;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  padding: 0.35rem;
  background: var(--dt-filter-options-bg);
}

.compact-data-table__filter-option input {
  accent-color: #2563eb;
}

.compact-data-table__filter-option {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  border-radius: 0.5rem;
  padding: 0.3rem 0.35rem;
  font-size: 11px;
}

.compact-data-table__filter-option:hover {
  background: rgba(37, 99, 235, 0.08);
}

.compact-data-table__filter-option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-data-table__filter-option-count {
  color: var(--app-text-muted);
}

.compact-data-table__filter-empty {
  padding: 0.5rem;
  font-size: 11px;
  color: var(--app-text-muted);
  text-align: center;
}
</style>
