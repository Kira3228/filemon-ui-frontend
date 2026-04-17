import { Ref } from "vue";

interface UseDataTableFilterDismissOptions {
  rootRef: Ref<HTMLElement | null>;
}



export const useDataTableFilterDismiss = ({ rootRef }: UseDataTableFilterDismissOptions) => {

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




  return {
    getActiveFilterMenuElement,
    isEventInsideActiveFilterMenu,
  }
}