<template>
  <div v-if="selectedChain && selectedFile" class="analysis-chain-page">
    <section v-if="showFileCard" class="app-surface analysis-page-card analysis-page-card--compact analysis-page-card--resizable">
      <header class="analysis-page-header">
        <span>Карточка файла</span>
        <span class="analysis-page-meta analysis-file-name">{{ selectedChain.name }}</span>
      </header>
      <div class="analysis-kv-grid">
        <div class="analysis-kv-row">
          <span>Путь</span>
          <span>{{ selectedFile.path }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Файловая система</span>
          <span>{{ selectedFile.filesystem || selectedFile.filesystemUuid || "—" }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Индексный дескриптор (inode)</span>
          <span>{{ selectedFile.inode === null || selectedFile.inode === undefined ? "—" : selectedFile.inode }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>История пути</span>
          <span>{{ selectedFile.pathHistory.join(" -> ") }}</span>
        </div>
        <div class="analysis-kv-row analysis-kv-row--wide">
          <span>Описание выбранного события</span>
          <span :title="(selectedTimelineEvent && selectedTimelineEvent.details) || '—'">{{ (selectedTimelineEvent && selectedTimelineEvent.details) || "—" }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Статус</span>
          <span>{{ selectedFile.currentStatus }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Размер</span>
          <span>{{ selectedFile.sizeBytes || 0 }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Исходный процесс</span>
          <span>{{ selectedFile.originProcess || "—" }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Пользователь</span>
          <span>{{ selectedFile.user || "—" }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Время создания</span>
          <span>{{ formatTs(selectedFile.birthTime) }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Начало отслеживания</span>
          <span>{{ formatTs(selectedFile.trackingStartedAt) }}</span>
        </div>
        <div class="analysis-kv-row">
          <span>Источник(и)</span>
          <span>{{ formatLinks(selectedFile.sourceLabels) }}</span>
        </div>
      </div>
    </section>

    <div class="analysis-chain-layout">
      <div class="analysis-chain-row">
      <section class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable">
        <header class="analysis-page-header">
          <button type="button" class="analysis-section-link" @click="openSection('/analysis/files')">
            Связанные файлы
          </button>
          <span class="analysis-page-meta">
            родителей={{ selectedChain.parents.length }} · потомков={{ selectedChain.children.length }}
          </span>
        </header>
        <div class="analysis-widget-body analysis-widget-body--stretch">
        <div class="analysis-related-grid">
          <div>
            <div class="analysis-subtitle">Родители</div>
            <div class="analysis-stack">
              <button
                v-for="parent in selectedChain.parents"
                :key="parent.fileId"
                type="button"
                class="analysis-link-row"
                @click="openFile(parent.fileId)"
              >
                <span class="analysis-file-name">{{ parent.name }}</span>
              </button>
              <div v-if="!selectedChain.parents.length" class="analysis-empty-row">Нет</div>
            </div>
          </div>
          <div>
            <div class="analysis-subtitle">Порожденные файлы</div>
            <div class="analysis-stack">
              <button
                v-for="child in selectedChain.children"
                :key="child.fileId"
                type="button"
                class="analysis-link-row"
                @click="openFile(child.fileId)"
              >
                <span class="analysis-file-name">{{ child.name }}</span>
              </button>
              <div v-if="!selectedChain.children.length" class="analysis-empty-row">Нет</div>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable">
        <header class="analysis-page-header">
          <button type="button" class="analysis-section-link" @click="openSection('/analysis/operations')">
            Версии файла
          </button>
          <span class="analysis-page-meta">{{ selectedChain.versions.length }} версий</span>
        </header>
        <div class="analysis-widget-body">
          <DataTable
            :headers="versionHeaders"
            :items="selectedChain.versions"
            :items-per-page="1000"
            export-title="Карточка_файла_версии"
          >
            <template #toolbar-actions>
              <button
                type="button"
                class="analysis-toolbar-toggle"
                :class="{ 'analysis-toolbar-toggle--active': showFileCard }"
                @click="showFileCard = !showFileCard"
              >
                <span class="pi" :class="showFileCard ? 'pi-eye-slash' : 'pi-eye'" />
                <span>Детали файла</span>
              </button>
            </template>
            <template #item.versionNumber="{ value }">v{{ value }}</template>
            <template #item.createdAt="{ value }">{{ formatTs(value) }}</template>
          </DataTable>
        </div>
      </section>
      </div>

      <div class="analysis-chain-row">
      <section class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable">
        <header class="analysis-page-header">
          <button type="button" class="analysis-section-link" @click="openSection('/analysis/timeline')">
            События файла
          </button>
          <span class="analysis-page-meta">{{ selectedFileTimeline.length }} событий</span>
        </header>
        <div class="analysis-widget-body">
          <DataTable
            :headers="timelineHeaders"
            :items="selectedFileTimeline"
            :items-per-page="1000"
            :active-row-key="selectedTimelineEventId"
            export-title="Карточка_файла_события"
            @click-row="handleTimelineRowClick"
            @dblclick-row="handleTimelineRowClick"
          >
            <template #toolbar-actions>
              <button
                type="button"
                class="analysis-toolbar-toggle"
                :class="{ 'analysis-toolbar-toggle--active': showFileCard }"
                @click="showFileCard = !showFileCard"
              >
                <span class="pi" :class="showFileCard ? 'pi-eye-slash' : 'pi-eye'" />
                <span>Детали файла</span>
              </button>
            </template>
            <template #item.timestamp="{ value }">{{ formatTs(value) }}</template>
            <template #item.type="{ value }">
              <span class="analysis-badge" :class="badgeClass(value)">{{ eventTypeLabel(value) }}</span>
            </template>
            <template #item.fileStatus="{ value }">
              <span class="analysis-badge" :class="statusBadgeClass(value)">{{ value || "—" }}</span>
            </template>
          </DataTable>
        </div>
        <div v-if="selectedTimelineEvent" class="analysis-widget-selection">
          <div class="analysis-subtitle">Описание выделенного события</div>
          <div class="analysis-widget-selection__body">{{ selectedTimelineEvent.details || "—" }}</div>
        </div>
      </section>

      <section class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable">
        <header class="analysis-page-header">
          <span class="analysis-section-link-group">
            <button type="button" class="analysis-section-link" @click="openSection('/analysis/statuses')">
              Статусы
            </button>
            <span>/</span>
            <button type="button" class="analysis-section-link" @click="openSection('/analysis/rename')">
              Переименования
            </button>
          </span>
          <span class="analysis-page-meta">
            статусов={{ selectedFileStatusHistory.length }} · переименований={{ selectedFileRenameHistory.length }}
          </span>
        </header>
        <div class="analysis-widget-body">
          <DataTable
            :headers="historyHeaders"
            :items="combinedHistory"
            :items-per-page="1000"
            export-title="Карточка_файла_status_rename"
          >
            <template #toolbar-actions>
              <button
                type="button"
                class="analysis-toolbar-toggle"
                :class="{ 'analysis-toolbar-toggle--active': showFileCard }"
                @click="showFileCard = !showFileCard"
              >
                <span class="pi" :class="showFileCard ? 'pi-eye-slash' : 'pi-eye'" />
                <span>Детали файла</span>
              </button>
            </template>
            <template #item.ts="{ value }">{{ formatTs(value) }}</template>
            <template #item.type="{ value }">
              <span class="analysis-badge" :class="badgeClass(value)">{{ eventTypeLabel(value) }}</span>
            </template>
          </DataTable>
        </div>
      </section>
      </div>
    </div>
  </div>

  <section v-else class="app-surface analysis-page-card">
    <div class="analysis-page-meta">
      Файл не найден. Выберите его из другого раздела аналитики.
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { DataTable, Header } from "@/common-components/src/components/DataTable";
import { useRoute, useRouter } from "vue-router/composables";
import { buildFileScopedLocation } from "../../model/file-route-filter";
import { useAnalysisChainPageModel } from "../../model/analysis-chain-page.model";
import type {
  AnalysisChainVersion,
  AnalysisFileEventKind,
} from "../../model/analysis-report.types";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";

const route = useRoute();
const router = useRouter();
const showFileCard = ref(true);
const {
  badgeClass,
  eventTypeLabel,
  formatLinks,
  formatTs,
  statusBadgeClass,
  selectedChain,
  selectedFile,
  selectedFileRenameHistory,
  selectedFileStatusHistory,
  selectedFileTimeline,
  setSelectedFile,
} = useAnalysisWorkspace();
const {
  combinedHistory,
  exportHistoryTimestamp,
  exportHistoryType,
  exportTimelineTimestamp,
  exportTimelineType,
  exportVersionCreatedAt,
  handleTimelineRowClick,
  selectedTimelineEvent,
  selectedTimelineEventId,
} = useAnalysisChainPageModel({
  eventTypeLabel,
  formatTs,
  selectedFileRenameHistory,
  selectedFileStatusHistory,
  selectedFileTimeline,
});

const versionHeaders: Header[] = [
  { text: "Версия", value: "versionNumber", align: "start", sortable: true, isVisible: true, width: 90 },
  { text: "Глубина", value: "depth", align: "start", sortable: true, isVisible: true, width: 90 },
  { text: "Создана", value: "createdAt", align: "start", sortable: true, isVisible: true, width: 150, exportValue: exportVersionCreatedAt },
  { text: "Кем создана", value: "createdBy", align: "start", sortable: false, isVisible: true, width: 240 },
];

const timelineHeaders: Header[] = [
  { text: "Время", value: "timestamp", align: "start", sortable: true, isVisible: true, width: 150, exportValue: exportTimelineTimestamp },
  { text: "Тип", value: "type", align: "start", sortable: true, isVisible: true, width: 90, exportValue: exportTimelineType },
  { text: "Статус", value: "fileStatus", align: "start", sortable: true, isVisible: true, width: 120 },
  { text: "Описание", value: "details", align: "start", sortable: false, isVisible: true, width: 360 },
];

const historyHeaders: Header[] = [
  { text: "Время", value: "ts", align: "start", sortable: true, isVisible: true, width: 150, exportValue: exportHistoryTimestamp },
  { text: "Тип", value: "type", align: "start", sortable: true, isVisible: true, width: 90, exportValue: exportHistoryType },
  { text: "Описание", value: "label", align: "start", sortable: false, isVisible: true, width: 360 },
];

watch(
  () => route.params.fileId,
  (fileId) => {
    const parsed = Number(fileId);
    setSelectedFile(Number.isFinite(parsed) ? parsed : null);
  },
  { immediate: true },
);

const openFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const openSection = (path: string) => {
  const fileId = selectedChain.value?.fileId ?? null;
  if (fileId !== null) {
    setSelectedFile(fileId);
  }

  router.push(buildFileScopedLocation(path, fileId));
};
</script>
<style scoped>
@import "../styles/analysis-card-surface.css";

.analysis-chain-page {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.1rem;
}

.analysis-page-card--compact {
  padding: 0.58rem;
}

.analysis-page-card--compact .analysis-page-header {
  margin-bottom: 0.42rem;
}

.analysis-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--analysis-header-gap);
  margin-bottom: var(--analysis-header-margin);
  font-size: var(--analysis-heading-size);
  font-weight: var(--analysis-heading-weight);
}

.analysis-page-card--resizable {
  min-height: 4.5rem;
  overflow: auto;
  resize: vertical;
}

.analysis-section-link-group {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.analysis-page-meta {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  line-height: var(--analysis-meta-line-height);
}

.analysis-kv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.28rem 0.38rem;
}

.analysis-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.analysis-kv-row {
  display: grid;
  grid-template-columns: minmax(0, 6.2rem) minmax(0, 1fr);
  align-items: start;
  gap: 0.2rem 0.42rem;
  padding: 0.22rem 0.32rem;
  border-radius: 0.55rem;
  background: var(--app-surface-muted);
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.analysis-kv-row > span:first-child {
  color: var(--app-text-muted);
  font-weight: 600;
  font-size: 0.7rem;
}

.analysis-kv-row > span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.analysis-kv-row--wide {
  grid-column: 1 / -1;
}

.analysis-chain-layout {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
}

.analysis-chain-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  align-items: stretch;
}

.analysis-widget-card {
  display: flex;
  flex-direction: column;
  min-height: 7rem;
}

.analysis-widget-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  resize: vertical;
}

.analysis-widget-body--stretch {
  min-height: 5rem;
}

.analysis-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  min-height: 100%;
}

.analysis-subtitle {
  margin-bottom: 0.35rem;
  font-size: var(--analysis-section-title-size);
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--analysis-section-title-spacing);
}

.analysis-link-row {
  text-align: left;
  padding: var(--analysis-surface-padding);
  border-radius: var(--analysis-surface-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.analysis-section-link {
  display: inline-flex;
  align-items: center;
  border: none;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  transition: color 0.2s ease;
}

.analysis-section-link:hover {
  color: #2563eb;
}

.analysis-toolbar-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  padding: 0.42rem 0.92rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.analysis-toolbar-toggle--active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.analysis-section-link:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.35);
  outline-offset: 3px;
  border-radius: 0.35rem;
}

.analysis-empty-row {
  padding: var(--analysis-surface-padding);
  border-radius: var(--analysis-surface-radius);
  background: var(--app-surface-muted);
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.analysis-widget-selection {
  margin-top: 0.4rem;
}

.analysis-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: var(--analysis-badge-padding);
  font-size: var(--analysis-badge-font-size);
  font-weight: 600;
}

.analysis-widget-selection__body {
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.event_badge_blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.event_badge_red {
  background: #fee2e2;
  color: #b91c1c;
}

.event_badge_green {
  background: #dcfce7;
  color: #15803d;
}

.event_badge_yellow {
  background: #fef3c7;
  color: #b45309;
}

.event_badge_gray {
  background: #e5e7eb;
  color: #374151;
}

@media (max-width: 1024px) {
  .analysis-chain-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .analysis-kv-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
