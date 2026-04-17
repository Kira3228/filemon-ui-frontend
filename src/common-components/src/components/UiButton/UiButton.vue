<template>
  <PrimeButton
    @click="$emit('click', $event)"
    :disabled="isDisabled"
    :class="buttonVariant"
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
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
}

const props = withDefaults(defineProps<Props>(), {
  height: `auto`,
  color: `#2563eb`,
  width: "auto",
});

const buttonVariant = computed(() => {
  return {
    "p-button-sm p-button-rounded primary": props.variant === "primary",
    "p-button-outlined p-button-sm p-button-rounded secondary":
      props.variant === "secondary",
  };
});
</script>
<style scoped lang="scss">
.app-button {
  justify-content: center;
}

.p-button.p-button-outlined {
  color: var(--app-text);
  border-color: var(--app-text);
  font-size: 12px;
  font-weight: 600;
  box-shadow: var(--dt-button-shadow);
  border: 1px solid var(--app-border);
}

.primary {
}

.secondary {
  background-color: var(--app-primary);
  border-color: var(--app-primary);
  color: var(--app-text);
}
.secondary:hover {
  background-color: black;
  border-color: var(--app-primary-hover);
}
</style>
