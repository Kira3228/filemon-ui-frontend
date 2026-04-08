import { onBeforeUnmount, onMounted, Ref, ref, watch } from "vue";

type TRowKey = string | number;

interface TOptions<T> {
  items: Ref<T[]>;
  getKey: (item: T) => TRowKey | null | undefined;
  onSelect: (item: T) => void;
  onOpen?: (item: T) => void;
  onKeyDown?: (context: TKeydownContext<T>) => boolean | void;
}

interface TKeydownContext<T> {
  event: KeyboardEvent;
  items: T[];
  currentIndex: number;
  currentItem: T | null;
  selectItem: (item: T) => void;
  openItem: (item: T) => void;
  moveSelection: (nextIndex: number) => void;
}

const isSameKey = (first: unknown, second: unknown) =>
  first !== null &&
  first !== undefined &&
  second !== null &&
  second !== undefined &&
  String(first) === String(second);

export const useKeyboardTableSelection = <T>(options: TOptions<T>) => {
  const hostRef = ref<HTMLElement | null>(null);
  const isActive = ref(false);
  const activeRowKey = ref<TRowKey | null>(null);

  const syncHostFocusability = () => {
    if (!hostRef.value) { return; }
    hostRef.value.tabIndex = 0;
  };

  const focusHost = () => {
    hostRef.value?.focus({ preventScroll: true });
  };

  const activate = () => {
    isActive.value = true;
    focusHost();
  };

  const deactivate = () => {
    isActive.value = false;
  };

  const isTableBodyTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) { return false; }
    if (!hostRef.value?.contains(target)) { return false; }

    return Boolean(target.closest(
      ".p-datatable-wrapper, .p-datatable-table, .p-datatable-tbody, td, tr",
    ));
  };

  const selectItem = (item: T) => {
    const key = options.getKey(item);
    activeRowKey.value = key ?? null;
    options.onSelect(item);
  };

  const openItem = (item: T) => {
    selectItem(item);
    options.onOpen?.(item);
  };

  const moveSelection = (nextIndex: number) => {
    if (!options.items.value.length) { return; }

    const boundedIndex = Math.max(0, Math.min(options.items.value.length - 1, nextIndex));
    const item = options.items.value[boundedIndex];
    if (!item) { return; }

    selectItem(item);
  };

  const handlePointerDown = (event: MouseEvent) => {
    if (!isTableBodyTarget(event.target)) {
      deactivate();
      return;
    }

    activate();
  };

  const handleDocumentPointerDown = (event: MouseEvent) => {
    if (isTableBodyTarget(event.target)) {
      activate();
      return;
    }

    deactivate();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isActive.value) { return; }

    const currentIndex = options.items.value.findIndex((item) =>
      isSameKey(options.getKey(item), activeRowKey.value));
    const currentItem = currentIndex >= 0 ? options.items.value[currentIndex] ?? null : null;

    const isHandledByConsumer = options.onKeyDown?.({
      event,
      items: options.items.value,
      currentIndex,
      currentItem,
      selectItem,
      openItem,
      moveSelection,
    });
    if (isHandledByConsumer) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(currentIndex < 0 ? 0 : currentIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(currentIndex < 0 ? 0 : currentIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveSelection(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveSelection(options.items.value.length - 1);
      return;
    }

    if (event.key === "Enter" && currentIndex >= 0) {
      event.preventDefault();
      const item = options.items.value[currentIndex];
      if (item) {
        openItem(item);
      }
    }
  };

  watch(options.items, (items) => {
    if (!items.length) {
      activeRowKey.value = null;
      return;
    }

    const hasActiveItem = items.some((item) => isSameKey(options.getKey(item), activeRowKey.value));
    if (!hasActiveItem) {
      const firstItem = items[0];
      const firstKey = options.getKey(firstItem);
      activeRowKey.value = firstKey ?? null;
      options.onSelect(firstItem);
    }
  }, { immediate: true });

  onMounted(() => {
    syncHostFocusability();
    document.addEventListener("mousedown", handleDocumentPointerDown);
    window.addEventListener("keydown", handleKeydown, true);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleDocumentPointerDown);
    window.removeEventListener("keydown", handleKeydown, true);
  });

  return {
    hostRef,
    activeRowKey,
    activate,
    handlePointerDown,
    selectItem,
    openItem,
  };
};
