import { computed, ref } from "vue";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "PMOVT-theme";
const currentTheme = ref<ThemeMode>("light");

let isInitialized = false;

const applyThemeToDom = (theme: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
};

const setTheme = (theme: ThemeMode) => {
  currentTheme.value = theme;
  applyThemeToDom(theme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
};

export const initTheme = () => {
  if (isInitialized) {
    applyThemeToDom(currentTheme.value);
    return;
  }

  isInitialized = true;

  if (typeof window === "undefined") {
    return;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  currentTheme.value = savedTheme === "dark" ? "dark" : "light";
  applyThemeToDom(currentTheme.value);
};

export const useTheme = () => {
  return {
    currentTheme: computed(() => currentTheme.value),
    isDark: computed(() => currentTheme.value === "dark"),
    setTheme,
    toggleTheme: () => {
      setTheme(currentTheme.value === "dark" ? "light" : "dark");
    },
  };
};
