<template>
  <svg
    width="800px"
    height="800px"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11 0H5V12H15V4L11 0Z" :fill="activeColor" />
    <path d="M1 4V16H11V14H3V4H1Z" :fill="activeColor" />
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
