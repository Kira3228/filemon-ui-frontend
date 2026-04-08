<template>
  <div class="tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
    <div v-if="isLoading" class="tw-flex tw-flex-col tw-gap-2">
      <div
        v-for="skeleton in skeletonsQuantity"
        :key="skeleton"
        class="virtual-scroll-skeleton"
        :style="skeletonStyle"
      />
    </div>
    <div v-else-if="error">
      {{ error }}
    </div>
    <dynamic-scroller
      v-else
      class="tw-flex-1 tw-min-h-0"
      :items="items"
      :min-item-size="150"
    >
      <template v-slot="{ item, index, active }">
        <dynamic-scroller-item
          :item="item"
          :active="active"
          :size-dependencies="[item.id]"
          :data-index="index"
        >
          <div class="my-item tw-flex tw-flex-col">
            {{ item.id }}
          </div>
          <div
            v-if="items && index === items.length - 1"
            v-intersect="onIntersect"
            style="height: 1px; width: 100%"
          />
        </dynamic-scroller-item>
      </template>
    </dynamic-scroller>
  </div>
</template>
<script lang="ts" setup generic="T extends { id: string | number }">
import { computed } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

interface IProps {
  skeletonsQuantity?: number;
  isLoading?: boolean;
  skeletonHeight?: number;
  items?: T[];
  error?: string | undefined;
}

const props = defineProps<IProps>();
const emit = defineEmits<{
  (e: `load-more`): void;
}>();

const skeletonStyle = computed(() => ({
  height: `${props.skeletonHeight || 120}px`,
}));

const onIntersect = () => {
  emit("load-more");
};
</script>
<style scoped>
.virtual-scroll-skeleton {
  width: 100%;
  border-radius: 1rem;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: virtual-scroll-loading 1.2s ease-in-out infinite;
}

@keyframes virtual-scroll-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
