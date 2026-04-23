<template>
  <div class="flex items-center gap-4 w-full">
    <Calendar
      :value="calendarValue"
      date-format="dd/mm/yy"
      show-icon
      class="my-calendar"
      append-to="body"
      :manual-input="false"
      v-bind="$attrs"
      @input="handleSelect"
      panelClass="my-calendar-panel"
    />
  </div>
</template>

<script lang="ts" setup>
import { useDebounce } from "@/shared/utils/lib";
import Calendar from "primevue/calendar";
import { computed } from "vue";

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
// const inputId = `date-input-${uid()}`;

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
<style>
.p-datepicker {
  width: 220px;
}
:deep(.my-calendar-panel) {
  width: 220px;
  font-size: 12px;
}

:deep(.my-calendar-panel table) {
  margin: 10px;
}

:deep(.my-calendar-panel table th),
:deep(.my-calendar-panel table td) {
  padding: 3.15rem;
}

:deep(.my-calendar-panel table td > span) {
  width: 0.6rem;
  height: 1.6rem;
  line-height: 1.6rem;
}
</style>
