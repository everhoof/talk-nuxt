<template>
  <context-menu-root :open="opened" :modal="false" @update:open="setOpen">
    <context-menu-trigger as-child :disabled="disabled">
      <slot name="trigger" />
    </context-menu-trigger>
    <context-menu-portal>
      <context-menu-content class="context-menu" :collision-padding="8" @contextmenu.prevent>
        <ul class="context-menu__items">
          <slot />
        </ul>
      </context-menu-content>
    </context-menu-portal>
  </context-menu-root>
</template>

<script setup lang="ts">
import {
  ref,
  onBeforeUnmount,
} from 'vue';
import {

  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
} from 'reka-ui';
import type {
  ContextMenuProps,
  ContextMenuSlots,
} from './index';

defineOptions({ name: 'BContextMenu' });
withDefaults(defineProps<ContextMenuProps>(), { disabled: false });
defineSlots<ContextMenuSlots>();
const opened = ref(false);
const events = useChatEvents();
function close() {
  opened.value = false;
}
function setOpen(value: boolean) {
  if (value) events.emit('close-context-menus');
  opened.value = value;
}
events.on('close-context-menus', close);
onBeforeUnmount(() => events.off('close-context-menus', close));
</script>

<style lang="scss" src="./context-menu.scss">
</style>
