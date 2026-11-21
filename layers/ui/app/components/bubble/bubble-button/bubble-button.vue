<template>
  <ui-tooltip position="top" :disabled="!$slots.hint">
    <template #trigger>
      <button
        v-bind="$attrs"
        type="button"
        :class="classNames"
        @click="$emit('click', $event)"
      >
        <slot />
      </button>
    </template>
    <template #default><slot name="hint" /></template>
  </ui-tooltip>
</template>

<script setup lang="ts">
import type {
  BubbleButtonProps,
  BubbleButtonEmits,
  BubbleButtonSlots,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';

defineOptions({ name: 'UiBubbleButton', inheritAttrs: false });

const props = withDefaults(defineProps<BubbleButtonProps>(), {
  isActive: false,
});

const classNames = useBMC(props, 'bubble-button', { isActive: flag('state', 'active') });

defineEmits<BubbleButtonEmits>();

defineSlots<BubbleButtonSlots>();
</script>

<style lang="scss" scoped>
.bubble-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: .3125rem;

  &:hover {
    color: var(--text-primary);
    background: var(--background-primary);
  }

  & .icon {
    display: block;
    width: 1em;
    height: 1em;
    fill: currentColor;
    font-size: 1.3125rem;
  }

  &_state {
    &_active {
      color: var(--text-primary);
      background: var(--background-primary);
    }
  }
}
</style>
