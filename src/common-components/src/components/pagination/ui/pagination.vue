<template>
  <div class="pagination-wrap">
    <Paginator
      :first="first"
      :rows="1"
      :total-records="totalRecords"
      :page-link-size="totalVisible"
      template="PrevPageLink PageLinks NextPageLink"
      @page="handlePage"
    />
  </div>
</template>
<script setup lang="ts">
import Paginator from "primevue/paginator";
import { computed } from "vue";

interface IProps {
  length: number;
  value?: number | undefined;
  totalVisible: number;
}
const props = defineProps<IProps>();

const emits = defineEmits<{
  (e: `input`, newPage: number): void;
}>();

const first = computed(() => {
  const currentPage = props.value || 1;
  return Math.max(currentPage - 1, 0);
});

const totalRecords = computed(() => Math.max(props.length, 0));

const handlePage = (event: { page: number }) => {
  emits("input", event.page + 1);
};
</script>
<style scoped lang="scss">
.pagination-wrap {
  background-color: transparent;
}
</style>
