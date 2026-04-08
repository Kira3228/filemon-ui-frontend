<template>
  <PrimeButton
    @click="$emit('click', $event)"
    :disabled="isDisabled"
    :class="buttonClass"
    :style="buttonStyle"
    v-bind="$attrs"
  >
    <template #default>
      <slot />
    </template>
  </PrimeButton>
</template>
<script lang="ts" setup>
import PrimeButton from "primevue/button";
import { computed } from "vue";

interface ButtonProps {
  isDisabled?: boolean;
  elevation?: number;
  color?: string;
  height?: number | string;
  outlined?: boolean;
  width?: number | string;
  icon?: boolean;
  text?: boolean;
  plain?: boolean;
  xSmall?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  height: `auto`,
  color: `#2563eb`,
  width: "auto",
});

const buttonClass = computed(() => ({
  "p-button-outlined": props.outlined,
  "p-button-text": props.text || props.plain,
  "p-button-sm": props.xSmall,
  "p-button-icon-only": props.icon,
  "app-button": true,
}));

const buttonStyle = computed(() => {
  const resolvedColor = props.color || "#2563eb";
  const isGhost = props.outlined || props.text || props.plain;

  return {
    minHeight: typeof props.height === "number" ? `${props.height}px` : props.height,
    height: typeof props.height === "number" ? `${props.height}px` : props.height,
    minWidth: typeof props.width === "number" ? `${props.width}px` : props.width,
    width: typeof props.width === "number" ? `${props.width}px` : props.width,
    boxShadow: props.elevation ? `0 ${props.elevation}px ${props.elevation * 4}px rgba(15, 23, 42, 0.15)` : "none",
    background: isGhost ? "transparent" : resolvedColor,
    borderColor: resolvedColor,
    color: isGhost ? resolvedColor : "#ffffff",
  };
});
</script>
<style scoped>
.app-button {
  justify-content: center;
}
</style>
