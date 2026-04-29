<template>
  <div class="analysis-workspace-scroll">
    <div class="p-4 analysis-workspace-container">
      <div
        ref="dockRef"
        class="analysis-workspace-layout"
        :class="{
          'analysis-workspace-layout--with-drawer': showSharedDrawer,
          'analysis-workspace-layout--dragging': isDragging,
        }"
      >
        <section class="min-w-0 analysis-workspace-main">
          <Message v-if="error" severity="error" :closable="false" class="mb-4">
            {{ error }}
          </Message>
          <Message
            v-for="notice in (report && report.notices) || []"
            :key="notice"
            severity="warn"
            :closable="false"
            class="mb-4"
          >
            {{ notice }}
          </Message>

          <nav class="analysis-tabs mb-4">
            <div
              v-for="section in openSections"
              :key="section.key"
              class="analysis-tab"
              :class="{ 'analysis-tab--active': route.path === section.to }"
              role="tab"
              :aria-selected="route.path === section.to ? 'true' : 'false'"
            >
              <RouterLink :to="section.to" class="analysis-tab__link">
                {{ section.label }}
              </RouterLink>
              <button
                type="button"
                class="analysis-tab__close"
                :disabled="openSections.length === 1"
                :aria-label="`Закрыть вкладку ${section.label}`"
                @click.prevent="handleTabClose(section.key)"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </nav>

          <RouterView />
        </section>

        <button
          v-if="showSharedDrawer"
          type="button"
          class="analysis-workspace-resizer"
          aria-label="Изменить ширину explorer"
          @pointerdown="startResize"
        >
          <span />
          <span />
          <span />
        </button>

        <aside
          v-if="showSharedDrawer"
          class="min-w-0 analysis-workspace-drawer-shell"
          :style="drawerStyle"
        >
          <AnalysisChainDrawer embedded />
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterView, RouterLink } from "vue-router";
import { useRoute, useRouter } from "vue-router/composables";
import Message from "primevue/message";
import { useAnalysisWorkspace } from "../model/use-analysis-workspace";
import {
  SHARED_DOCK_DEFAULT_WIDTH,
  SHARED_DOCK_BREAKPOINT,
  SHARED_DOCK_MAX_WIDTH,
  SHARED_DOCK_MIN_WIDTH,
  useAnalysisUiSettings,
} from "../model/use-analysis-ui-settings";
import {
  analysisSections,
  TAnalysisSectionKey,
  getAnalysisSectionByKey,
  getAnalysisSectionByPath,
} from "../model/analysis-sections";
import AnalysisChainDrawer from "./components/AnalysisChainDrawer.vue";

const route = useRoute();
const router = useRouter();
const dockRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const viewportWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 0,
);
const dockWidth = ref(0);
const sharedDrawerRatio = ref(0.3);


const {
  // ensureReportLoaded,
  error,
  report,
} = useAnalysisWorkspace();

const {
  closeAnalysisTab,
  defaultAnalysisTabKey,
  fileDetailsVisible,
  openAnalysisTab,
  openAnalysisTabKeys,
} = useAnalysisUiSettings();

const showSharedDrawer = computed(
  () =>
    fileDetailsVisible.value &&
    route.name !== "analysis-file" &&
    route.name !== "analysis-files" &&
    route.name !== "analysis-settings",
);
const isWideDockLayout = computed(
  () => viewportWidth.value >= SHARED_DOCK_BREAKPOINT,
);
const openSections = computed(() =>
  analysisSections.filter((section) =>
    openAnalysisTabKeys.value.includes(section.key),
  ),
);

const clampDrawerWidth = (width: number) => {
  if (typeof window === "undefined") {
    return width;
  }
  const availableDockWidth =
    dockWidth.value ||
    dockRef.value?.clientWidth ||
    viewportWidth.value ||
    window.innerWidth;
  const maxWidth = Math.max(
    SHARED_DOCK_MIN_WIDTH,
    Math.min(SHARED_DOCK_MAX_WIDTH, availableDockWidth - 320),
  );
  return Math.max(SHARED_DOCK_MIN_WIDTH, Math.min(maxWidth, width));
};

const setDrawerWidthFromPx = (width: number) => {
  const availableDockWidth =
    dockWidth.value ||
    dockRef.value?.clientWidth ||
    viewportWidth.value ||
    width;
  if (!availableDockWidth) {
    return;
  }

  sharedDrawerRatio.value = clampDrawerWidth(width) / availableDockWidth;
};

