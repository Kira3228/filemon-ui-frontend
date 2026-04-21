import { ComputedRef, onBeforeUnmount, Ref, ref } from "vue";

type UseDataTableShadowItemsOptions<T> = {
  items: ComputedRef<T[]>;
  itemsPerPage: ComputedRef<number | undefined>;
};

export const useDataTableShadowItems = <T = unknown>({
  items,
  itemsPerPage,
}: UseDataTableShadowItemsOptions<T>) => {
  const displayedItems = ref([]) as Ref<T[]>;
  const shadowLoading = ref(false);

  let shadowFrameId: number | null = null;
  let shadowTimeoutId: number | null = null;

  const clearShadowSchedule = () => {
    if (shadowFrameId !== null) {
      window.cancelAnimationFrame(shadowFrameId);
      shadowFrameId = null;
    }

    if (shadowTimeoutId !== null) {
      window.clearTimeout(shadowTimeoutId);
      shadowTimeoutId = null;
    }
  };

  const ensureRowRendered = (index: number) => {
    if (index < 0) {
      return;
    }

    const minimumCount = Math.max(displayedItems.value.length, index + 1);
    if (minimumCount <= displayedItems.value.length) {
      return;
    }

    displayedItems.value = items.value.slice(0, minimumCount);
    shadowLoading.value = minimumCount < items.value.length;
  };

  const getShadowChunkSize = () => {
    const baseSize = Number(itemsPerPage.value) || 50;
    return Math.max(40, Math.min(200, baseSize * 3));
  };

  const applyShadowLoading = () => {
    clearShadowSchedule();

    const chunkSize = getShadowChunkSize();
    if (items.value.length <= chunkSize) {
      displayedItems.value = items.value;
      shadowLoading.value = false;
      return;
    }

    displayedItems.value = items.value.slice(0, chunkSize);
    shadowLoading.value = true;

    const appendChunk = () => {
      const nextCount = Math.min(
        displayedItems.value.length + chunkSize,
        items.value.length,
      );
      displayedItems.value = items.value.slice(0, nextCount);

      if (nextCount >= items.value.length) {
        shadowLoading.value = false;
        clearShadowSchedule();
        return;
      }

      shadowTimeoutId = window.setTimeout(() => {
        shadowFrameId = window.requestAnimationFrame(appendChunk);
      }, 16);
    };

    shadowTimeoutId = window.setTimeout(() => {
      shadowFrameId = window.requestAnimationFrame(appendChunk);
    }, 16);
  };

  onBeforeUnmount(() => {
    clearShadowSchedule();
  });

  return {
    applyShadowLoading,
    clearShadowSchedule,
    displayedItems,
    ensureRowRendered,
    shadowLoading,
  };
};
