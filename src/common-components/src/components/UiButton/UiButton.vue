<template>
  <PrimeButton
    @click="$emit('click', $event)"
    :disabled="isDisabled"
    :class="[buttonVariant, buttonSize, activeStyle]"
    class="app-button"
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

interface Props {
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
  variant?:
    | "primary"
    | "secondary"
    | "text"
    | "icon"
    | "small-text"
    | "small-icon";
  size?: "small" | "medium" | "large";
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: `auto`,
  color: `#2563eb`,
  width: "auto",
  variant: "primary",
  size: "medium",
});

const buttonVariant = computed(() => {
  return {
    "p-button-rounded primary": props.variant === "primary",
    "p-button-outlined p-button-rounded secondary":
      props.variant === "secondary",
    "p-button-rounded text":
      props.variant === "text" || props.variant === "small-text",
    "icon text": props.variant === "icon" || props.variant === "small-icon",
  };
});

const activeStyle = computed(() => {
  return {
    active: props.active,
  };
});

const buttonSize = computed(() => {
  return {
    "p-button-sm size-small":
      props.size === "small" ||
      props.variant === "small-text" ||
      props.variant === "small-icon",
    "size-medium": props.size === "medium",
    "p-button-lg size-large": props.size === "large",
  };
});
</script>
<style scoped lang="scss">
.app-button {
  display: inline-flex;
  gap: 0.35rem;
  justify-content: center;
}

.p-button.p-button-outlined {
  color: var(--app-text);
  border-color: var(--app-border);
  font-size: 12px;
  font-weight: 600;
  box-shadow: var(--dt-button-shadow);
  border: 1px solid var(--app-border);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.p-button.primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: var(--dt-button-shadow);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.p-button.primary:hover:not(:disabled) {
  background-color: var(--hover-color-primary);
  border-color: var(--hover-color-primary);
  color: #ffffff;
}

.secondary {
  background-color: var(--color-secondary);
  border-color: var(--app-primary);
  color: var(--app-text);
}

.p-button.p-button-outlined.secondary:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
  border-color: var(--app-border);
  color: var(--app-text);
}

.text {
  background-color: transparent;
  border-color: transparent;
  color: #5d6b82;
  font-weight: 600;
}
.text:hover:not(:disabled) {
  background-color: transparent;
  border-color: transparent;
  color: #5d6b82;
}
.text:focus {
  box-shadow: none;
}

.size-small {
  font-size: 0.625rem;
  padding: 0px;
}

.size-medium {
  font-size: 12px;
}

.size-large {
  font-size: 14px;
}

.icon {
  padding: 0;
  ium {
    font-size: 12px;
  }
}

.size-large {
  font-size: 14px;
}

.icon {
  padding: 0;
}

.active {
  background-color: var(--active-bg-color-primary);
  border-color: var(--color-primary);
  // color: var(--color-primary);
  color: blue;
}
</style>
