<template>
  <div class="layout-shell">
    <div class="layout-main">
      <AppMenu :items="menuItems" @menu-click="handleMenuClick" />
      <div
        class="tw-p-4 tw-flex-1 tw-min-w-0 tw-min-h-0 tw-overflow-hidden tw-flex tw-flex-col"
      >
        <RouterView class="tw-flex-1 tw-min-h-0" />
      </div>
    </div>

    <div v-if="showStatusBar" class="app-surface layout-status-bar">
      <div class="layout-status-bar__intro">
        <div class="layout-status-bar__headline">
          <button
            type="button"
            class="layout-status-bar__state"
            :class="{ 'layout-status-bar__state--loading': loading }"
            :title="loading ? 'Данные обновляются' : 'Обновить данные'"
            :disabled="loading"
            @click="handleRefreshClick"
          >
            <span
              class="material-icons layout-status-bar__state-icon"
              aria-hidden="true"
              >{{ refreshStatusIcon }}</span
            >
            {{ refreshStatusLabel }}
          </button>
        </div>
      </div>

      <div class="layout-status-bar__content">
        <template v-for="stat in overviewStatusStats">
          <RouterLink
            v-if="stat.to"
            :key="stat.label"
            :to="stat.to"
            class="layout-status-metric layout-status-metric--link"
            :class="`layout-status-metric--${stat.tone}`"
          >
            <span class="layout-status-metric__label">{{ stat.label }}</span>
            <strong class="layout-status-metric__value">{{
              stat.value
            }}</strong>
          </RouterLink>
          <span
            v-else
            :key="stat.label"
            class="layout-status-metric"
            :class="`layout-status-metric--${stat.tone}`"
          >
            <span class="layout-status-metric__label">{{ stat.label }}</span>
            <strong class="layout-status-metric__value">{{
              stat.value
            }}</strong>
          </span>
        </template>
        <span
          v-if="selectedSource"
          class="layout-status-chip layout-status-chip--accent"
          :title="selectedSource.path || selectedSource.name"
        >
          <span class="layout-status-chip__label">Источник</span>
          <strong class="layout-status-chip__value">{{
            selectedSource.name
          }}</strong>
        </span>
        <span
          v-if="snapshotAt"
          class="layout-status-chip layout-status-chip--neutral"
        >
          <span class="layout-status-chip__label">Снимок</span>
          <strong class="layout-status-chip__value">{{
            formatTs(snapshotAt)
          }}</strong>
        </span>
        <div class="layout-status-bar__database-group">
          <span
            class="layout-status-chip layout-status-chip--neutral layout-status-bar__database"
            :title="databasePath || 'Путь к базе данных не задан'"
            @dblclick="handleDatabasePathDoubleClick"
          >
            <span
              class="material-icons layout-status-bar__database-icon"
              aria-hidden="true"
              >storage</span
            >
            <strong class="layout-status-chip__value">
              {{ databasePath || "Путь не задан" }}
            </strong>
          </span>
          <span
            class="layout-status-chip layout-status-bar__database-status"
            :class="databaseStatusChipClass"
            :title="databaseStatusTitle"
          >
            <span
              class="material-icons layout-status-bar__database-icon"
              aria-hidden="true"
              >dns</span
            >
            <strong class="layout-status-chip__value">
              {{ databaseStatusLabel }}
            </strong>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  Menu as AppMenu,
  TMenuItem,
} from "@/common-components/src/components/Menu";
import {
  buildFileScopedLocation,
  parseRouteFileId,
} from "@/pages/AnalysisWorkspace/model/file-route-filter";
import { RouterLink, RouterView } from "vue-router";
import { useRoute, useRouter } from "vue-router/composables";
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useAnalysisWorkspace } from "@/pages/AnalysisWorkspace/model/use-analysis-workspace";
import {
  analysisSections,
  getAnalysisSectionByPath,
} from "@/pages/AnalysisWorkspace/model/analysis-sections";
import { useAnalysisUiSettings } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import { useDatabaseState } from "@/shared/model/use-database-state";

const { loading, formatTs, report, refreshReport, selectedSource, snapshotAt } =
  useAnalysisWorkspace();
const { autoRefreshEnabled, autoRefreshIntervalSeconds, openAnalysisTab } =
  useAnalysisUiSettings();
