<template>
  <div class="actions-dropdown">
    <dropdown-menu-root :open="opened" :modal="false" @update:open="setOpen">
      <dropdown-menu-trigger as-child :disabled="disabled">
        <ui-button
          class="actions-dropdown__trigger"
          type="button"
          :aria-label="label"
          :disabled="disabled"
        >
          <slot name="icon"><svg-icon name="ellipsis" aria-hidden="true" /></slot>
        </ui-button>
      </dropdown-menu-trigger>
      <dropdown-menu-portal>
        <dropdown-menu-content
          :id="id"
          class="context-menu actions-dropdown__menu"
          side="bottom"
          align="end"
          :aria-label="label"
          :collision-padding="8"
        >
          <ul class="context-menu__items">
            <slot :close="close" />
          </ul>
        </dropdown-menu-content>
      </dropdown-menu-portal>
    </dropdown-menu-root>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onBeforeUnmount,
} from 'vue';
import {

  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuPortal,
} from 'reka-ui';
import type {
  ActionsDropdownProps,
  ActionsDropdownEmits,
  ActionsDropdownSlots,
} from './index';

defineOptions({ name: 'BActionsDropdown' });
withDefaults(defineProps<ActionsDropdownProps>(), { disabled: false });
defineEmits<ActionsDropdownEmits>();
defineSlots<ActionsDropdownSlots>();
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

<style lang="scss" src="./actions-dropdown.scss">
</style>
