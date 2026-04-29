<template>
  <div v-if="selectedChain && selectedFile" class="analysis-chain-page">
    <FileCard
      v-if="showFileCard"
      :selected-chain="selectedChain"
      :selected-file="selectedFile"
      :selected-timeline-event="selectedTimelineEvent"
      :format-ts="formatTs"
      :format-links="formatLinks"
    />

    <div class="analysis-chain-layout">
      <div class="analysis-chain-row">
        <section
          class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable"
        >
          <header class="analysis-page-header">
            <button
              type="button"
              class="analysis-section-link"
              @click="openSection('/analysis/files')"
            >
              Связанные файлы
            </button>
            <span class="analysis-page-meta">
              родителей={{ selectedChain.parents.length }} · потомков={{
                selectedChain.children.length
              }}
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
                  <div
                    v-if="!selectedChain.parents.length"
                    class="analysis-empty-row"
                  >
                    Нет
                  </div>
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
                  <div
                    v-if="!selectedChain.children.length"
                    class="analysis-empty-row"
                  >
                    Нет
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable"
        >
          <header class="analysis-page-header">
            <button
              type="button"
              class="analysis-section-link"
              @click="openSection('/analysis/operations')"
            >
              Версии файла
            </button>
            <span class="analysis-page-meta"
              >{{ selectedChain.versions.length }} версий</span
            >
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
                  <span
                    class="pi"
                    :class="showFileCard ? 'pi-eye-slash' : 'pi-eye'"
                  />
                  <span>Детали файла</span>
                </button>
              </template>
              <template #[`item.versionNumber`]="{ value }"
                >v{{ value }}</template
              >
              <template #[`item.createdAt`]="{ value }">{{
                formatTs(value)
              }}</template>
            </DataTable>
          </div>
        </section>
      </div>

      <div class="analysis-chain-row">
        <section
          class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable"
        >
          <header class="analysis-page-header">
            <button
              type="button"
              class="analysis-section-link"
              @click="openSection('/analysis/timeline')"
            >
              События файла
            </button>
            <span class="analysis-page-meta"
              >{{ selectedFileTimeline.length }} событий</span
            >
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
                  <span
                    class="pi"
                    :class="showFileCard ? 'pi-eye-slash' : 'pi-eye'"
                  />
                  <span>Детали файла</span>
                </button>
              </template>
              <template #[`item.timestamp`]="{ value }">{{
                formatTs(value)
              }}</template>
              <template #[`item.type`]="{ value }">
                <span class="analysis-badge" :class="badgeClass(value)">{{
                  eventTypeLabel(value)
                }}</span>
              </template>
              <template #[`item.fileStatus`]="{ value }">
                <span class="analysis-badge" :class="statusBadgeClass(value)">{{
                  value || "—"
                }}</span>
              </template>
            </DataTable>
          </div>
          <div v-if="selectedTimelineEvent" class="analysis-widget-selection">
            <div class="analysis-subtitle">Описание выделенного события</div>
            <div class="analysis-widget-selection__body">
              {{ selectedTimelineEvent.details || "—" }}
            </div>
          </div>
        </section>

        <section
          class="app-surface analysis-page-card analysis-widget-card analysis-page-card--resizable"
        >
          <header class="analysis-page-header">
            <span class="analysis-section-link-group">
              <button
                type="button"
                class="analysis-section-link"
                @click="openSection('/analysis/statuses')"
              >
                Статусы
              </button>
              <span>/</span>
              <button
                type="button"
                class="analysis-section-link"
                @click="openSection('/analysis/rename')"
              >
                Переименования
              </button>
            </span>
            <span class="analysis-page-meta">
              статусов={{ selectedFileStatusHistory.length }} ·
              переименований={{ selectedFileRenameHistory.length }}
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
                  <span
                    class="pi"
                    :class="showFileCard ? 'pi-eye-slash' : 'pi-eye'"
                  />
                  <span>Детали файла</span>
                </button>
              </template>
              <template #[`item.ts`]="{ value }">{{
                formatTs(value)
              }}</template>
              <template #[`item.type`]="{ value }">
                <span class="analysis-badge" :class="badgeClass(value)">{{
                  eventTypeLabel(value)
                }}</span>
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
import { DataTable } from "@/components/DataTable";
import { useRoute, useRouter } from "vue-router/composables";

import { useAnalysisChainPageModel } from "../../../model/analysis-chain-page.model";
import { useAnalysisWorkspace } from "../../../model/use-analysis-workspace";
import {
  createHistoryHeaders,
  createTimelineHeaders,
  versionHeaders,
} from "./headers";
import { buildFileScopedLocation } from "@/shared/utils/buildFileScopedLocation";
import FileCard from "./FileCard.vue";

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
  handleTimelineRowClick,
  selectedTimelineEvent,
  selectedTimelineEventId,
} = useAnalysisChainPageModel({
  eventTypeLabel,
  selectedFileRenameHistory,
  selectedFileStatusHistory,
  selectedFileTimeline,
});

const timelineHeaders = computed(() => createTimelineHeaders(eventTypeLabel));
const historyHeaders = computed(() =>
  createHistoryHeaders(eventTypeLabel, formatTs),
);

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
<style scoped src="./AnalysisChainPage.css"></style>
