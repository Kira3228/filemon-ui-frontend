import { Component } from "vue";

export interface TMenuItem {
  title: string;
  icon?: string | Component;
  to?: string;
  iconProps?: Record<string, "dark" | "light">;
  subMenu?: TMenuItem[];
}
