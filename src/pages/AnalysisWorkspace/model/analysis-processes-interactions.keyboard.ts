import type { Ref } from "vue";

export const isProcessToggleKeyboardKey = (event: KeyboardEvent) =>
  event.key === "Enter" || event.key === " ";

export const createProcessesKeyboardHelpers = (
  processesRootRef: Ref<HTMLElement | null>,
) => {
  const getProcessKeyboardTargets = () => (
    processesRootRef.value
      ? Array.from(processesRootRef.value.querySelectorAll<HTMLElement>(".analysis-process-bucket__header, .analysis-process-group__header"))
      : []
  );

  const focusProcessKeyboardTarget = (target: HTMLElement | null) => {
    if (!(target instanceof HTMLElement)) { return; }
    target.focus({ preventScroll: true });
  };

  const moveProcessKeyboardFocus = (currentTarget: HTMLElement, direction: -1 | 1) => {
    const targets = getProcessKeyboardTargets();
    const currentIndex = targets.indexOf(currentTarget);
    if (currentIndex < 0) { return; }
    const nextTarget = targets[currentIndex + direction] || null;
    focusProcessKeyboardTarget(nextTarget);
  };

  const resolveProcessBucketHeaderElement = (target: EventTarget | null) =>
    target instanceof HTMLElement
      ? target.closest<HTMLElement>(".analysis-process-bucket__header")
      : null;

  const resolveProcessGroupRowElement = (target: EventTarget | null) =>
    target instanceof HTMLElement
      ? target.closest<HTMLElement>(".analysis-process-group__header")
      : null;

  const focusProcessBucketHeader = (bucketKey: string) => {
    const target = processesRootRef.value?.querySelector<HTMLElement>(`.analysis-process-bucket__header[data-process-bucket-key="${bucketKey}"]`) || null;
    focusProcessKeyboardTarget(target);
  };

  return {
    focusProcessBucketHeader,
    focusProcessKeyboardTarget,
    getProcessKeyboardTargets,
    moveProcessKeyboardFocus,
    resolveProcessBucketHeaderElement,
    resolveProcessGroupRowElement,
  };
};
