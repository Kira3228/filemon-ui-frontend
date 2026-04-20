import {
  ComputedRef,
  nextTick,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
} from "vue";

type UseDataTableKeyboardScopeOptions = {
  enableKeyboardNavigation: ComputedRef<boolean>;
  rootRef: Ref<HTMLElement | null>;
  tableFocusRef: Ref<HTMLElement | null>;
};

export const useDataTableKeyboardScope = ({
  enableKeyboardNavigation,
  rootRef,
  tableFocusRef,
}: UseDataTableKeyboardScopeOptions) => {
  const isKeyboardScopeActive = ref(false);

  const focusTableRoot = () => {
    if (!enableKeyboardNavigation.value) {
      return;
    }

    tableFocusRef.value?.focus({ preventScroll: true });
  };

  const syncKeyboardScope = () => {
    nextTick(() => {
      const scopeElement = tableFocusRef.value;
      if (!(scopeElement instanceof HTMLElement)) {
        return;
      }

      scopeElement.tabIndex = enableKeyboardNavigation.value ? 0 : -1;
      scopeElement.classList.add("compact-data-table__keyboard-scope");
      scopeElement.setAttribute("role", "grid");
    });
  };

  const activateKeyboardScope = () => {
    isKeyboardScopeActive.value = true;
  };

  const deactivateKeyboardScope = () => {
    isKeyboardScopeActive.value = false;
  };

  const handleTableFocusOut = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && tableFocusRef.value?.contains(nextTarget)) {
      return;
    }

    deactivateKeyboardScope();
  };

  const isKeyboardEventTargetInteractive = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    return Boolean(
      target.closest(
        "input, textarea, select, button, a, [role='button'], [contenteditable='true'], .compact-data-table__columns-panel",
      ),
    );
  };

  const isTableBodyTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (!rootRef.value?.contains(target)) {
      return false;
    }

    return Boolean(
      target.closest(
        ".p-datatable-wrapper, .p-datatable-table, .p-datatable-tbody, td, tr",
      ),
    );
  };

  const handleDocumentPointerDown = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (isTableBodyTarget(target)) {
      activateKeyboardScope();
      focusTableRoot();
      return;
    }

    deactivateKeyboardScope();
  };

  onMounted(() => {
    document.addEventListener("mousedown", handleDocumentPointerDown);
    syncKeyboardScope();
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleDocumentPointerDown);
  });

  return {
    activateKeyboardScope,
    focusTableRoot,
    handleTableFocusOut,
    isKeyboardEventTargetInteractive,
    isKeyboardScopeActive,
    syncKeyboardScope,
  };
};
