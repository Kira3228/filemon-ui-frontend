<template>
  <div class="analysis-kv-row">
    <span>{{ label }}</span>
    <span>{{ value }}</span>
  </div>
</template>
<script setup lang="ts">
interface Props {
  label?: string;
  value?: string | number;
}
defineProps<Props>();
</script>
<style scoped src="./AnalysisChainDrawer.css"></style>
