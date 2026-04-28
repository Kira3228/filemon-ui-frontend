<template>
  <div class="app-surface layout-status-bar">
    <div class="layout-status-bar__intro">
      <div class="layout-status-bar__headline">
        <UiButton
          @click="handleRefreshClick"
          :disabled="loading"
          variant="secondary"
          size="xSmall"
        >
          <span
            class="material-icons layout-status-bar__state-icon"
            aria-hidden="true"
            >{{ refreshStatusIcon }}</span
          >
          {{ refreshStatusLabel }}
        </UiButton>
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
          <span v-if="!isLoading" class="layout-status-metric__label">{{
            stat.label
          }}</span>
          <i v-else class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
          <strong class="layout-status-metric__value">{{ stat.value }}</strong>
        </RouterLink>
        <span
          v-else
          :key="`${stat.label}`"
          class="layout-status-metric"
          :class="`layout-status-metric--${stat.tone}`"
        >
          <span class="layout-status-metric__label">{{ stat.label }}</span>
          <strong class="layout-status-metric__value">{{ stat.value }}</strong>
        </span>
      </template>

      <span
        v-if="selectedSource"
        class="layout-status-chip layout-status-chip--accent"
        :title="selectedSource.path || selectedSource.name"
      >
        <span class="layout-status-chip__label">Источник</span>
        <strong class="layout-status-chip__value">{{ selectedSource.name }}</strong>
      </span>

      <span
        v-if="snapshotAt"
        class="layout-status-chip layout-status-chip--neutral"
      >
        <span class="layout-status-chip__label">Снимок</span>
        <strong class="layout-status-chip__value">{{ formatTs(snapshotAt) }}</strong>
      </span>

      <div class="layout-status-bar__database-group">
        <UiButton
          variant="secondary"
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
        </UiButton>
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
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { RouterLink } from "vue-router";
import { useRoute, useRouter } from "vue-router/composables";
import UiButton from "@/components/UiButton/UiButton.vue";
import { useAnalysisWorkspace } from "@/pages/AnalysisWorkspace/model/use-analysis-workspace";
import { useAnalysisUiSettings } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import { parseRouteFileId } from "@/pages/AnalysisWorkspace/model/file-route-filter";
import { useDatabaseState } from "@/shared/model/use-database-state";
import { buildFileScopedLocation } from "@/shared/utils/buildFileScopedLocation";
import { useGetOverviewStats } from "./useGetOverviewStats";

const { loading, formatTs, refreshReport, selectedSource, snapshotAt } =
  useAnalysisWorkspace();
const { autoRefreshEnabled, autoRefreshIntervalSeconds } =
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

const {
  data,
  isLoading,
  refetch: refetchOverviewStats,
} = useGetOverviewStats();

const isAnalysisRoute = computed(() => route.path.startsWith("/analysis"));
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

const refreshReportAndOverviewStats = async () => {
  await refreshReport();
  await refetchOverviewStats();
};

const handleRefreshClick = () => {
  if (loading.value) {
    return;
  }

  refreshReportAndOverviewStats().catch(() => {
    // Ошибка уже записана в store.
  });
};

const overviewStatusStats = computed(() => [
  {
    label: "Файлов",
    value: data.value?.files ?? 0,
    to: buildFileScopedLocation("/analysis/files", scopedFileId.value),
    tone: "blue",
  },
  {
    label: "Версий файлов",
    value: data.value?.fileVersions ?? 0,
    to: buildFileScopedLocation("/analysis/operations", scopedFileId.value),
    tone: "amber",
  },
  {
    label: "Источников",
    value: data.value?.sources ?? 0,
    to: buildFileScopedLocation("/analysis/sources", scopedFileId.value),
    tone: "emerald",
  },
  {
    label: "Макс. глубина",
    value: data.value?.maxDepth ?? 0,
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
    refreshReportAndOverviewStats().catch(() => {
      // Ошибка уже записана в store.
    });
  }, autoRefreshIntervalSeconds.value * 1000);
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

watch(
  [isAnalysisRoute, autoRefreshEnabled, autoRefreshIntervalSeconds],
  restartAutoRefreshTimer,
  { immediate: true },
);

onMounted(() => {
  loadDatabaseState().catch(() => {});
});

onBeforeUnmount(() => {
  clearAutoRefreshTimer();
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

<style src="./Layout.css" scoped lang="css"></style>