const route = useRoute();
const router = useRouter();
const {
  databasePath,
  databaseConnected,
  databaseExists,
  databaseStatus,
  databaseStatusMessage,
  loadDatabaseState,
} = useDatabaseState();

const isAnalysisRoute = computed(() => route.path.startsWith("/analysis"));
const showStatusBar = computed(() => isAnalysisRoute.value);
const scopedFileId = computed(() => parseRouteFileId(route));
const refreshStatusIcon = computed(() =>
  loading.value ? "autorenew" : "sync",
);
const refreshStatusLabel = computed(() => {
  if (loading.value) {
    return "Обновление данных";
  }

  if (autoRefreshEnabled.value) {
    return `Автообновление каждые ${autoRefreshIntervalSeconds.value} с`;
  }

  return "Ручное обновление";
});
const databaseStatusKey = computed(() => {
  if (databaseStatus.value) {
    return databaseStatus.value;
  }

  if (databaseConnected.value) {
    return "connected";
  }

  if (!databasePath.value.trim()) {
    return "path-not-set";
  }

  if (!databaseExists.value) {
    return "file-missing";
  }

  return "structure-error";
});
const databaseStatusLabel = computed(() => {
  switch (databaseStatusKey.value) {
    case "connected":
      return "Подключено";
    case "path-not-set":
      return "Путь не задан";
    case "file-missing":
      return "Файл БД не найден";
    default:
      return "Ошибка структуры БД";
  }
});
const databaseStatusChipClass = computed(() => {
  switch (databaseStatusKey.value) {
    case "connected":
      return "layout-status-chip--success";
    case "path-not-set":
      return "layout-status-chip--neutral";
    default:
      return "layout-status-chip--danger";
  }
});
const databaseStatusTitle = computed(() => {
  if (databaseStatusMessage.value) {
    return databasePath.value.trim()
      ? `${databaseStatusMessage.value}: ${databasePath.value}`
      : databaseStatusMessage.value;
  }

  if (!databasePath.value.trim()) {
    return "Путь к базе данных не задан";
  }

  if (databaseStatusKey.value === "connected") {
    return `Подключено: ${databasePath.value}`;
  }

  if (databaseStatusKey.value === "file-missing") {
    return `Файл базы данных не найден: ${databasePath.value}`;
  }

  return `Не удалось использовать базу данных: ${databasePath.value}`;
});

const handleRefreshClick = () => {
  if (loading.value) {
    return;
  }

  refreshReport().catch(() => {
    // Ошибка уже записана в store.
  });
};

const overviewStatusStats = computed(() => [
  {
    label: "Файлов",
    value: report.value?.overview?.files ?? 0,
    to: buildFileScopedLocation("/analysis/files", scopedFileId.value),
    tone: "blue",
  },
  {
    label: "Версий файлов",
    value: report.value?.overview?.fileVersions ?? 0,
    to: buildFileScopedLocation("/analysis/operations", scopedFileId.value),
    tone: "amber",
  },
  {
    label: "Источников",
    value: report.value?.overview?.sources ?? 0,
    to: buildFileScopedLocation("/analysis/sources", scopedFileId.value),
    tone: "emerald",
  },
  {
    label: "Макс. глубина",
    value: report.value?.overview?.maxDepth ?? 0,
    to: null,
    tone: "slate",
  },
]);

let autoRefreshTimerId: number | null = null;

const clearAutoRefreshTimer = () => {
  if (typeof window === "undefined" || autoRefreshTimerId === null) {
    return;
  }

  window.clearInterval(autoRefreshTimerId);
  autoRefreshTimerId = null;
};

const restartAutoRefreshTimer = () => {
  clearAutoRefreshTimer();

  if (
    typeof window === "undefined" ||
    !isAnalysisRoute.value ||
    !autoRefreshEnabled.value
  ) {
    return;
  }

  autoRefreshTimerId = window.setInterval(() => {
    refreshReport().catch(() => {
      // Ошибка уже записана в store.
    });
  }, autoRefreshIntervalSeconds.value * 1000);
};

watch(
  [isAnalysisRoute, autoRefreshEnabled, autoRefreshIntervalSeconds],
  restartAutoRefreshTimer,
  { immediate: true },
);

onBeforeUnmount(() => {
  clearAutoRefreshTimer();
});

