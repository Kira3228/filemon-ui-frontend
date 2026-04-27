export type DataTableFilterMode = "select" | "contains" | "range";
export type DataTableFilterValueType = "text" | "number" | "date";

export interface Header<T = unknown> {
  text: string;
  value: string;
  align: string;
  sortable: boolean;
  isVisible: boolean;
  width: number;
  wrap?: boolean;
  filterable?: boolean;
  filterBy?: string | string[];
  filterValue?: (item: unknown) => unknown;
  filterMode?: DataTableFilterMode;
  filterModes?: DataTableFilterMode[];
  filterValueType?: DataTableFilterValueType;
  exportable?: boolean;
  exportValue?: (item: T) => number | string;
}
