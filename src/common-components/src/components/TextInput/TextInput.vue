<template>
  <div class="tw-flex tw-items-center tw-w-full">
    <span v-if="isTextarea && label" class="p-float-label tw-w-full">
      <PrimeTextarea
        :id="inputId"
        :value="valueAsString"
        class="tw-w-full"
        auto-resize
        v-bind="$attrs"
        @input="handleTextInput"
      />
      <label :for="inputId">{{ label }}</label>
    </span>
    <PrimeTextarea
      v-else-if="isTextarea"
      :value="valueAsString"
      class="tw-w-full"
      auto-resize
      v-bind="$attrs"
      @input="handleTextInput"
    />
    <span v-else-if="label" class="p-float-label tw-w-full text-input-wrapper">
      <InputText
        :id="inputId"
        :value="valueAsString"
        class="tw-w-full"
        :placeholder="placeholder"
        v-bind="$attrs"
        @input="handleTextInput"
      />
      <label :for="inputId">{{ label }}</label>
      <span v-if="isSearch" class="pi pi-search text-input-icon" aria-hidden="true" />
    </span>
    <span v-else class="text-input-wrapper tw-w-full">
      <InputText
        :value="valueAsString"
        class="tw-w-full"
        :placeholder="placeholder"
        v-bind="$attrs"
        @input="handleTextInput"
      />
      <span v-if="isSearch" class="pi pi-search text-input-icon" aria-hidden="true" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import InputText from "primevue/inputtext";
import PrimeTextarea from "primevue/textarea";
import { computed } from "vue";
import { useDebounce } from "../../lib/debounce";
import { uid } from "../../lib/uid";

interface Props {
  isSearch?: boolean;
  label?: string;
  placeholder?: string;
  value?: string | number;
  isTextarea?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isSearch: false,
  isTextarea: false,
});

const emit = defineEmits<{
  (e: `input`, value: string | number): void;
  (e: `debounce`, value: string | number): void;
}>();

const { debounce } = useDebounce();
const inputId = `text-input-${uid()}`;
const valueAsString = computed(() => (props.value ?? "").toString());

const handleInput = (newValue: string) => {
  emit(`input`, newValue);
  debounce(() => {
    emit("debounce", newValue);
  }, 500);
};

const handleTextInput = (event: Event) => {
  handleInput((event.target as HTMLInputElement | HTMLTextAreaElement)?.value || "");
};
</script>
<style scoped>
.text-input-wrapper {
  position: relative;
}

.text-input-icon {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.text-input-wrapper :deep(.p-inputtext) {
  padding-right: 2.25rem;
}
</style>
