<template>
  <div class="analysis-kv-row" :class="{ 'analysis-kv-row--wide': wide }">
    <span>{{ label }}</span>
    <span :title="title">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  value: string | number;
  title?: string;
  wide?: boolean;
}

defineProps<Props>();
</script>

<style src="./AnalysisChainPage.css"></style>
