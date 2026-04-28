import { ref } from "vue";
import {
  DEFAULT_ANALYSIS_SECTION_KEY,
  TAnalysisSectionKey,
  getAnalysisSectionByKey,
  normalizeAnalysisSectionKeys,
} from "./analysis-sections";

const AUTO_REFRESH_ENABLED_KEY = "analysis-auto-refresh-enabled";
const AUTO_REFRESH_INTERVAL_KEY = "analysis-auto-refresh-interval-seconds";
const DEFAULT_ANALYSIS_TAB_KEY = "analysis-default-tab-key";
const FILE_DETAILS_VISIBLE_KEY = "analysis-file-details-visible";
const OPEN_ANALYSIS_TABS_KEY = "analysis-open-tab-keys";

export const SHARED_DOCK_MIN_WIDTH = 300;
export const SHARED_DOCK_MAX_WIDTH = 720;
export const SHARED_DOCK_DEFAULT_WIDTH = 360;
export const SHARED_DOCK_BREAKPOINT = 1280;

export const FILES_DOCK_MIN_WIDTH = 680;
export const FILES_DOCK_MAX_WIDTH = 1600;
export const FILES_DOCK_DEFAULT_WIDTH = 1180;
export const AUTO_REFRESH_INTERVAL_MIN_SECONDS = 5;
export const AUTO_REFRESH_INTERVAL_MAX_SECONDS = 3600;
export const AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS = 30;

const autoRefreshEnabled = ref(false);
const autoRefreshIntervalSeconds = ref(AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS);
const defaultAnalysisTabKey = ref<TAnalysisSectionKey>(DEFAULT_ANALYSIS_SECTION_KEY);
const fileDetailsVisible = ref(true);
const openAnalysisTabKeys = ref<TAnalysisSectionKey[]>([DEFAULT_ANALYSIS_SECTION_KEY]);

let isInitialized = false;

const clampValue = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const readStoredBoolean = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (stored === null) {
    return fallback;
  }

  return stored === "true";
};

const readStoredNumber = (key: string, fallback: number, min: number, max: number) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (stored === null || stored === "") {
    return fallback;
  }

  const parsed = Number(stored);
  return Number.isFinite(parsed) ? clampValue(parsed, min, max) : fallback;
};

const readStoredTabKey = (key: string, fallback: TAnalysisSectionKey) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  return (getAnalysisSectionByKey(stored)?.key || fallback) as TAnalysisSectionKey;
};

const readStoredTabKeys = (key: string, fallback: TAnalysisSectionKey[]) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    return normalizeAnalysisSectionKeys(parsed, fallback[0] || DEFAULT_ANALYSIS_SECTION_KEY);
  } catch {
    return fallback;
  }
};

const persistValue = (key: string, value: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
};

const persistTabKeys = (key: string, value: TAnalysisSectionKey[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const ensureInitialized = () => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  autoRefreshEnabled.value = readStoredBoolean(AUTO_REFRESH_ENABLED_KEY, false);

  autoRefreshIntervalSeconds.value = readStoredNumber(
    AUTO_REFRESH_INTERVAL_KEY,
    AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS,
    AUTO_REFRESH_INTERVAL_MIN_SECONDS,
    AUTO_REFRESH_INTERVAL_MAX_SECONDS,
  );

  defaultAnalysisTabKey.value = readStoredTabKey(
    DEFAULT_ANALYSIS_TAB_KEY,
    DEFAULT_ANALYSIS_SECTION_KEY,
  );
  
  fileDetailsVisible.value = readStoredBoolean(FILE_DETAILS_VISIBLE_KEY, true);
  openAnalysisTabKeys.value = readStoredTabKeys(
    OPEN_ANALYSIS_TABS_KEY,
    [defaultAnalysisTabKey.value],
  );
};

const setAutoRefreshEnabled = (enabled: boolean) => {
  ensureInitialized();
  autoRefreshEnabled.value = enabled;
  persistValue(AUTO_REFRESH_ENABLED_KEY, String(enabled));
};

const setAutoRefreshIntervalSeconds = (value: number) => {
  ensureInitialized();
  autoRefreshIntervalSeconds.value = clampValue(
    value,
    AUTO_REFRESH_INTERVAL_MIN_SECONDS,
    AUTO_REFRESH_INTERVAL_MAX_SECONDS,
  );
  persistValue(AUTO_REFRESH_INTERVAL_KEY, String(autoRefreshIntervalSeconds.value));
};

const setDefaultAnalysisTabKey = (value: TAnalysisSectionKey) => {
  ensureInitialized();
  defaultAnalysisTabKey.value = (getAnalysisSectionByKey(value)?.key
    || DEFAULT_ANALYSIS_SECTION_KEY) as TAnalysisSectionKey;
  persistValue(DEFAULT_ANALYSIS_TAB_KEY, defaultAnalysisTabKey.value);
};

const setFileDetailsVisible = (value: boolean) => {
  ensureInitialized();
  fileDetailsVisible.value = value;
  persistValue(FILE_DETAILS_VISIBLE_KEY, String(value));
};

const setOpenAnalysisTabKeys = (keys: TAnalysisSectionKey[]) => {
  ensureInitialized();
  openAnalysisTabKeys.value = normalizeAnalysisSectionKeys(keys, defaultAnalysisTabKey.value);
  persistTabKeys(OPEN_ANALYSIS_TABS_KEY, openAnalysisTabKeys.value);
};

const openAnalysisTab = (key: TAnalysisSectionKey) => {
  ensureInitialized();
  setOpenAnalysisTabKeys([...openAnalysisTabKeys.value, key]);
};

const closeAnalysisTab = (key: TAnalysisSectionKey) => {
  ensureInitialized();
  setOpenAnalysisTabKeys(openAnalysisTabKeys.value.filter((tabKey) => tabKey !== key));
};

const resetAnalysisUiSettings = () => {
  setAutoRefreshEnabled(false);
  setAutoRefreshIntervalSeconds(AUTO_REFRESH_INTERVAL_DEFAULT_SECONDS);
  setDefaultAnalysisTabKey(DEFAULT_ANALYSIS_SECTION_KEY);
  setFileDetailsVisible(true);
  setOpenAnalysisTabKeys([DEFAULT_ANALYSIS_SECTION_KEY]);
};

export const useAnalysisUiSettings = () => {
  ensureInitialized();

  return {
    autoRefreshEnabled,
    autoRefreshIntervalSeconds,
    defaultAnalysisTabKey,
    fileDetailsVisible,
    openAnalysisTabKeys,
    setAutoRefreshEnabled,
    setAutoRefreshIntervalSeconds,
    setDefaultAnalysisTabKey,
    setFileDetailsVisible,
    setOpenAnalysisTabKeys,
    openAnalysisTab,
    closeAnalysisTab,
    resetAnalysisUiSettings,
  };
};

export const getDefaultAnalysisTabPath = () => {
  return getAnalysisSectionByKey(readStoredTabKey(DEFAULT_ANALYSIS_TAB_KEY, DEFAULT_ANALYSIS_SECTION_KEY))?.to
    || getAnalysisSectionByKey(DEFAULT_ANALYSIS_SECTION_KEY)?.to
    || "/analysis/sources";

}