const drawerStyle = computed(() => {
  if (!showSharedDrawer.value) {
    return undefined;
  }
  if (!isWideDockLayout.value) {
    return { width: "100%", minWidth: "0" };
  }

  return {
    width: `${clampDrawerWidth(
      (dockWidth.value || viewportWidth.value || SHARED_DOCK_DEFAULT_WIDTH) *
        sharedDrawerRatio.value,
    )}px`,
    minWidth: `${SHARED_DOCK_MIN_WIDTH}px`,
  };
});

const handleResize = (event: PointerEvent) => {
  if (!dockRef.value) {
    return;
  }
  const bounds = dockRef.value.getBoundingClientRect();
  dockWidth.value = bounds.width;
  setDrawerWidthFromPx(bounds.right - event.clientX);
};

const stopResize = () => {
  if (typeof window === "undefined") {
    return;
  }
  isDragging.value = false;
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
  window.removeEventListener("pointercancel", stopResize);
};

const startResize = (event: PointerEvent) => {
  if (typeof window === "undefined" || !isWideDockLayout.value) {
    return;
  }
  event.preventDefault();
  isDragging.value = true;
  window.addEventListener("pointermove", handleResize);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
};

const handleViewportResize = () => {
  if (typeof window === "undefined") {
    return;
  }
  viewportWidth.value = window.innerWidth;
  dockWidth.value = dockRef.value?.clientWidth || viewportWidth.value;
};

const resolveFallbackTabKey = (closedKey: TAnalysisSectionKey) => {
  const currentIndex = openSections.value.findIndex(
    (section) => section.key === closedKey,
  );
  const remainingSections = openSections.value.filter(
    (section) => section.key !== closedKey,
  );

  if (!remainingSections.length) {
    return defaultAnalysisTabKey.value;
  }

  return remainingSections[Math.min(currentIndex, remainingSections.length - 1)]
    .key;
};

const handleTabClose = async (key: TAnalysisSectionKey) => {
  const activeSection = getAnalysisSectionByPath(route.path);
  const fallbackKey = resolveFallbackTabKey(key);

  closeAnalysisTab(key);

  if (activeSection?.key !== key) {
    return;
  }

  const fallbackSection = getAnalysisSectionByKey(fallbackKey);
  if (!fallbackSection || fallbackSection.to === route.path) {
    return;
  }

  await router.push(fallbackSection.to).catch(() => {});
};

watch(
  () => route.path,
  (path) => {
    const section = getAnalysisSectionByPath(path);
    if (!section) {
      return;
    }

    openAnalysisTab(section.key);
  },
  { immediate: true },
);

onMounted(async () => {
  if (typeof window !== "undefined") {
    handleViewportResize();
    setDrawerWidthFromPx(SHARED_DOCK_DEFAULT_WIDTH);
    window.addEventListener("resize", handleViewportResize);
  }

  try {
    //
  } catch (err) {
    // Ошибка уже записана в store.
  }
});

onBeforeUnmount(() => {
  stopResize();
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleViewportResize);
  }
});
</script>
<style scoped>
@import "./styles/analysis-card-surface.css";

.analysis-workspace-scroll {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  --analysis-shell-border: var(--app-border);
  --analysis-shell-bg: linear-gradient(
    180deg,
    var(--app-surface-muted),
    var(--app-surface)
  );
  --analysis-main-bg: var(--app-surface);
  --analysis-resizer-left: var(--app-border);
  --analysis-resizer-right: var(--app-border);
  --analysis-resizer-bg: linear-gradient(
    180deg,
    var(--app-surface-muted),
    var(--app-surface)
  );
  --analysis-drawer-border: var(--app-border);
  --analysis-drawer-bg: var(--app-surface);
  --analysis-tab-bg: linear-gradient(
    180deg,
    var(--app-surface-muted),
    var(--app-surface)
  );
  --analysis-tab-hover-bg: linear-gradient(
    180deg,
    rgba(59, 130, 246, 0.12),
    var(--app-surface-muted)
  );
  --analysis-tab-active-bg: linear-gradient(
    180deg,
    rgba(59, 130, 246, 0.2),
    var(--app-surface)
  );
  --analysis-tab-close-hover-bg: var(--app-surface-muted);
  --analysis-card-padding: 1rem;
  --analysis-card-radius: 0.95rem;
  --analysis-header-gap: 0.75rem;
  --analysis-header-margin: 0.9rem;
  --analysis-heading-size: 0.95rem;
  --analysis-heading-weight: 600;
  --analysis-meta-size: 0.8rem;
  --analysis-meta-weight: 400;
  --analysis-meta-line-height: 1.35;
  --analysis-table-font-size: 10px;
  --analysis-table-line-height: 1.2;
  --analysis-caption-size: 0.72rem;
  --analysis-caption-line-height: 1.2;
  --analysis-control-padding: 0.45rem 0.8rem;
  --analysis-control-radius: 0.8rem;
  --analysis-control-font-size: 0.8rem;
  --analysis-surface-padding: 1rem;
  --analysis-surface-radius: 0.85rem;
  --analysis-badge-padding: 0.2rem 0.55rem;
  --analysis-badge-font-size: 0.7rem;
  --analysis-section-title-size: 0.78rem;
  --analysis-section-title-spacing: 0.08em;
  --analysis-stat-label-size: 0.8rem;
  --analysis-stat-value-size: 1.2rem;
  --analysis-drawer-title-size: 1.05rem;
}

