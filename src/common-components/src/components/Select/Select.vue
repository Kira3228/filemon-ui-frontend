<template>
  <div class="flex items-center w-full">
    <span v-if="label" class="p-float-label w-full">
      <component
        :is="selectComponent"
        :id="inputId"
        :value="value"
        class="w-full"
        :options="items"
        :placeholder="placeholder"
        :option-label="resolvedOptionLabel"
        :option-value="resolvedOptionValue"
        :show-clear="clearable"
        :display="multiple && chips ? 'chip' : 'comma'"
        :multiple="multiple"
        v-bind="$attrs"
        @change="handleSelect"
        @input="handleSelect"
      >
        <template v-if="customList" #option="slotProps">
          <slot name="ui-item" :item="slotProps.option">
            <span>{{ formatOptionLabel(slotProps.option) }}</span>
          </slot>
        </template>
      </component>
      <label :for="inputId">{{ label }}</label>
    </span>
    <component
      :is="selectComponent"
      v-else
      :value="value"
      class="w-full"
      :options="items"
      :placeholder="placeholder"
      :option-label="resolvedOptionLabel"
      :option-value="resolvedOptionValue"
      :show-clear="clearable"
      :display="multiple && chips ? 'chip' : 'comma'"
      :multiple="multiple"
      v-bind="$attrs"
      @change="handleSelect"
      @input="handleSelect"
    >
      <template v-if="customList" #option="slotProps">
        <slot name="ui-item" :item="slotProps.option">
          <span>{{ formatOptionLabel(slotProps.option) }}</span>
        </slot>
      </template>
    </component>
  </div>
</template>

<script lang="ts" setup>
import Dropdown from "primevue/dropdown";
import MultiSelect from "primevue/multiselect";
import { computed } from "vue";
import { useDebounce } from "../../../../shared/utils/lib/debounce";
import { uid } from "../../../../shared/utils/lib/uid";

type SelectPrimitive = string | number | boolean | null | undefined;
type SelectOption = Record<string, unknown> | SelectPrimitive;
type SelectEventPayload<TValue> = TValue | { value: TValue };

interface Props<T extends SelectOption = SelectOption, H = unknown> {
  label?: string;
  items?: T[];
  placeholder?: string;
  value?: H;
  chips?: boolean;
  multiple?: boolean;
  customList?: boolean;
  returnObject?: boolean;
  itemValue?: string;
  itemText?: string;
  clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  chips: false,
  customList: false,
  returnObject: false,
});
const emits = defineEmits<{
  (e: `debounce`, value: H): void;
  (e: `input`, value: H): void;
}>();
const { debounce } = useDebounce();
const inputId = `select-input-${uid()}`;

const selectComponent = computed(() => (props.multiple ? MultiSelect : Dropdown));
const hasObjectItems = computed(() => {
  return Array.isArray(props.items) && props.items.some((item) => typeof item === "object" && item !== null);
});
const resolvedOptionLabel = computed(() => {
  if (!hasObjectItems.value) {
    return undefined;
  }

  return props.itemText || "label";
});
const resolvedOptionValue = computed(() => {
  if (props.returnObject) {
    return undefined;
  }

  return props.itemValue;
});

const handleSelect = (payload: SelectEventPayload<H>) => {
  const newValue = payload && typeof payload === "object" && "value" in payload ? payload.value : payload;
  emits("input", newValue);
  debounce(() => {
    emits(`debounce`, newValue);
  }, 500);
};

const formatOptionLabel = (option: T) => {
  if (!option || typeof option !== "object") {
    return option;
  }

  const labelKey = resolvedOptionLabel.value;
  return labelKey ? option[labelKey] : option.label;
};
</script>
