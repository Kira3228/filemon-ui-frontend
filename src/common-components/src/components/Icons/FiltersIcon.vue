<template>
  <svg
    width="800px"
    height="800px"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 3C1 2.44772 1.44772 2 2 2H14C14.5523 2 15 2.44772 15 3C15 3.23367 14.9182 3.46001 14.7689 3.6396L10 9.375V13C10 13.3788 9.786 13.725 9.44721 13.8944L7.44721 14.8944C6.78231 15.2269 6 14.7434 6 14V9.375L1.23111 3.6396C1.0818 3.46001 1 3.23367 1 3Z"
      :fill="activeColor"
    />
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
