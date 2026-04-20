import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router/composables";
import { useTheme } from "@/plugins/theme";
import { useApi } from "@/shared/api/http";
import {
  DatabaseConnectionSettings,
  UpdateDatabaseSettingsRequest,
} from "@/shared/api/contracts";
import { useDatabaseState } from "@/shared/model/use-database-state";
import { useAnalysisWorkspace } from "./use-analysis-workspace";
import {
  DEFAULT_ANALYSIS_SECTION_KEY,
  analysisSections,
  getAnalysisSectionByKey,
  TAnalysisSectionKey,
} from "./analysis-sections";
import {
  AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS,
  AUTO_REFRESH_INTERVAL_MAX_SECONDS,
  AUTO_REFRESH_INTERVAL_MIN_SECONDS,
  useAnalysisUiSettings,
} from "./use-analysis-ui-settings";

type ThemeMode = "light" | "dark";

export const useAnalysisSettingsPageModel = () => {
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

  return {
    analysisSections,
    autoRefreshEnabled,
    autoRefreshEnabledDraft,
    autoRefreshIntervalSeconds,
    autoRefreshIntervalSecondsDraft,
    canSaveSettings,
    cancelSettings,
    clearSettingsMessages,
    contextualReturnPath,
    databaseConfigPath,
    databaseLoading,
    databasePathDraft,
    databasePathInputRef,
    databaseUpdatedAt,
    defaultAnalysisTabKey,
    defaultAnalysisTabKeyDraft,
    defaultAnalysisTabLabel,
    formatTs,
    handleAutoRefreshIntervalInput,
    handleAutoRefreshToggle,
    handleDatabasePathInput,
    handleDefaultAnalysisTabChange,
    handleThemeChange,
    isDatabasePathDirty,
    isSettingsDirty,
    isUiSettingsDirty,
    openTabsLabel,
    openAnalysisTabKeys,
    reportFilesCount,
    reportSourcesCount,
    resetAllSettings,
    returnToContext,
    savedDatabasePath,
    selectedSourceName,
    settingsErrorMessage,
    settingsSaving,
    settingsSuccessMessage,
    snapshotAt,
    themeDraft,
    themeOptions,
    saveAllSettings,
  };
};
