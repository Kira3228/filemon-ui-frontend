<template>
  <aside class="app-menu h-full">
    <nav class="app-menu__list">
      <div
        v-for="(item, idx) in items"
        :key="item.title"
        class="app-menu__group"
      >
        <button
          type="button"
          class="app-menu__item"
          :class="{
            'app-menu__item--active': isActive(item),
            'app-menu__item--open': menus[idx],
          }"
          @click="handleItemClick(item, idx)"
        >
          <span class="app-menu__item-content">
            <span v-if="item.icon" class="app-menu__icon">
              <component
                v-if="item.icon && typeof item.icon === 'object'"
                :is="item.icon"
                class="w-6 h-6"
                v-bind="item.iconProps"
              />
              <span v-else class="material-icons">{{ item.icon }}</span>
            </span>
            <span class="app-menu__label">{{ item.title }}</span>
          </span>
          <span
            v-if="item.subMenu && item.subMenu.length"
            class="pi pi-angle-down app-menu__chevron"
            :class="{ 'app-menu__chevron--open': menus[idx] }"
          />
        </button>

        <div
          v-if="item.subMenu && item.subMenu.length && menus[idx]"
          class="app-menu__submenu"
        >
          <button
            v-for="(sub, index) in item.subMenu"
            :key="`${item.title}-${index}`"
            type="button"
            class="app-menu__subitem"
            :class="{ 'app-menu__subitem--active': isActive(sub) }"
            @click="handleSubItemClick(sub)"
          >
            <span v-if="sub.icon" class="app-menu__icon">
              <component
                v-if="typeof sub.icon === 'object'"
                :is="sub.icon"
                class="w-5 h-5"
                v-bind="sub.iconProps"
              />
              <span v-else class="material-icons">{{ sub.icon }}</span>
            </span>
            <span class="app-menu__label">{{ sub.title }}</span>
          </button>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router/composables";
import type { TMenuItem } from "./menu-item.type";

const props = defineProps<{ items: TMenuItem[] }>();

const emit = defineEmits<{
  (e: "menu-click", payload: { to?: string; title?: string }): void;
}>();

const route = useRoute();
const router = useRouter();
const menus = ref<boolean[]>(props.items.map(() => false));

const navigateTo = (item: TMenuItem) => {
  if (item.to && item.to !== route.path) {
    router.push(item.to).catch(() => {
      `err`;
    });
  }
  emit("menu-click", { to: item.to, title: item.title });
};

const isActive = (item: TMenuItem) => {
  if (!item.to) {
    return false;
  }

  return route.path === item.to || route.path.startsWith(`${item.to}/`);
};

const handleItemClick = (item: TMenuItem, idx: number) => {
  if (item.subMenu && item.subMenu.length) {
    menus.value[idx] = !menus.value[idx];
  }

  navigateTo(item);
};

const handleSubItemClick = (item: TMenuItem) => {
  navigateTo(item);
};
</script>
<style scoped>
.app-menu {
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: var(--app-surface);
  border-right: 1px solid var(--app-border);
  padding: 1rem 0.75rem;
  overflow-y: auto;
}

.app-menu__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-menu__group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.app-menu__item,
.app-menu__subitem {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--app-text);
  cursor: pointer;
  border-radius: 0.875rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.app-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
}

.app-menu__item-content,
.app-menu__subitem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-menu__item:hover,
.app-menu__subitem:hover {
  background: var(--app-surface-muted);
}

.app-menu__item--active,
.app-menu__subitem--active {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.app-menu__submenu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-left: 0.5rem;
}

.app-menu__subitem {
  padding: 0.7rem 0.875rem;
}

.app-menu__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
}

.app-menu__label {
  text-align: left;
  font-size: 0.95rem;
}

.app-menu__chevron {
  transition: transform 0.2s ease;
}

.app-menu__chevron--open {
  transform: rotate(180deg);
}
</style>