const menuIcons: Record<string, string> = {
  overview: "dashboard",
  sources: "hub",
  files: "folder_open",
  operations: "history",
  timeline: "timeline",
  statuses: "rule",
  rename: "drive_file_rename_outline",
  "files-tree": "account_tree",
  "propagation-diagram": "share",
  processes: "precision_manufacturing",
  graph: "schema",
  settings: "settings",
};

const menuItems = computed<TMenuItem[]>(() => {
  return analysisSections.map((section) => ({
    title: section.label,
    icon: menuIcons[section.key] || "dashboard",
    to: section.to,
  }));
});

const handleMenuClick = ({ to }: { to?: string }) => {
  const section = getAnalysisSectionByPath(to || route.path);
  if (!section) {
    return;
  }

  openAnalysisTab(section.key);
};

const handleDatabasePathDoubleClick = () => {
  const focusDatabasePath = String(Date.now());

  if (route.path === "/analysis/settings") {
    router
      .replace({
        path: route.path,
        query: {
          ...route.query,
          focusDatabasePath,
        },
      })
      .catch(() => {});
    return;
  }

  router
    .push({
      path: "/analysis/settings",
      query: {
        focusDatabasePath,
        returnTo: route.fullPath,
      },
    })
    .catch(() => {});
};

onMounted(() => {
  loadDatabaseState().catch(() => {});
});

watch(
  () => route.fullPath,
  () => {
    if (!isAnalysisRoute.value) {
      return;
    }

    loadDatabaseState().catch(() => {});
  },
);
</script>
<style scoped lang="scss">
.layout-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.layout-main {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.layout-status-bar {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem 0.85rem;
  width: 100%;
  min-height: 64px;
  padding: 0.55rem 0.8rem 0.65rem;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  border-radius: 0;
  position: relative;
  z-index: 15;
  overflow: hidden;
  background: radial-gradient(
      circle at top left,
      rgba(14, 165, 233, 0.12),
      transparent 30%
    ),
    radial-gradient(
      circle at top right,
      rgba(59, 130, 246, 0.1),
      transparent 28%
    ),
    linear-gradient(180deg, var(--app-surface), var(--app-surface-muted));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 -1px 0 rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(16px);
}

.layout-status-bar::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(37, 99, 235, 0.28),
    transparent
  );
}

.layout-status-bar__intro {
  display: flex;
  flex: 0 1 16rem;
  flex-direction: column;
  gap: 0.2rem;
  min-width: min(100%, 14rem);
}

.layout-status-bar__headline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.layout-status-bar__state {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.58rem;
  border: 0;
  border-radius: 999px;
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 0.69rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease,
    box-shadow 0.2s ease;
}

.layout-status-bar__state:hover {
  transform: translateY(-1px);
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  box-shadow: 0 10px 22px rgba(148, 163, 184, 0.12);
}

.layout-status-bar__state:disabled {
  cursor: default;
}

