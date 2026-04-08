<template>
  <div v-if="selectedProcess" class="analysis-process-cards">
    <article class="app-surface analysis-process-card analysis-process-card--scrollable">
      <div class="analysis-process-card__eyebrow">Выбранный процесс</div>
      <div class="analysis-process-card__title">{{ selectedProcess.processLabel }}</div>
      <div class="analysis-kv-grid">
        <div class="analysis-kv-row">
          <span>PID</span>
          <span>{{ selectedProcess.pid === null || selectedProcess.pid === undefined ? "—" : selectedProcess.pid }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>UID</span>
          <span>{{ selectedProcess.uid === null || selectedProcess.uid === undefined ? "—" : selectedProcess.uid }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Пользователь</span>
          <span>{{ selectedProcess.user || "—" }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Версия процесса</span>
          <span>{{ selectedProcess.processVersionId }}</span>
        </div>
        <div class="analysis-kv-row analysis-kv-row--wide">
          <span>Путь к исполняемому файлу</span>
          <span :title="selectedProcess.executablePath || '—'">{{ selectedProcess.executablePath || "—" }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Создан</span>
          <span>{{ formatTs(selectedProcess.processCreatedAt) }}</span>
        </div>
      </div>
    </article>

    <article class="app-surface analysis-process-card">
      <div class="analysis-process-card__eyebrow">Операция записи</div>
      <div class="analysis-process-card__title">{{ selectedProcess.writeFileName }}</div>
      <div class="analysis-kv-grid">
        <div class="analysis-kv-row">
          <span>Время записи</span>
          <span>{{ formatTs(selectedProcess.writeAt) }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>UUID файловой системы</span>
          <span>{{ selectedProcess.writeFilesystemUuid || "—" }}</span>
        </div>
        <div class="analysis-kv-row analysis-kv-row--wide">
          <span>Путь файла записи</span>
          <span :title="selectedProcess.writePath || '—'">{{ selectedProcess.writePath || "—" }}</span>
        </div>
      </div>
    </article>

    <article class="app-surface analysis-process-card">
      <div class="analysis-process-card__eyebrow">Сводка событий</div>
      <div class="analysis-process-stats">
        <div class="analysis-process-stat">
          <strong>{{ selectedProcess.eventCount }}</strong>
          <span>событий</span>
        </div>
        <div class="analysis-process-stat">
          <strong>{{ selectedProcess.readCount }}</strong>
          <span>чтений</span>
        </div>
        <div class="analysis-process-stat">
          <strong>{{ selectedProcess.writeCount }}</strong>
          <span>записей</span>
        </div>
      </div>
      <div class="analysis-kv-grid">
        <div class="analysis-kv-row">
          <span>Самое раннее событие</span>
          <span>{{ formatTs(selectedProcess.firstEventAt) }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Самое позднее событие</span>
          <span>{{ formatTs(selectedProcess.lastEventAt) }}</span>
        </div>
      </div>
    </article>

    <article class="app-surface analysis-process-card">
      <div class="analysis-process-card__eyebrow">События группы</div>
      <div class="analysis-process-event-list">
        <button
          v-for="event in selectedProcess.events"
          :key="event.id"
          type="button"
          class="analysis-process-event-chip"
          @click="$emit('open-file', event.fileId)"
        >
          <div class="analysis-process-event-chip__header">
            <span class="analysis-badge" :class="badgeClass(event.eventType)">
              {{ eventTypeLabel(event.eventType) }}
            </span>
            <strong class="analysis-file-name">{{ event.fileName }}</strong>
            <span class="analysis-page-meta">{{ formatTs(event.eventAt) }}</span>
          </div>
          <span class="analysis-process-event-chip__path" :title="event.path || '—'">{{ event.path || "—" }}</span>
        </button>
      </div>
    </article>
  </div>
</template>

<script lang="ts" setup>
import type { Nullable } from "../../model/analysis-report.types";
import type { ProcessGroup } from "../../model/analysis-processes-table.types";

defineProps<{
  badgeClass: (type: string) => Record<string, boolean>;
  eventTypeLabel: (type?: Nullable<string>) => string;
  formatTs: (value?: Nullable<string>) => string;
  selectedProcess: ProcessGroup | null;
}>();

defineEmits<{
  (e: "open-file", fileId: number): void;
}>();
</script>

<style scoped>
.analysis-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: var(--analysis-badge-padding);
  font-size: var(--analysis-badge-font-size);
  font-weight: 600;
}

.analysis-page-meta {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  font-weight: var(--analysis-meta-weight);
  line-height: var(--analysis-meta-line-height);
}

.analysis-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-process-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.analysis-process-card {
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: var(--analysis-card-radius);
  background: var(--app-surface);
}

.analysis-process-card--scrollable {
  max-height: min(50vh, 22rem);
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.analysis-process-card__eyebrow {
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.analysis-process-card__title {
  margin-top: 0.35rem;
  margin-bottom: 0.9rem;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
}

.analysis-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem 0.8rem;
}

.analysis-kv-row {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.analysis-kv-row span:first-child {
  color: var(--app-text-muted);
  font-size: 0.74rem;
}

.analysis-kv-row span:last-child {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-kv-row--wide {
  grid-column: 1 / -1;
}

.analysis-process-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0.95rem 0;
}

.analysis-process-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
  border-radius: 0.9rem;
  background: var(--app-surface-muted);
}

.analysis-process-stat strong {
  font-size: 1.05rem;
  line-height: 1.1;
}

.analysis-process-stat span {
  color: var(--app-text-muted);
  font-size: 0.76rem;
}

.analysis-process-event-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.95rem;
}

.analysis-process-event-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  width: 100%;
  padding: 0.72rem 0.8rem;
  border: 1px solid var(--app-border);
  border-radius: 0.85rem;
  background: var(--app-surface);
  text-align: left;
}

.analysis-process-event-chip__header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  min-width: 0;
}

.analysis-process-event-chip__path {
  width: 100%;
  color: var(--app-text-muted);
  font-size: 0.76rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 960px) {
  .analysis-kv-grid,
  .analysis-process-stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .analysis-process-event-chip__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
