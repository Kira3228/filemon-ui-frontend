<template>
  <div class="compact-data-table__header-inner">
    <UiButton variant="text" size="xSmall" @click="emit('sort', $event)">
      <span>{{ header.text }}</span>
      <span
        v-if="header.sortable"
        class="compact-data-table__sort-icon pi"
        :class="sortIconClass"
      />
    </UiButton>
    <UiButton
      v-if="header.filterable !== false"
      variant="text"
      size="xSmall"
      @click.stop="emit('filter', $event)"
    >
      <span class="pi pi-filter" />
      <span
        v-if="filterCount !== null"
        class="compact-data-table__filter-badge"
      >
        {{ filterCount }}
      </span>
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from "../../UiButton";
import type { Header } from "../header.type";

interface Props {
  header: Header;
  sortIconClass: string | Record<string, boolean> | string[];
  filterCount: number | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "sort", event: MouseEvent): void;
  (e: "filter", event: MouseEvent): void;
}>();
</script>
