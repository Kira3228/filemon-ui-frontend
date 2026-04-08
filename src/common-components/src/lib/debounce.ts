export const useDebounce = () => {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const debounce = (callback: () => void, delay: number = 500): void => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(callback, delay);
  };
  const cancelDebounce = (): void => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const destroy = (): void => {
    cancelDebounce();
  };
  return {
    debounce,
    cancelDebounce,
    destroy
  };
};