.layout-status-bar__state--loading {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.layout-status-bar__state--success {
  background: rgba(220, 252, 231, 0.88);
  color: #166534;
}

.layout-status-bar__state--neutral {
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
}

.layout-status-bar__state--danger {
  background: rgba(254, 226, 226, 0.92);
  color: #991b1b;
}

.layout-status-bar__state-icon {
  font-size: 0.95rem;
  line-height: 1;
  color: #22c55e;
  transition: color 0.2s ease;
}

.layout-status-bar__state--success .layout-status-bar__state-icon {
  color: #16a34a;
}

.layout-status-bar__state--neutral .layout-status-bar__state-icon {
  color: var(--app-text-muted);
}

.layout-status-bar__state--danger .layout-status-bar__state-icon {
  color: #dc2626;
}

.layout-status-bar__state:hover .layout-status-bar__state-icon {
  color: #2563eb;
}

.layout-status-bar__state--loading .layout-status-bar__state-icon {
  color: #2563eb;
  animation: layout-status-spin 0.9s linear infinite;
}

.layout-status-bar__content {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.layout-status-bar__database-group {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  margin-left: auto;
}

.layout-status-bar__database-status {
  flex: 0 0 auto;
}

.layout-status-bar__database {
  min-width: 18rem;
  max-width: min(100%, 42rem);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease,
    background-color 0.2s ease;
}

.layout-status-bar__database:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.layout-status-metric {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 92px;
  max-width: 100%;
  padding: 0.48rem 0.68rem;
  border-radius: 0.8rem;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease,
    border-color 0.2s ease, box-shadow 0.2s ease;
}

.layout-status-metric__label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  white-space: nowrap;
}

.layout-status-metric__value {
  font-size: 0.9rem;
  line-height: 1.1;
  color: var(--app-text);
  white-space: nowrap;
}

.layout-status-metric--link:hover {
  transform: translateY(-1px);
  background: var(--app-surface);
  border-color: rgba(59, 130, 246, 0.26);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 24px rgba(15, 23, 42, 0.18);
}

.layout-status-metric--blue {
  background: linear-gradient(
      180deg,
      rgba(37, 99, 235, 0.2),
      rgba(29, 78, 216, 0.12)
    ),
    var(--app-surface-muted);
  border-color: rgba(59, 130, 246, 0.24);
}

.layout-status-metric--amber {
  background: linear-gradient(
      180deg,
      rgba(245, 158, 11, 0.2),
      rgba(217, 119, 6, 0.12)
    ),
    var(--app-surface-muted);
  border-color: rgba(245, 158, 11, 0.24);
}

.layout-status-metric--emerald {
  background: linear-gradient(
      180deg,
      rgba(16, 185, 129, 0.2),
      rgba(5, 150, 105, 0.12)
    ),
    var(--app-surface-muted);
  border-color: rgba(16, 185, 129, 0.24);
}

.layout-status-metric--slate {
  background: linear-gradient(
      180deg,
      rgba(148, 163, 184, 0.16),
      rgba(100, 116, 139, 0.12)
    ),
    var(--app-surface-muted);
  border-color: rgba(148, 163, 184, 0.2);
}

.layout-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  padding: 0.42rem 0.68rem;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  font-size: 0.74rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-status-chip__label {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.layout-status-chip__value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-status-chip--link {
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.layout-status-chip--link:hover {
  background: var(--app-surface-muted);
  color: var(--app-text);
}

.layout-status-chip--accent {
  background: rgba(219, 234, 254, 0.82);
  color: #1e40af;
}

.layout-status-chip--neutral {
  background: var(--app-surface-muted);
  color: var(--app-text);
  border-color: var(--app-border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.layout-status-chip--success {
  background: rgba(220, 252, 231, 0.92);
  border-color: rgba(34, 197, 94, 0.28);
  color: #166534;
}

.layout-status-chip--danger {
  background: rgba(254, 226, 226, 0.92);
  border-color: rgba(239, 68, 68, 0.28);
  color: #991b1b;
}

:global(html.dark) .layout-status-chip--success {
  background: rgba(20, 83, 45, 0.62);
  border-color: rgba(74, 222, 128, 0.28);
  color: #dcfce7;
}

:global(html.dark) .layout-status-chip--danger {
  background: rgba(127, 29, 29, 0.52);
  border-color: rgba(248, 113, 113, 0.28);
  color: #fee2e2;
}

.layout-status-bar__database-icon {
  font-size: 0.95rem;
  color: currentColor;
  flex: 0 0 auto;
}

.layout-status-bar__database .layout-status-chip__value {
  color: currentColor;
}

@keyframes layout-status-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .layout-status-bar {
    align-items: flex-start;
    padding-bottom: 0.8rem;
  }

  .layout-status-bar__intro {
    flex-basis: 100%;
    min-width: 0;
  }

  .layout-status-bar__content {
    flex-basis: 100%;
  }

  .layout-status-bar__database-group {
    width: 100%;
    margin-left: 0;
  }

  .layout-status-bar__database {
    min-width: 0;
    flex: 1 1 auto;
  }

  .layout-status-metric {
    min-width: calc(50% - 0.4rem);
    flex: 1 1 calc(50% - 0.4rem);
  }
}

@media (max-width: 640px) {
  .layout-status-bar {
    gap: 0.65rem;
    padding-inline: 0.7rem;
  }

  .layout-status-bar__headline {
    align-items: flex-start;
    flex-direction: column;
  }

  .layout-status-bar__database-group {
    flex-direction: column;
    align-items: stretch;
  }

  .layout-status-metric,
  .layout-status-chip {
    width: 100%;
  }
}
</style>
