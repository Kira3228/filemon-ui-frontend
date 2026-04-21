<template>
  <svg
    width="800px"
    height="800px"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16 2H0V5H16V2Z" :fill="activeColor" />
    <path d="M1 7H5V9H11V7H15V15H1V7Z" :fill="activeColor" />
  </svg>
</template>
<script lang="ts" setup>
import { computed } from "vue";

interface IconProps {
  theme?: "dark" | "light";
}

const props = withDefaults(defineProps<IconProps>(), {
  theme: "light",
});

const activeColor = computed(() => {
  return props.theme === "dark" ? "#ffffff" : "#000000";
});
</script>
