<template>
  <ui-button
    :type="type"
    :class="classNames"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </ui-button>
</template>

<script setup lang="ts">
import type {
  PollButtonProps,
  PollButtonEmits,
  PollButtonSlots,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';

defineOptions({ name: 'BPollButton' });

const props = withDefaults(defineProps<PollButtonProps>(), {
  type: 'button',
  disabled: false,
  secondary: false,
});

const classNames = useBMC(props, 'poll-button', { secondary: flag('variant', 'secondary') });

defineEmits<PollButtonEmits>();

defineSlots<PollButtonSlots>();
</script>

<style lang="scss" src="./poll-button.scss">
</style>