.analysis-workspace-container {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 100%;
}

.analysis-workspace-layout {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  padding: 0.1rem;
  border: 1px solid var(--analysis-shell-border);
  border-radius: var(--analysis-card-radius);
  background: var(--analysis-shell-bg);
  min-height: 100%;
  overflow: hidden;
}

.analysis-workspace-layout--dragging {
  user-select: none;
  cursor: col-resize;
}

.analysis-workspace-layout--with-drawer {
  grid-template-columns: minmax(0, 1fr) 16px auto;
  align-items: stretch;
}

.analysis-workspace-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0.8rem 0.9rem 0.9rem;
  background: var(--analysis-main-bg);
  overflow: hidden;
}

.analysis-workspace-resizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 0;
  border-left: 1px solid var(--analysis-resizer-left);
  border-right: 1px solid var(--analysis-resizer-right);
  background: var(--analysis-resizer-bg);
  cursor: col-resize;
}

.analysis-workspace-resizer span {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.9);
}

.analysis-workspace-drawer-shell {
  display: flex;
  min-width: 0;
  padding: 0.75rem;
  border-left: 1px solid var(--analysis-drawer-border);
  background: var(--analysis-drawer-bg);
  overflow: hidden;
}

.analysis-tabs {
  display: flex;
  align-items: flex-end;
  gap: 0.125rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 1px;
  border-bottom: 1px solid var(--app-border);
  scrollbar-width: thin;
  scrollbar-color: var(--app-border) var(--app-surface);
}

.analysis-tabs::-webkit-scrollbar {
  height: 8px;
}

.analysis-tabs::-webkit-scrollbar-track {
  background: var(--app-surface);
}

.analysis-tabs::-webkit-scrollbar-thumb {
  border: 2px solid var(--app-surface);
  border-radius: 999px;
  background: var(--app-border);
}

.analysis-tabs::-webkit-scrollbar-thumb:hover {
  background: var(--app-text-muted);
}

.analysis-tab {
  display: inline-flex;
  align-items: stretch;
  flex: 0 0 auto;
  min-height: 42px;
  color: var(--app-text);
  background: var(--analysis-tab-bg);
  border: 1px solid transparent;
  border-bottom: 2px solid transparent;
  border-radius: var(--analysis-surface-radius) var(--analysis-surface-radius) 0
    0;
  white-space: nowrap;
  transition: color 0.2s ease, background-color 0.2s ease,
    border-color 0.2s ease;
}

.analysis-tab:hover {
  color: #2563eb;
  background: var(--analysis-tab-hover-bg);
}

.analysis-tab--active {
  border-color: var(--app-border);
  border-bottom-color: #2563eb;
  background: var(--analysis-tab-active-bg);
  color: #2563eb;
  box-shadow: inset 0 1px 0 rgba(37, 99, 235, 0.08);
}

.analysis-tab__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0.7rem 0.65rem 0.8rem 1rem;
  color: inherit;
  text-decoration: none;
}

.analysis-tab__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  border: 0;
  padding: 0;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  border-radius: 0 0.75rem 0 0;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.analysis-tab__close:hover {
  background: var(--analysis-tab-close-hover-bg);
}

.analysis-tab__close:disabled {
  opacity: 0.35;
  cursor: default;
}

.analysis-tab__close .material-icons {
  font-size: 1rem;
}

@media (max-width: 1279px) {
  .analysis-workspace-layout {
    min-height: 100%;
  }

  .analysis-workspace-layout--with-drawer {
    grid-template-columns: minmax(0, 1fr);
  }

  .analysis-workspace-resizer {
    display: none;
  }

  .analysis-workspace-drawer-shell {
    width: auto !important;
    padding-top: 0;
    border-left: 0;
    border-top: 1px solid var(--analysis-drawer-border);
  }

  .analysis-workspace-main {
    padding-bottom: 1rem;
  }
}
</style>
