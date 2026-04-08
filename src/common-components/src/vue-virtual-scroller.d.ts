declare module "vue-virtual-scroller" {
  import Vue, { ComponentOptions, PluginObject } from "vue";

  export const RecycleScroller: ComponentOptions<Vue>;
  export const DynamicScroller: ComponentOptions<Vue>;
  export const DynamicScrollerItem: ComponentOptions<Vue>;

  const plugin: PluginObject<unknown>;
  export default plugin;
}
