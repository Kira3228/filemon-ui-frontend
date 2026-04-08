<template>
  <div class="analysis-settings-page">
    <section class="app-surface analysis-page-card">
      <header class="analysis-page-header">
        <div>
          <div>Настройки</div>
          <div class="analysis-page-meta">
            Здесь собраны настройки интерфейса и текущая сводка по аналитике.
          </div>
        </div>
        <div class="analysis-settings-actions">
          <button
            v-if="contextualReturnPath"
            type="button"
            class="analysis-settings-reset"
            @click="returnToContext"
          >
            Вернуться назад
          </button>
          <button type="button" class="analysis-settings-reset" @click="resetAllSettings">
            Сбросить интерфейс
          </button>
        </div>
      </header>

      <div class="analysis-settings-grid">
        <article class="analysis-settings-card">
          <div class="analysis-settings-card__title">Интерфейс</div>
          <div class="analysis-settings-card__body">
            <div class="analysis-settings-field">
              <span class="analysis-settings-label">Автообновление данных</span>
              <label class="analysis-settings-toggle">
                <input
                  :checked="autoRefreshEnabledDraft"
                  type="checkbox"
                  @change="handleAutoRefreshToggle"
                />
                <span>{{ autoRefreshEnabledDraft ? "Включено" : "Выключено" }}</span>
              </label>
              <span class="analysis-settings-hint">
                По умолчанию автообновление выключено, данные можно обновить вручную кнопкой.
              </span>
            </div>

            <label class="analysis-settings-field">
              <span class="analysis-settings-label">
                Интервал автообновления: {{ autoRefreshIntervalSecondsDraft }} сек.
              </span>
              <input
                :value="autoRefreshIntervalSecondsDraft"
                class="analysis-settings-native-input"
                type="number"
                :min="AUTO_REFRESH_INTERVAL_MIN_SECONDS"
                :max="AUTO_REFRESH_INTERVAL_MAX_SECONDS"
                step="5"
                @input="handleAutoRefreshIntervalInput"
              />
              <span class="analysis-settings-hint">
                Используется только когда автообновление включено.
              </span>
            </label>

            <label class="analysis-settings-field">
              <span class="analysis-settings-label">Вкладка по умолчанию</span>
              <select
                :value="defaultAnalysisTabKeyDraft"
                class="analysis-settings-native-input"
                @change="handleDefaultAnalysisTabChange"
              >
                <option
                  v-for="section in analysisSections"
                  :key="section.key"
                  :value="section.key"
                >
                  {{ section.label }}
                </option>
              </select>
              <span class="analysis-settings-hint">
                Эта вкладка будет открываться первой, когда сохраненных вкладок еще нет.
              </span>
            </label>

            <label class="analysis-settings-field">
              <span class="analysis-settings-label">Тема</span>
              <select
                :value="themeDraft"
                class="analysis-settings-native-input"
                @change="handleThemeChange"
              >
                <option
                  v-for="option in themeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <div class="analysis-settings-field">
              <span class="analysis-settings-label">Путь к базе данных</span>
              <input
                ref="databasePathInputRef"
                :value="databasePathDraft"
                class="analysis-settings-native-input"
                type="text"
                placeholder="D:\\data\\filemon.db"
                :disabled="databaseLoading || settingsSaving"
                @input="handleDatabasePathInput"
              />
              <span class="analysis-settings-hint">
                Значение сохраняется на сервере и будет использоваться при следующем запуске.
              </span>
            </div>

            <div class="analysis-settings-field">
              <span class="analysis-settings-label">Панели workspace</span>
              <span class="analysis-settings-hint">
                Ширина панелей теперь задается напрямую через docking-разделители в самих рабочих областях.
              </span>
            </div>
          </div>
        </article>

        <article class="analysis-settings-card">
          <div class="analysis-settings-card__title">Текущее состояние</div>
          <div class="analysis-settings-card__body analysis-settings-card__body--compact">
            <div class="analysis-settings-kv">
              <span>Активный источник</span>
              <span>{{ selectedSourceName }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Файл базы данных</span>
              <span>{{ savedDatabasePath || "—" }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Конфиг подключения</span>
              <span>{{ databaseConfigPath || "—" }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Обновлено</span>
              <span>{{ databaseUpdatedAt ? formatTs(databaseUpdatedAt) : "—" }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Снимок</span>
              <span>{{ snapshotAt ? formatTs(snapshotAt) : "Без ограничения" }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Вкладка по умолчанию</span>
              <span>{{ defaultAnalysisTabLabel }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Открытые вкладки</span>
              <span>{{ openTabsLabel }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Автообновление</span>
              <span>{{ autoRefreshEnabled ? "Включено" : "Выключено" }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Интервал обновления</span>
              <span>{{ autoRefreshIntervalSeconds }} сек.</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Файлов в отчете</span>
              <span>{{ reportFilesCount }}</span>
            </div>
            <div class="analysis-settings-kv">
              <span>Источников в отчете</span>
              <span>{{ reportSourcesCount }}</span>
            </div>
          </div>
        </article>
      </div>

      <div class="analysis-settings-footer">
        <span
          v-if="settingsSuccessMessage"
          class="analysis-settings-status analysis-settings-status--success"
        >
          {{ settingsSuccessMessage }}
        </span>
        <span
          v-if="settingsErrorMessage"
          class="analysis-settings-status analysis-settings-status--error"
        >
          {{ settingsErrorMessage }}
        </span>
        <div class="analysis-settings-footer__actions">
          <button
            type="button"
            class="analysis-settings-reset"
            :disabled="settingsSaving || !isSettingsDirty"
            @click="cancelSettings"
          >
            Отмена
          </button>
          <button
            type="button"
            class="analysis-settings-inline-button analysis-settings-inline-button--primary"
            :disabled="!canSaveSettings"
            @click="saveAllSettings"
          >
            {{ settingsSaving ? "Сохранение..." : "Сохранить" }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router/composables";
import { useTheme } from "@/shared-ui/theme/use-theme";
import { useApi } from "@/shared/api/http";
import {
  DatabaseConnectionSettings,
  UpdateDatabaseSettingsRequest,
} from "@/shared/api/contracts";
import {
  useDatabaseState,
} from "@/shared/model/use-database-state";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
import {
  DEFAULT_ANALYSIS_SECTION_KEY,
  analysisSections,
  getAnalysisSectionByKey,
  TAnalysisSectionKey,
} from "../../model/analysis-sections";
import {
  AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS,
  AUTO_REFRESH_INTERVAL_MAX_SECONDS,
  AUTO_REFRESH_INTERVAL_MIN_SECONDS,
  useAnalysisUiSettings,
} from "../../model/use-analysis-ui-settings";

type ThemeMode = "light" | "dark";

const route = useRoute();
const router = useRouter();
const { currentTheme, setTheme } = useTheme();
const { get, patch } = useApi();
const { applyDatabaseState } = useDatabaseState();
const {
  formatTs,
  reloadReportForDatabaseChange,
  report,
  selectedSource,
  snapshotAt,
} = useAnalysisWorkspace();
const {
  autoRefreshEnabled,
  autoRefreshIntervalSeconds,
  defaultAnalysisTabKey,
  openAnalysisTabKeys,
  setAutoRefreshEnabled,
  setAutoRefreshIntervalSeconds,
  setDefaultAnalysisTabKey,
} = useAnalysisUiSettings();
const themeDraft = ref<ThemeMode>("light");
const autoRefreshEnabledDraft = ref(false);
const autoRefreshIntervalSecondsDraft = ref(AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS);
const defaultAnalysisTabKeyDraft = ref<TAnalysisSectionKey>(DEFAULT_ANALYSIS_SECTION_KEY);
const databasePathDraft = ref("");
const savedDatabasePath = ref("");
const databaseConfigPath = ref("");
const databaseUpdatedAt = ref("");
const databaseLoading = ref(false);
const settingsSaving = ref(false);
const settingsSuccessMessage = ref("");
const settingsErrorMessage = ref("");
const databasePathInputRef = ref<HTMLInputElement | null>(null);

const themeOptions = [
  { label: "Светлая", value: "light" },
  { label: "Темная", value: "dark" },
];
const isDatabasePathDirty = computed(() =>
  databasePathDraft.value.trim() !== savedDatabasePath.value.trim(),
);
const isUiSettingsDirty = computed(() =>
  themeDraft.value !== currentTheme.value
  || autoRefreshEnabledDraft.value !== autoRefreshEnabled.value
  || autoRefreshIntervalSecondsDraft.value !== autoRefreshIntervalSeconds.value
  || defaultAnalysisTabKeyDraft.value !== defaultAnalysisTabKey.value,
);
const isSettingsDirty = computed(() => isDatabasePathDirty.value || isUiSettingsDirty.value);
const canSaveSettings = computed(() =>
  !databaseLoading.value
  && !settingsSaving.value
  && Boolean(databasePathDraft.value.trim())
  && isSettingsDirty.value,
);

const selectedSourceName = computed(() =>
  selectedSource.value && selectedSource.value.name ? selectedSource.value.name : "Все источники",
);
const reportFilesCount = computed(() =>
  report.value && report.value.overview && typeof report.value.overview.files !== "undefined"
    ? report.value.overview.files
    : 0,
);
const reportSourcesCount = computed(() =>
  report.value && report.value.overview && typeof report.value.overview.sources !== "undefined"
    ? report.value.overview.sources
    : 0,
);
const defaultAnalysisTabLabel = computed(() =>
  getAnalysisSectionByKey(defaultAnalysisTabKey.value)?.label || "Источники",
);
const openTabsLabel = computed(() =>
  openAnalysisTabKeys.value
    .map((key) => getAnalysisSectionByKey(key)?.label || key)
    .join(", "),
);
const contextualReturnPath = computed(() => {
  const rawValue = route.query.returnTo;
  if (Array.isArray(rawValue)) {
    return rawValue[0] || "";
  }

  return typeof rawValue === "string" ? rawValue : "";
});

const applyDatabaseSettings = (settings: DatabaseConnectionSettings) => {
  savedDatabasePath.value = settings.databasePath || "";
  databasePathDraft.value = settings.databasePath || "";
  databaseConfigPath.value = settings.configPath || "";
  databaseUpdatedAt.value = settings.updatedAt || "";
  applyDatabaseState(settings);
};

const syncDraftsFromCurrentSettings = () => {
  themeDraft.value = currentTheme.value as ThemeMode;
  autoRefreshEnabledDraft.value = autoRefreshEnabled.value;
  autoRefreshIntervalSecondsDraft.value = autoRefreshIntervalSeconds.value;
  defaultAnalysisTabKeyDraft.value = defaultAnalysisTabKey.value;
};

const clearSettingsMessages = () => {
  settingsSuccessMessage.value = "";
  settingsErrorMessage.value = "";
};

const loadDatabaseSettings = async () => {
  databaseLoading.value = true;
  settingsErrorMessage.value = "";

  try {
    const settings = await get<DatabaseConnectionSettings>("/settings/database");
    applyDatabaseSettings(settings);

    if (route.query.focusDatabasePath) {
      focusDatabasePathInput();
    }
  } catch (error: unknown) {
    settingsErrorMessage.value = error instanceof Error
      ? error.message
      : "Не удалось загрузить настройки базы данных.";
  } finally {
    databaseLoading.value = false;
  }
};

const handleThemeChange = (event: Event) => {
  themeDraft.value = ((event.target as HTMLSelectElement)?.value || "light") as ThemeMode;
  clearSettingsMessages();
};

const handleDatabasePathInput = (event: Event) => {
  databasePathDraft.value = (event.target as HTMLInputElement)?.value || "";
  clearSettingsMessages();
};

const handleAutoRefreshToggle = (event: Event) => {
  autoRefreshEnabledDraft.value = Boolean((event.target as HTMLInputElement)?.checked);
  clearSettingsMessages();
};

const handleDefaultAnalysisTabChange = (event: Event) => {
  defaultAnalysisTabKeyDraft.value =
    (event.target as HTMLSelectElement)?.value as TAnalysisSectionKey;
  clearSettingsMessages();
};

const handleAutoRefreshIntervalInput = (event: Event) => {
  const nextValue = Number((event.target as HTMLInputElement)?.value);
  if (!Number.isFinite(nextValue)) {
    autoRefreshIntervalSecondsDraft.value = AUTO_REFRESH_INTERVAL_MIN_SECONDS;
    clearSettingsMessages();
    return;
  }

  autoRefreshIntervalSecondsDraft.value = Math.max(
    AUTO_REFRESH_INTERVAL_MIN_SECONDS,
    Math.min(AUTO_REFRESH_INTERVAL_MAX_SECONDS, nextValue),
  );
  clearSettingsMessages();
};

const cancelSettings = () => {
  syncDraftsFromCurrentSettings();
  databasePathDraft.value = savedDatabasePath.value;
  clearSettingsMessages();
};

const saveAllSettings = async () => {
  const nextDatabasePath = databasePathDraft.value.trim();
  if (!nextDatabasePath) {
    settingsErrorMessage.value = "Укажите путь к базе данных.";
    settingsSuccessMessage.value = "";
    return;
  }

  settingsSaving.value = true;
  settingsSuccessMessage.value = "";
  settingsErrorMessage.value = "";

  try {
    if (isDatabasePathDirty.value) {
      const settings = await patch<DatabaseConnectionSettings, UpdateDatabaseSettingsRequest>("/settings/database", {
        databasePath: nextDatabasePath,
      });

      applyDatabaseSettings(settings);
      await reloadReportForDatabaseChange();
    }

    setTheme(themeDraft.value);
    setAutoRefreshEnabled(autoRefreshEnabledDraft.value);
    setAutoRefreshIntervalSeconds(autoRefreshIntervalSecondsDraft.value);
    setDefaultAnalysisTabKey(defaultAnalysisTabKeyDraft.value);
    settingsSuccessMessage.value = "Настройки сохранены.";
  } catch (error: unknown) {
    settingsErrorMessage.value = error instanceof Error
      ? error.message
      : "Не удалось сохранить настройки.";
  } finally {
    settingsSaving.value = false;
  }
};

const resetAllSettings = () => {
  themeDraft.value = "light";
  autoRefreshEnabledDraft.value = false;
  autoRefreshIntervalSecondsDraft.value = AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS;
  defaultAnalysisTabKeyDraft.value = DEFAULT_ANALYSIS_SECTION_KEY;
  clearSettingsMessages();
};

const returnToContext = () => {
  if (!contextualReturnPath.value) {
    return;
  }

  router.push(contextualReturnPath.value).catch(() => {});
};

const focusDatabasePathInput = async () => {
  await nextTick();
  if (!databasePathInputRef.value) {
    return;
  }

  databasePathInputRef.value.focus();
  databasePathInputRef.value.select();
  databasePathInputRef.value.scrollIntoView({
    block: "center",
    behavior: "smooth",
  });
};

onMounted(() => {
  syncDraftsFromCurrentSettings();
  loadDatabaseSettings();

  if (route.query.focusDatabasePath) {
    focusDatabasePathInput();
  }
});

watch(
  () => route.query.focusDatabasePath,
  (focusToken) => {
    if (!focusToken) {
      return;
    }

    focusDatabasePathInput();
  },
  { immediate: true },
);
</script>

<style scoped>
@import "../styles/analysis-card-surface.css";

.analysis-settings-page {
  min-width: 0;
}

.analysis-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: var(--analysis-header-margin);
  font-size: var(--analysis-heading-size);
  font-weight: var(--analysis-heading-weight);
}

.analysis-settings-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.analysis-page-meta {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  font-weight: var(--analysis-meta-weight);
  line-height: var(--analysis-meta-line-height);
}

.analysis-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.analysis-settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.analysis-settings-footer__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.analysis-settings-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: var(--analysis-surface-radius);
  background: var(--app-surface);
}

.analysis-settings-card__title {
  font-size: 0.95rem;
  font-weight: 700;
}

.analysis-settings-card__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.analysis-settings-card__body--compact {
  gap: 0.7rem;
}

.analysis-settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.analysis-settings-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--app-text);
}

.analysis-settings-hint {
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.analysis-settings-status {
  font-size: 0.78rem;
  line-height: 1.35;
}

.analysis-settings-status--success {
  color: #15803d;
}

.analysis-settings-status--error {
  color: #b91c1c;
}

.analysis-settings-inline {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.analysis-settings-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 42px;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: 0.85rem;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
}

.analysis-settings-toggle input {
  margin: 0;
}

.analysis-settings-native-input,
.analysis-settings-inline-button,
.analysis-settings-reset {
  border: 1px solid var(--app-border);
  border-radius: 0.85rem;
  background: var(--app-surface);
  color: var(--app-text);
}

.analysis-settings-native-input {
  width: 100%;
  min-height: 42px;
  padding: 0.65rem 0.85rem;
}

.analysis-settings-inline-button,
.analysis-settings-reset {
  padding: 0.65rem 0.95rem;
  cursor: pointer;
  font-weight: 600;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}

.analysis-settings-inline-button:hover,
.analysis-settings-reset:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.analysis-settings-inline-button:disabled,
.analysis-settings-reset:disabled {
  opacity: 0.5;
  cursor: default;
}

.analysis-settings-inline-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.analysis-settings-inline-button--primary:hover {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.analysis-settings-range {
  width: 100%;
}

.analysis-settings-kv {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.82rem;
}

.analysis-settings-kv span:last-child {
  text-align: right;
  color: var(--app-text-muted);
  word-break: break-word;
}

@media (max-width: 768px) {
  .analysis-page-header,
  .analysis-settings-actions,
  .analysis-settings-footer,
  .analysis-settings-footer__actions,
  .analysis-settings-kv {
    flex-direction: column;
    align-items: stretch;
  }

  .analysis-settings-kv span:last-child {
    text-align: left;
  }

  .analysis-settings-toggle {
    width: 100%;
  }
}
</style>
