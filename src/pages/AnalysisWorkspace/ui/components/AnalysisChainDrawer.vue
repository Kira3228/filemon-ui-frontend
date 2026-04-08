<template>
  <section
    v-if="selectedChain"
    class="app-surface analysis-drawer"
    :class="{
      'analysis-drawer-card': !embedded,
      'analysis-drawer--embedded': embedded,
    }"
  >
    <header class="analysis-drawer__header">
      <div>
        <RouterLink
          v-if="selectedChain.fileId"
          :to="`/analysis/file/${selectedChain.fileId}`"
          class="analysis-drawer__title analysis-drawer__title-link analysis-file-name"
        >
          {{ selectedChain.name }}
        </RouterLink>
        <div v-else class="analysis-drawer__title analysis-file-name">{{ selectedChain.name }}</div>
        <div class="analysis-drawer__muted">{{ selectedChain.path }}</div>
      </div>
      <button type="button" class="analysis-icon-button" @click="handleCloseDrawer">
        <span class="pi pi-times" aria-hidden="true" />
      </button>
    </header>

    <div class="analysis-drawer__content">
      <div v-if="selectedFile" class="analysis-drawer__section">
        <div class="analysis-drawer__section-title">Метаданные</div>
        <div class="analysis-kv-grid">
          <div class="analysis-kv-row">
            <span>Файловая система</span>
            <span>{{ selectedFile.filesystem || selectedFile.filesystemUuid || "—" }}</span>
          </div>
          <div class="analysis-kv-row">
            <span>Индексный дескриптор (inode)</span>
            <span>{{ selectedFile.inode === null || selectedFile.inode === undefined ? "—" : selectedFile.inode }}</span>
          </div>
          <div class="analysis-kv-row">
            <span>Статус</span>
            <span>{{ selectedFile.currentStatus }}</span>
          </div>
          <div class="analysis-kv-row">
            <span>Версий</span>
            <span>{{ selectedFile.versionCount }}</span>
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
            <span>{{ selectedFile.birthTime ? new Date(selectedFile.birthTime).toLocaleString() : "—" }}</span>
          </div>
          <div class="analysis-kv-row">
            <span>Начало отслеживания</span>
            <span>{{ selectedFile.trackingStartedAt ? new Date(selectedFile.trackingStartedAt).toLocaleString() : "—" }}</span>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('sources')"
          @click="toggleSection('sources')"
        >
          <span class="analysis-drawer__section-title">Источники</span>
          <span :class="isSectionOpen('sources') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('sources')" class="analysis-drawer__section-body">
          <div class="analysis-scroll-list analysis-scroll-list--compact">
            <div v-for="source in selectedChain.sourceLabels" :key="source.fileId" class="analysis-pill-row">
              <span class="analysis-file-name">{{ source.name }}</span>
            </div>
            <div v-if="!selectedChain.sourceLabels.length" class="analysis-empty-row">Нет</div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('parents')"
          @click="toggleSection('parents')"
        >
          <span class="analysis-drawer__section-title">Родители</span>
          <span :class="isSectionOpen('parents') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('parents')" class="analysis-drawer__section-body">
          <div class="analysis-scroll-list analysis-scroll-list--compact">
            <div v-for="parent in selectedChain.parents" :key="parent.fileId" class="analysis-pill-row">
              <span class="analysis-file-name">{{ parent.name }}</span>
            </div>
            <div v-if="!selectedChain.parents.length" class="analysis-empty-row">Нет</div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('children')"
          @click="toggleSection('children')"
        >
          <span class="analysis-drawer__section-title">Порожденные файлы</span>
          <span :class="isSectionOpen('children') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('children')" class="analysis-drawer__section-body">
          <div class="analysis-scroll-list analysis-scroll-list--compact">
            <button
              v-for="child in selectedChain.children"
              :key="child.fileId"
              type="button"
              class="analysis-link-row"
              @click="handleOpenFile(child.fileId)"
            >
              <span class="analysis-file-name">{{ child.name }}</span>
            </button>
            <div v-if="!selectedChain.children.length" class="analysis-empty-row">Нет</div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('reads')"
          @click="toggleSection('reads')"
        >
          <span class="analysis-drawer__section-title">Чтения</span>
          <span :class="isSectionOpen('reads') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('reads')" class="analysis-drawer__section-body">
          <div class="analysis-scroll-list">
            <div class="analysis-mini-table">
              <div
                v-for="reader in selectedChain.readers"
                :key="`${selectedChain.fileId}-${reader.processVersionId}`"
                class="analysis-mini-table__row"
              >
                <div class="analysis-mini-table__primary">{{ reader.label }}</div>
                <div class="analysis-mini-table__secondary">
                  {{ reader.firstAt ? new Date(reader.firstAt).toLocaleString() : "—" }}
                </div>
              </div>
            </div>
            <div v-if="!selectedChain.readers.length" class="analysis-empty-row">Нет</div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('versions')"
          @click="toggleSection('versions')"
        >
          <span class="analysis-drawer__section-title">Версии</span>
          <span :class="isSectionOpen('versions') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('versions')" class="analysis-drawer__section-body">
          <div class="analysis-scroll-list">
            <div class="analysis-mini-table">
              <div v-for="version in selectedChain.versions" :key="version.id" class="analysis-mini-table__row">
                <div class="analysis-mini-table__primary">v{{ version.versionNumber }}</div>
                <div class="analysis-mini-table__secondary">{{ version.createdBy }}</div>
              </div>
            </div>
            <div v-if="!selectedChain.versions.length" class="analysis-empty-row">Нет</div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('pathHistory')"
          @click="toggleSection('pathHistory')"
        >
          <span class="analysis-drawer__section-title">История пути</span>
          <span :class="isSectionOpen('pathHistory') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('pathHistory')" class="analysis-drawer__section-body">
          <div class="analysis-drawer__path-history">
            <div
              v-for="(pathItem, index) in selectedFile.pathHistory"
              :key="`${selectedFile.fileId}-${index}-${pathItem}`"
              class="analysis-drawer__path-history-item"
              :title="pathItem"
            >
              {{ pathItem }}
            </div>
            <div v-if="!selectedFile.pathHistory.length" class="analysis-drawer__path-history-item">—</div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <button
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('eventDescription')"
          @click="toggleSection('eventDescription')"
        >
          <span class="analysis-drawer__section-title">Описание события</span>
          <span :class="isSectionOpen('eventDescription') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
        </button>
        <div v-show="isSectionOpen('eventDescription')" class="analysis-drawer__section-body">
          <div class="analysis-drawer__path-history">
            <div class="analysis-drawer__path-history-item" :title="latestFileEventDescription || '—'">
              {{ latestFileEventDescription || "—" }}
            </div>
          </div>
        </div>
      </div>

    </div>

  </section>
  <section
    v-else
    class="app-surface analysis-drawer"
    :class="{
      'analysis-drawer-card': !embedded,
      'analysis-drawer--embedded': embedded,
    }"
  >
    <div class="analysis-drawer__muted">
      Выберите файл в аналитике, чтобы открыть карточку.
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { useRouter } from "vue-router/composables";
import { useAnalysisUiSettings } from "../../model/use-analysis-ui-settings";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";

