<template>
  <div class="layout-shell">
    <div class="layout-main">
      <AppMenu :items="menuItems" @menu-click="handleMenuClick" />
      <div class="p-4 flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
        <RouterView class="flex-1 min-h-0" />
      </div>
    </div>

    <LayoutStatusBar v-if="showStatusBar" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView } from "vue-router";
import { useRoute } from "vue-router/composables";
import { Menu as AppMenu, TMenuItem } from "@/components/Menu";
import {
  analysisSections,
  getAnalysisSectionByPath,
} from "@/pages/AnalysisWorkspace/model/analysis-sections";
import { useAnalysisUiSettings } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import LayoutStatusBar from "./LayoutStatusBar.vue";

const { openAnalysisTab } = useAnalysisUiSettings();
const route = useRoute();

const showStatusBar = computed(() => route.path.startsWith("/analysis"));

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
</script>

<style src="./Layout.css" scoped lang="css"></style>
