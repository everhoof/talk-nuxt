<template>
  <!-- begin .button-->
  <template v-if="to">
    <router-link
      :class="classNames"
      :to="to"
      :disabled="disabled"
      @click="$emit('click', $event)"
    >
      <slot />
    </router-link>
  </template>
  <template v-else>
    <component
      :is="tag"
      :class="classNames"
      :disabled="disabled"
      @click="$emit('click', $event)"
    >
      <slot />
    </component>
  </template>
  <!-- end .button-->
</template>

<script setup lang="ts">
import type {
  ButtonProps,
  ButtonEmits,
  ButtonSlots,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';

defineOptions({ name: 'UiButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
  tag: 'button',
  small: false,
  medium: false,
  large: false,
  block: false,
  widthFull: false,
  active: false,
  disabled: false,
  noWrap: false,
  margin: false,
});

const classNames = useBMC(props, 'button', {
  small: flag('size', 'small'),
  medium: flag('size', 'medium'),
  large: flag('size', 'large'),
  block: flag('display', 'block'),
  widthFull: flag('width', 'full'),
  active: flag('type', 'active'),
  noWrap: flag('no', 'wrap'),
  margin: flag('with', 'margin'),
});

defineEmits<ButtonEmits>();

defineSlots<ButtonSlots>();
</script>

<style lang="scss" src="./button.scss">
</style>
