<template>
  <PrimeDialog
    :visible="Boolean(value)"
    :header="title"
    :modal="false"
    :closable="true"
    :dismissable-mask="false"
    :style="{ width: 'min(50vw, 960px)' }"
    append-to="body"
    @hide="close"
    @update:visible="handleVisibleChange"
  >
    <slot name="content" />
    <template #footer>
      <slot name="actions">
        <PrimeButton label="Закрыть" class="p-button-text" @click="close" />
        <PrimeButton label="Скачать" class="p-button-text" @click="onDownloadClick" />
      </slot>
    </template>
  </PrimeDialog>
</template>
<script lang="ts" setup>
import PrimeButton from "primevue/button";
import PrimeDialog from "primevue/dialog";

interface DialogProps {
  value?: boolean;
  title?: string;
}
defineProps<DialogProps>();

const emit = defineEmits<{
  (e: "input", val: boolean): void;
  (e: `download`): void;
}>();

const close = () => {
  emit("input", false);
};

const handleVisibleChange = (nextValue: boolean) => {
  emit("input", nextValue);
};

const onDownloadClick = () => {
  emit(`download`);
};
</script>
