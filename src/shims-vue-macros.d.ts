// Type declarations for Vue 3 compiler macros (defineProps, defineEmits, withDefaults)
// These are available in Vue 2.7+ with <script setup>
// Note: Generic type parameters in <script setup generic="T, H"> are Vue 3.3+ only
// For Vue 2.7, you may need to use type parameters differently

declare global {
  // defineProps
  function defineProps<Props = {}>(): Props;
  function defineProps<Props = {}>(props: Props): Props;

  // defineEmits - support function overload syntax (Vue 3 style)
  // Accepts union of function signatures like: { (e: "event1", arg: T): void; (e: "event2"): void; }
  function defineEmits<Type = Record<string, (...args: any[]) => any> | ((...args: any[]) => any)>():
    Type extends Record<string, (...args: any[]) => any>
      ? (e: keyof Type, ...args: Parameters<Type[keyof Type]>) => void
      : Type extends ((...args: any[]) => any)
      ? Type
      : (e: string, ...args: any[]) => void;

  // withDefaults
  function withDefaults<Props extends {}, Defaults extends Partial<Props>>(
    props: Props,
    defaults: Defaults
  ): Props & Required<Pick<Props, keyof Defaults>>;

  // defineExpose
  function defineExpose(exposed: Record<string, any>): void;

  // defineOptions
  function defineOptions(options: any): void;

  // defineSlots
  function defineSlots<Slots extends Record<string, any>>(): Slots;

  // defineModel
  function defineModel<T = any>(): {
    modelValue: T;
    "onUpdate:modelValue": (value: T) => void;
  };
  function defineModel<T = any>(name: string): {
    [key: string]: T | ((value: T) => void);
  };
}

export {};
