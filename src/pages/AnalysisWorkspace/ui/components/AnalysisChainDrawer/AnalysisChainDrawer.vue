<template>
  <section
    v-if="selectedChain"
    class="app-surface analysis-drawer"
    :class="{
      'analysis-drawer-card': !embedded,
      'analysis-drawer--embedded': embedded,
    }"
  >
    <header class="analysis-drawer__header">
      <div>
        <RouterLink
          v-if="selectedChain.fileId"
          :to="`/analysis/file/${selectedChain.fileId}`"
          class="analysis-drawer__title analysis-drawer__title-link analysis-file-name"
        >
          {{ selectedChain.name }}
        </RouterLink>
        <div v-else class="analysis-drawer__title analysis-file-name">
          {{ selectedChain.name }}
        </div>
        <div class="analysis-drawer__muted">{{ selectedChain.path }}</div>
      </div>
      <UiButton variant="secondary" type="button" @click="handleCloseDrawer">
        <span class="pi pi-times" aria-hidden="true" />
      </UiButton>
    </header>

    <div class="analysis-drawer__content">
      <div v-if="selectedFile" class="analysis-drawer__section">
        <div class="analysis-drawer__section-title">Метаданные</div>
        <div class="analysis-kv-grid">
          <DrawerRow
            v-for="row in metaDataRows"
            :key="row.label"
            :label="row.label"
            :value="row.value"
          />
        </div>
      </div>

      <AnalysisFileLink
        v-for="link in analysisFileLinks"
        :key="link.section"
        :ariaExpanded="isSectionOpen(link.section)"
        :classValue="
          isSectionOpen(link.section)
            ? 'pi pi-chevron-up'
            : 'pi pi-chevron-down'
        "
        :isSectionOpen="isSectionOpen(link.section)"
        :itemsList="selectedChain[link.itemsKey]"
        :label="link.label"
        @toggle-section="toggleSection(link.section)"
      >
        <template #body="{ items }">
          <template v-if="link.section === 'children'">
            <UiButton
              v-for="item in items"
              :key="item.fileId"
              variant="secondary"
              type="button"
              class="analysis-link-row"
              @click="handleOpenFile(item.fileId)"
            >
              <span class="analysis-file-name">{{ item.name }}</span>
            </UiButton>
          </template>

          <template v-else>
            <div
              v-for="item in items"
              :key="item.fileId"
              class="analysis-pill-row"
            >
              <span class="analysis-file-name">{{ item.name }}</span>
            </div>
          </template>
        </template>
      </AnalysisFileLink>

      <AnalysisFileLink
        v-for="link in analysisInfoLinks"
        :key="link.section"
        :ariaExpanded="isSectionOpen(link.section)"
        :classValue="
          isSectionOpen(link.section)
            ? 'pi pi-chevron-up'
            : 'pi pi-chevron-down'
        "
        :isSectionOpen="isSectionOpen(link.section)"
        :itemsList="link.items"
        :label="link.label"
        @toggle-section="toggleSection(link.section)"
      >
        <template #body="{ items }">
          <div v-if="link.section === 'reads'" class="analysis-mini-table">
            <div
              v-for="reader in items"
              :key="`${selectedChain.fileId}-${reader.processVersionId}`"
              class="analysis-mini-table__row"
            >
              <div class="analysis-mini-table__primary">
                {{ reader.label }}
              </div>
              <div class="analysis-mini-table__secondary">
                {{
                  reader.firstAt
                    ? new Date(reader.firstAt).toLocaleString()
                    : "—"
                }}
              </div>
            </div>
          </div>

          <div
            v-else-if="link.section === 'versions'"
            class="analysis-mini-table"
          >
            <div
              v-for="version in items"
              :key="version.id"
              class="analysis-mini-table__row"
            >
              <div class="analysis-mini-table__primary">
                v{{ version.versionNumber }}
              </div>
              <div class="analysis-mini-table__secondary">
                {{ version.createdBy }}
              </div>
            </div>
          </div>

          <div
            v-else-if="link.section === 'pathHistory'"
            class="analysis-drawer__path-history"
          >
            <div
              v-for="pathItem in items"
              :key="pathItem.id"
              class="analysis-drawer__path-history-item"
              :title="pathItem.value"
            >
              {{ pathItem.value }}
            </div>
          </div>

          <div v-else class="analysis-drawer__path-history">
            <div
              v-for="description in items"
              :key="description.id"
              class="analysis-drawer__path-history-item"
              :title="description.value"
            >
              {{ description.value }}
            </div>
          </div>
        </template>
      </AnalysisFileLink>
    </div>
  </section>
  <section
    v-else
    class="app-surface analysis-drawer"
    :class="{
      'analysis-drawer-card': !embedded,
      'analysis-drawer--embedded': embedded,
    }"
  >
    <div class="analysis-drawer__muted">
      Выберите файл в аналитике, чтобы открыть карточку.
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { useRouter } from "vue-router/composables";

