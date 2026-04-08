<template>
  <button
    type="button"
    class="analysis-toolbar-toggle"
    :class="{ 'analysis-toolbar-toggle--active': active }"
    @click="$emit('click')"
  >
    <span class="pi" :class="active ? 'pi-eye-slash' : 'pi-eye'" />
    <span>Детали файла</span>
  </button>
</template>

<script lang="ts" setup>
defineProps<{
  active: boolean;
}>();

defineEmits<{
  (e: "click"): void;
}>();
</script>

<style scoped>
.analysis-toolbar-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  padding: 0.42rem 0.92rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.analysis-toolbar-toggle--active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}
</style>
