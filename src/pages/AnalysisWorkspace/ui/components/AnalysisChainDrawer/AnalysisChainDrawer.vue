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
          isSectionOpen(link.section) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
        "
        :isSectionOpen="isSectionOpen(link.section)"
        :itemsList="selectedChain[link.itemsKey]"
        itemKey="fileId"
        :label="link.label"
        @toggle-section="toggleSection(link.section)"
      />

      <div class="analysis-drawer__section">
        <UiButton
          variant="secondary"
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('children')"
          @click="toggleSection('children')"
        >
          <span class="analysis-drawer__section-title">Порожденные файлы</span>
          <span
            :class="
              isSectionOpen('children')
                ? 'pi pi-chevron-up'
                : 'pi pi-chevron-down'
            "
            aria-hidden="true"
          />
        </UiButton>
        <div
          v-show="isSectionOpen('children')"
          class="analysis-drawer__section-body"
        >
          <div class="analysis-scroll-list analysis-scroll-list--compact">
            <UiButton
              v-for="child in selectedChain.children"
              variant="secondary"
              :key="child.fileId"
              type="button"
              class="analysis-link-row"
              @click="handleOpenFile(child.fileId)"
            >
              <span class="analysis-file-name">{{ child.name }}</span>
            </UiButton>
            <div
              v-if="!selectedChain.children.length"
              class="analysis-empty-row"
            >
              Нет
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <UiButton
          variant="secondary"
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('reads')"
          @click="toggleSection('reads')"
        >
          <span class="analysis-drawer__section-title">Чтения</span>
          <span
            :class="
              isSectionOpen('reads') ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
            "
            aria-hidden="true"
          />
        </UiButton>
        <div
          v-show="isSectionOpen('reads')"
          class="analysis-drawer__section-body"
        >
          <div class="analysis-scroll-list">
            <div class="analysis-mini-table">
              <div
                v-for="reader in selectedChain.readers"
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
              v-if="!selectedChain.readers.length"
              class="analysis-empty-row"
            >
              Нет
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <UiButton
          variant="secondary"
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('versions')"
          @click="toggleSection('versions')"
        >
          <span class="analysis-drawer__section-title">Версии</span>
          <span
            :class="
              isSectionOpen('versions')
                ? 'pi pi-chevron-up'
                : 'pi pi-chevron-down'
            "
            aria-hidden="true"
          />
        </UiButton>
        <div
          v-show="isSectionOpen('versions')"
          class="analysis-drawer__section-body"
        >
          <div class="analysis-scroll-list">
            <div class="analysis-mini-table">
              <div
                v-for="version in selectedChain.versions"
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
              v-if="!selectedChain.versions.length"
              class="analysis-empty-row"
            >
              Нет
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <UiButton
          variant="secondary"
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('pathHistory')"
          @click="toggleSection('pathHistory')"
        >
          <span class="analysis-drawer__section-title">История пути</span>
          <span
            :class="
              isSectionOpen('pathHistory')
                ? 'pi pi-chevron-up'
                : 'pi pi-chevron-down'
            "
            aria-hidden="true"
          />
        </UiButton>
        <div
          v-show="isSectionOpen('pathHistory')"
          class="analysis-drawer__section-body"
        >
          <div class="analysis-drawer__path-history">
            <div
              v-for="(pathItem, index) in selectedFile.pathHistory"
              :key="`${selectedFile.fileId}-${index}-${pathItem}`"
              class="analysis-drawer__path-history-item"
              :title="pathItem"
            >
              {{ pathItem }}
            </div>
            <div
              v-if="!selectedFile.pathHistory.length"
              class="analysis-drawer__path-history-item"
            >
              —
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-drawer__section">
        <UiButton
          variant="secondary"
          type="button"
          class="analysis-drawer__section-toggle"
          :aria-expanded="isSectionOpen('eventDescription')"
          @click="toggleSection('eventDescription')"
        >
          <span class="analysis-drawer__section-title">Описание события</span>
          <span
            :class="
              isSectionOpen('eventDescription')
                ? 'pi pi-chevron-up'
                : 'pi pi-chevron-down'
            "
            aria-hidden="true"
          />
        </UiButton>
        <div
          v-show="isSectionOpen('eventDescription')"
          class="analysis-drawer__section-body"
        >
          <div class="analysis-drawer__path-history">
            <div
              class="analysis-drawer__path-history-item"
              :title="latestFileEventDescription || '—'"
            >
              {{ latestFileEventDescription || "—" }}
            </div>
          </div>
        </div>
      </div>
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

const handleOpenFile = (fileId: number) => {
  setSelectedFile(fileId);
  router.push(`/analysis/file/${fileId}`);
};

const handleCloseDrawer = () => {
  setFileDetailsVisible(false);
};

const latestFileEventDescription = computed(
  () => selectedFileTimeline.value[0]?.details || "",
);

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
</script>
<style scoped src="./AnalysisChainDrawer.css"></style>
