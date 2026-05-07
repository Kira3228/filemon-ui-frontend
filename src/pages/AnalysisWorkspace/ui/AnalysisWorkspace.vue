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
        <div class="analysis-workspace-notices">
          <Message v-if="error" severity="error" :closable="false">
            {{ error }}
          </Message>
          <Message
            v-for="notice in (report && report.notices) || []"
            :key="notice"
            severity="warn"
            :closable="false"
          >
            {{ notice }}
          </Message>
        </div>

        <nav class="analysis-tabs">
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

        <section class="min-w-0 analysis-workspace-main">
          <RouterView class="analysis-workspace-view" />
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
import AnalysisChainDrawer from "./components/AnalysisChainDrawer/AnalysisChainDrawer.vue";

const route = useRoute();
const router = useRouter();
const dockRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const viewportWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 0,
);
const dockWidth = ref(0);
const sharedDrawerWidth = ref(SHARED_DOCK_DEFAULT_WIDTH);

const { ensureReportLoaded, error, report } = useAnalysisWorkspace();

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
  sharedDrawerWidth.value = clampDrawerWidth(width);
};

const drawerStyle = computed(() => {
  if (!showSharedDrawer.value) {
    return undefined;
  }
  if (!isWideDockLayout.value) {
    return { width: "100%", minWidth: "0" };
  }

  return {
    width: `${clampDrawerWidth(sharedDrawerWidth.value)}px`,
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

  await router.push(fallbackSection.to).catch(() => undefined);
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
    await ensureReportLoaded();
  } catch (err) {
    void err;
  }
});

onBeforeUnmount(() => {
  stopResize();
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleViewportResize);
  }
});
</script>
<style scoped src="./AnalysisWorkspace.css"></style>
