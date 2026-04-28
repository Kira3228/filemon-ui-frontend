import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import { Layout } from "@/layout";
import FileDetailsPage from "@/pages/FileDetailsPage/ui/FileDetailsPage.vue";
import AnalysisFilesPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisFilesPage/AnalysisFilesPage.vue";
import AnalysisPropagationDiagramPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisPropagationDiagramPage/AnalysisPropagationDiagramPage.vue";
import AnalysisFilesTreePage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisFilesTreePage/AnalysisFilesTreePage.vue";
import AnalysisChainPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisChainPage/AnalysisChainPage.vue";
import AnalysisSettingsPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisSettingsPage/AnalysisSettingsPage.vue";
import { getDefaultAnalysisTabPath } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import AnalysisSourcesPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisSourcesPage/AnalysisSourcesPage.vue";
import AnalysisOperationsPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisOperationsPage/AnalysisOperationsPage.vue";
import AnalysisTimelinePage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisTimelinePage/AnalysisTimelinePage.vue";
import AnalysisStatusesPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisStatusesPage/AnalysisStatusesPage.vue";
import AnalysisRenamePage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisRenamePage/AnalysisRenamePage.vue";
import AnalysisProcessesPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisProcessesPage/AnalysisProcessesPage.vue";
import AnalysisGraphPage from "@/pages/AnalysisWorkspace/ui/pages/AnalysisGraphPage/AnalysisGraphPage.vue";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: "/",
    redirect: () => getDefaultAnalysisTabPath(),
    component: Layout,
    children: [
      {
        path: "/details",
        redirect: () => getDefaultAnalysisTabPath(),
      },
      {
        path: "/analysis",
        component: FileDetailsPage,
        children: [
          {
            path: "",
            redirect: () => getDefaultAnalysisTabPath(),
          },
          {
            path: "sources",
            name: "analysis-sources",
            component: AnalysisSourcesPage,
          },
          {
            path: "timeline",
            name: "analysis-timeline",
            component: AnalysisTimelinePage,
          },
          {
            path: "files",
            name: "analysis-files",
            component: AnalysisFilesPage,
          },
          {
            path: "propagation-diagram",
            name: "analysis-propagation-diagram",
            component: AnalysisPropagationDiagramPage,
          },
          {
            path: "files-tree",
            name: "analysis-files-tree",
            component: AnalysisFilesTreePage,
          },
          {
            path: "statuses",
            name: "analysis-statuses",
            component: AnalysisStatusesPage,
          },
          {
            path: "rename",
            name: "analysis-rename",
            component: AnalysisRenamePage,
          },
          {
            path: "processes",
            name: "analysis-processes",
            component: AnalysisProcessesPage,
          },
          {
            path: "operations",
            name: "analysis-operations",
            component: AnalysisOperationsPage,
          },
          {
            path: "graph",
            name: "analysis-graph",
            component: AnalysisGraphPage,
          },
          {
            path: "settings",
            name: "analysis-settings",
            component: AnalysisSettingsPage,
          },
          {
            path: "file/:fileId",
            name: "analysis-file",
            component: AnalysisChainPage,
          },
        ],
      },

    ],
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
