<template>
  <div class="flex items-center gap-4 w-full">
    <span v-if="label" class="p-float-label w-full">
      <Calendar
        :id="inputId"
        :value="calendarValue"
        class="w-full"
        date-format="dd/mm/yy"
        show-icon
        append-to="body"
        :manual-input="false"
        v-bind="$attrs"
        @input="handleSelect"
      />
      <label :for="inputId">{{ label }}</label>
    </span>
    <Calendar
      v-else
      :value="calendarValue"
      class="w-full"
      date-format="dd/mm/yy"
      show-icon
      append-to="body"
      :manual-input="false"
      v-bind="$attrs"
      @input="handleSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import Calendar from "primevue/calendar";
import { computed } from "vue";
import { useDebounce } from "../../lib/debounce";
import { uid } from "../../lib/uid";

interface Props {
  value?: string | null;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
});

const emit = defineEmits<{
  (e: "input", value: string | null): void;
  (e: `debounce`, value: string | null): void;
}>();

const { debounce } = useDebounce();
const inputId = `date-input-${uid()}`;

const parseDate = (dateStr: string | null) => {
  if (!dateStr) {
    return null;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatDate = (date: Date | null) => {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calendarValue = computed(() => parseDate(props.value));

const emitValue = (val: string | null) => {
  emit("input", val);
  debounce(() => {
    emit(`debounce`, val);
  });
};

const handleSelect = (value: Date | Date[] | null) => {
  const date = Array.isArray(value) ? value[0] || null : value;
  emitValue(formatDate(date));
};
</script>
