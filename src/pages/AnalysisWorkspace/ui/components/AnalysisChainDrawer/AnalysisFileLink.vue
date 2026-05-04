<template>
  <div class="analysis-drawer__section">
    <UiButton
      type="button"
      variant="secondary"
      class="analysis-drawer__section-toggle"
      :aria-expanded="ariaExpanded"
      @click="toggleSection('sources')"
    >
      <span class="analysis-drawer__section-title">{{ label }}</span>
      <span :class="classValue" aria-hidden="true" />
    </UiButton>
    <div v-show="isSectionOpen" class="analysis-drawer__section-body">
      <div class="analysis-scroll-list analysis-scroll-list--compact">
        <slot name="body" :items="itemsList" />

        <div v-if="!itemsList.length" class="analysis-empty-row">Нет</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UiButton } from "@/components/UiButton";

interface Props {
  ariaExpanded: boolean;
  classValue: string;
  isSectionOpen: boolean;
  itemsList: any[];
  label: string;
}
defineProps<Props>();

const emit = defineEmits<{
  (event: "toggle-section", section: string): void;
}>();

const toggleSection = (section: string) => {
  emit("toggle-section", section);
};
</script>
<style scoped lang="scss" src="./AnalysisFileLink.scss"></style>
