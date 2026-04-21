<template>
  <svg
    :fill="activeColor"
    viewBox="-2 -4 24 24"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMinYMin"
    class="jam jam-settings-alt"
  >
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke="#CCCCCC"
      stroke-width="1.8719999999999999"
    ></g>
    <g id="SVGRepo_iconCarrier">
      <path
        d="M9 12V1a1 1 0 1 1 2 0v11h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1H8a1 1 0 0 1 0-2h1zm7-10V1a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2h-1v11a1 1 0 0 1-2 0V4h-1a1 1 0 0 1 0-2h1zM4 5h1a1 1 0 1 1 0 2H4v8a1 1 0 0 1-2 0V7H1a1 1 0 1 1 0-2h1V1a1 1 0 1 1 2 0v4z"
      ></path>
    </g>
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
