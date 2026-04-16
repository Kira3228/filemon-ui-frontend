declare global {
  namespace JSX {
    interface Element extends import("vue").VNode {}
    interface ElementClass extends import("vue").default {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
