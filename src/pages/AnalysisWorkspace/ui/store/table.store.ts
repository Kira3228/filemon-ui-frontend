import { defineStore } from "pinia";
import { reactive } from "vue";

type TableState = {
  page: number;
  limit: number;
}

export const useTableStore = defineStore("table", () => {
  const tables = reactive<Record<string, TableState>>({});

  const getTable = (key: string) => {
    if (!tables[key]) {
      tables[key] = {
        page: 1,
        limit: 100,
      };
    }

    return tables[key];
  }

  return { tables, getTable }
});