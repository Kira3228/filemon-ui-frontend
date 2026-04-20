import { onBeforeUnmount, onMounted } from "vue";
import type { Ref } from "vue";

interface UseDataTableFilterDismissOptions {
  rootRef: Ref<HTMLElement | null>;
  activeFilterHeader: Ref<unknown>;
  closeColumnFilter: () => void;
}

export const useDataTableFilterDismiss = ({
  rootRef,
  activeFilterHeader,
  closeColumnFilter,
}: UseDataTableFilterDismissOptions): void => {
  const getActiveFilterMenuElement = () => {
    const menu = rootRef.value?.querySelector(".compact-data-table__filter-menu");
    return menu instanceof HTMLElement ? menu : null;
  };

  const isEventInsideActiveFilterMenu = (event: MouseEvent | Event) => {
    const menu = getActiveFilterMenuElement();
    if (!menu) {
      return false;
    }

    const target = event.target as Node | null;
    if (target && menu.contains(target)) {
      return true;
    }

    if (event instanceof MouseEvent) {
      const rect = menu.getBoundingClientRect();
      const { clientX, clientY } = event;

      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }

    return false;
  };

  const handleFilterPointerDown = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (rootRef.value?.contains(target)) {
      return;
    }
    if (!activeFilterHeader.value) {
      return;
    }
    if (isEventInsideActiveFilterMenu(event)) {
      return;
    }
    closeColumnFilter();
  };

  const handleViewportChange = (event?: Event) => {
    if (activeFilterHeader.value) {
      if (event && isEventInsideActiveFilterMenu(event)) {
        return;
      }
      closeColumnFilter();
    }
  };

  onMounted(() => {
    document.addEventListener("mousedown", handleFilterPointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleFilterPointerDown);
    window.removeEventListener("resize", handleViewportChange);
    window.removeEventListener("scroll", handleViewportChange, true);
  });
};
