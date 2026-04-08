<template>
  <section class="app-surface analysis-page-card analysis-graph-page">
    <header class="analysis-page-header">
      <span>Граф распространения</span>
      <span class="analysis-page-meta">
        Источников в текущем представлении: {{ visibleSources.length }}
      </span>
    </header>

    <div v-if="visibleSources.length" class="analysis-graph-scroll-shell">
      <div class="analysis-graph-stack">
        <details v-for="source in visibleSources" :key="source.fileId" class="analysis-graph-details" open>
          <summary class="analysis-graph-summary">
            <div>
              <div class="analysis-graph-title analysis-file-name">{{ source.name }}</div>
              <div class="analysis-page-meta">{{ source.path }}</div>
            </div>
          </summary>

          <div
            v-for="(level, levelIndex) in sourceColumns(source.fileId)"
            :key="`${source.fileId}-level-${levelIndex}`"
            class="analysis-graph-level"
          >
            <div class="analysis-graph-level-label tw-mb-2">Уровень {{ levelIndex + 1 }}</div>
            <div class="analysis-graph-grid">
              <button
                v-for="node in level"
                :key="node.fileId"
                type="button"
                class="app-surface analysis-graph-node"
                @click="selectFile(node.fileId)"
                @dblclick="openFile(node.fileId)"
              >
                <div class="analysis-graph-title analysis-file-name">{{ node.name }}</div>
                <div class="analysis-page-meta tw-mt-1">{{ node.path }}</div>
                <div class="analysis-page-meta tw-mt-2">
                  версий={{ node.versionCount }} · глубина={{ node.depth }} · {{ node.currentStatus }}
                </div>
                <span class="analysis-badge event_badge_gray tw-mt-2">
                  {{ node.childIds.length ? `Порождает ${node.childIds.length} файл(ов)` : "Листовой узел" }}
                </span>
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>

    <div v-else class="analysis-page-meta">
      Для выбранных фильтров нет доступных цепочек источников.
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router/composables";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";

const router = useRouter();
const { setSelectedFile, sourceColumns, visibleSources } = useAnalysisWorkspace();

const selectFile = (fileId: number) => {
  setSelectedFile(fileId);
};

const openFile = (fileId: number) => {
  selectFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};
</script>
<style scoped>
@import "../styles/analysis-card-surface.css";

.analysis-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--analysis-header-gap);
  flex: 0 0 auto;
  margin-bottom: var(--analysis-header-margin);
  font-size: var(--analysis-heading-size);
  font-weight: var(--analysis-heading-weight);
}

.analysis-graph-page {
  overflow: hidden;
}

.analysis-page-meta {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  line-height: var(--analysis-meta-line-height);
}

.analysis-graph-stack {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 1rem;
}

.analysis-graph-scroll-shell {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  padding-right: 0.25rem;
}

.analysis-graph-details {
  flex: 0 0 auto;
  border: 1px solid var(--app-border);
  border-radius: var(--analysis-surface-radius);
  overflow: hidden;
  background: var(--app-surface);
}

.analysis-graph-summary {
  display: block;
  cursor: pointer;
  list-style: none;
  padding: var(--analysis-surface-padding);
  background: var(--app-surface-muted);
}

.analysis-graph-summary::-webkit-details-marker {
  display: none;
}

.analysis-graph-title {
  font-weight: 600;
}

.analysis-graph-level {
  padding: var(--analysis-surface-padding);
  border-top: 1px solid var(--app-border);
}

.analysis-graph-level-label {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-muted);
  color: var(--app-text);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  padding: 0.28rem 0.65rem;
}

.analysis-graph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.analysis-graph-node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  text-align: left;
  border-radius: var(--analysis-surface-radius);
  padding: var(--analysis-surface-padding);
  cursor: pointer;
}

.analysis-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: var(--analysis-badge-padding);
  font-size: var(--analysis-badge-font-size);
  font-weight: 600;
}

.event_badge_gray {
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text);
}

@media (max-width: 960px) {
  .analysis-graph-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
