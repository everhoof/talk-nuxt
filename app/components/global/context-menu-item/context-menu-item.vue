<template>
  <!-- begin .context-menu-item-->
  <li :class="classNames" role="presentation">
    <context-menu-item as-child>
      <button type="button" class="context-menu__button" @click="emit('click', $event)">
        <span class="context-menu__text">
          <slot />
        </span>
        <template v-if="icon">
          <svg-icon class="context-menu__icon" :name="icon" />
        </template>
      </button>
    </context-menu-item>
  </li>
  <!-- end .context-menu-item-->
</template>

<script setup lang="ts">
import { ContextMenuItem } from 'reka-ui';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import type {
  ContextMenuItemProps,
  ContextMenuItemEmits,
  ContextMenuItemSlots,
} from './index';

defineOptions({ name: 'BContextMenuItem' });
const props = withDefaults(defineProps<ContextMenuItemProps>(), { important: false });
const classNames = useBMC(props, 'context-menu__item', { important: flag('color', 'danger') });
const emit = defineEmits<ContextMenuItemEmits>();
defineSlots<ContextMenuItemSlots>();
</script>

<style lang="scss" src="./context-menu-item.scss">
</style>