import { UiButton } from "@/components/UiButton";
import { useAnalysisWorkspace } from "@/pages/AnalysisWorkspace/model/use-analysis-workspace";
import { useAnalysisUiSettings } from "@/pages/AnalysisWorkspace/model/use-analysis-ui-settings";
import DrawerRow from "./DrawerRow.vue";
import AnalysisFileLink from "./AnalysisFileLink.vue";

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const router = useRouter();

const { selectedChain, selectedFile, selectedFileTimeline, setSelectedFile } =
  useAnalysisWorkspace();

const { setFileDetailsVisible } = useAnalysisUiSettings();

type SectionKey =
  | "sources"
  | "parents"
  | "children"
  | "reads"
  | "versions"
  | "pathHistory"
  | "eventDescription";

type AnalysisFileLinkItemsKey = "sourceLabels" | "parents" | "children";

interface AnalysisFileLinkSection {
  section: "sources" | "parents" | "children";
  itemsKey: AnalysisFileLinkItemsKey;
  label: string;
}

type AnalysisInfoSectionKey =
  | "reads"
  | "versions"
  | "pathHistory"
  | "eventDescription";

interface AnalysisInfoLinkSection {
  section: AnalysisInfoSectionKey;
  label: string;
  items: any[];
}

const sectionOpenState = ref<Record<SectionKey, boolean>>({
  sources: true,
  parents: true,
  children: true,
  reads: true,
  versions: true,
  pathHistory: true,
  eventDescription: true,
});

const isSectionOpen = (section: SectionKey) => sectionOpenState.value[section];

const toggleSection = (section: SectionKey) => {
  sectionOpenState.value[section] = !sectionOpenState.value[section];
};

const handleOpenFile = (fileId: number | string) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleCloseDrawer = () => {
  setFileDetailsVisible(false);
};

const latestFileEventDescription = computed(
  () => selectedFileTimeline.value[0]?.details || "",
);

const pathHistoryItems = computed(() => {
  const items = selectedFile.value?.pathHistory || [];

  if (!items.length) {
    return [{ id: "path-history-empty", value: "—" }];
  }

  return items.map((value, index) => ({
    id: `${selectedFile.value?.fileId || "file"}-${index}-${value}`,
    value,
  }));
});

const eventDescriptionItems = computed(() => [
  {
    id: "event-description",
    value: latestFileEventDescription.value || "—",
  },
]);

const metaDataRows = computed(() => {
  return [
    {
      label: "Файловая система",
      value:
        selectedFile.value?.filesystem ||
        selectedFile.value?.filesystemUuid ||
        "—",
    },
    {
      label: "Индексный дескриптор (inode)",
      value:
        selectedFile.value?.inode === null ||
        selectedFile.value?.inode === undefined
          ? "—"
          : selectedFile.value.inode,
    },
    {
      label: "Статус",
      value: selectedFile.value?.currentStatus || "—",
    },
    {
      label: "Версий",
      value: selectedFile.value?.versionCount || 0,
    },
    {
      label: "Размер",
      value: selectedFile.value?.sizeBytes || 0,
    },
    {
      label: "Исходный процесс",
      value: selectedFile.value?.originProcess || "—",
    },
    {
      label: "Пользователь",
      value: selectedFile.value?.user || "—",
    },
    {
      label: "Время создания",
      value: selectedFile.value?.birthTime
        ? new Date(selectedFile.value.birthTime).toLocaleString()
        : "—",
    },
    {
      label: "Начало отслеживания",
      value: selectedFile.value?.trackingStartedAt
        ? new Date(selectedFile.value.trackingStartedAt).toLocaleString()
        : "—",
    },
  ];
});

const analysisFileLinks = computed<AnalysisFileLinkSection[]>(() => [
  {
    section: "sources",
    itemsKey: "sourceLabels",
    label: "Источники",
  },
  {
    section: "parents",
    itemsKey: "parents",
    label: "Родители",
  },
  {
    section: "children",
    itemsKey: "children",
    label: "Порожденные файлы",
  },
]);
const analysisInfoLinks = computed<AnalysisInfoLinkSection[]>(() => [
  {
    section: "reads",
    label: "Чтения",
    items: selectedChain.value?.readers || [],
  },
  {
    section: "versions",
    label: "Версии",
    items: selectedChain.value?.versions || [],
  },
  {
    section: "pathHistory",
    label: "История пути",
    items: pathHistoryItems.value,
  },
  {
    section: "eventDescription",
    label: "Описание события",
    items: eventDescriptionItems.value,
  },
]);
</script>
<style scoped src="./AnalysisChainDrawer.css"></style>