withDefaults(defineProps<{
  embedded?: boolean,
}>(), {
  embedded: false,
});

const router = useRouter();
const { selectedChain, selectedFile, selectedFileTimeline, setSelectedFile } = useAnalysisWorkspace();
const { setFileDetailsVisible } = useAnalysisUiSettings();

type SectionKey = "sources" | "parents" | "children" | "reads" | "versions" | "pathHistory" | "eventDescription";

const sectionOpenState = ref<Record<SectionKey, boolean>>({
  sources: true,
  parents: true,
  children: true,
  reads: true,
  versions: true,
  pathHistory: true,
  eventDescription: true,
});

const isSectionOpen = (section: SectionKey) => sectionOpenState.value[section];

const toggleSection = (section: SectionKey) => {
  sectionOpenState.value[section] = !sectionOpenState.value[section];
};

const handleOpenFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleCloseDrawer = () => {
  setFileDetailsVisible(false);
};

const latestFileEventDescription = computed(() =>
  selectedFileTimeline.value[0]?.details || "",
);
</script>
<style scoped>
@import "../styles/analysis-card-surface.css";

.analysis-drawer-card {
  position: sticky;
  top: 16px;
}

.analysis-drawer--embedded {
  height: 100%;
  overflow: auto;
}

.analysis-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--analysis-header-gap);
  margin-bottom: var(--analysis-header-margin);
}

.analysis-drawer__title {
  font-size: var(--analysis-drawer-title-size);
  font-weight: 700;
}

.analysis-drawer__title-link {
  color: #2563eb;
  text-decoration: none;
}

.analysis-drawer__title-link:hover {
  text-decoration: underline;
}

.analysis-drawer__muted {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  line-height: var(--analysis-meta-line-height);
}

.analysis-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
}

.analysis-drawer__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.analysis-drawer__section {
  padding-top: 1rem;
  border-top: 1px solid var(--app-border);
}

.analysis-drawer__section-title {
  margin-bottom: 0.65rem;
  font-size: var(--analysis-section-title-size);
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--analysis-section-title-spacing);
}

.analysis-drawer__section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 0;
  cursor: pointer;
}

.analysis-drawer__section-toggle .analysis-drawer__section-title {
  margin-bottom: 0;
}

.analysis-drawer__section-body {
  margin-top: 0.65rem;
}

.analysis-kv-grid,
.analysis-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.analysis-kv-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.analysis-drawer__path-history {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.analysis-drawer__path-history-item {
  min-width: 0;
  padding: 0.42rem 0.65rem;
  border-radius: var(--analysis-surface-radius);
  background: var(--app-surface-muted);
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
  word-break: break-word;
}

.analysis-pill-row,
.analysis-empty-row {
  padding: var(--analysis-surface-padding);
  border-radius: var(--analysis-surface-radius);
  background: var(--app-surface-muted);
}

.analysis-scroll-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 14rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.analysis-scroll-list--compact {
  gap: 0.35rem;
}

.analysis-pill-row,
.analysis-link-row,
.analysis-empty-row {
  min-height: 2rem;
  padding: 0.42rem 0.65rem;
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.analysis-pill-row,
.analysis-empty-row {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-link-row {
  text-align: left;
  border-radius: var(--analysis-surface-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-mini-table {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.analysis-mini-table__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: start;
  padding: 0.42rem 0.65rem;
  border-radius: var(--analysis-surface-radius);
  background: var(--app-surface-muted);
}

.analysis-mini-table__primary,
.analysis-mini-table__secondary {
  min-width: 0;
  font-size: var(--analysis-table-font-size);
  line-height: var(--analysis-table-line-height);
}

.analysis-mini-table__primary {
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-mini-table__secondary {
  color: var(--app-text-muted);
  text-align: right;
}

</style>
