<template>
  <div
    :class="classNames"
    :style="{
      '--user-avatar__accent': accent,
      '--user-avatar__tint': tint,
    }"
  >
    <template v-if="src">
      <img
        :src="src"
        alt=""
        class="user-avatar__image"
      />
    </template>
    <template v-else>
      <svg
        class="user-avatar__initials"
        viewBox="0 0 100 100"
        role="img"
        :aria-label="initials"
      >
        <text
          x="50"
          y="50"
          dy=".35em"
          text-anchor="middle"
        >{{ initials }}</text>
      </svg>
    </template>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type {
  UserAvatarProps,
  UserAvatarSlots,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { computed } from 'vue';

import { getUserColor } from '~/tools/util';

defineOptions({ name: 'BUserAvatar' });

const props = withDefaults(defineProps<UserAvatarProps>(), {
  src: null,
  tiny: false,
});

const classNames = useBMC(props, 'user-avatar', { tiny: flag('size', 'tiny') });

const accent = computed((): string => {
  return getUserColor(props.userId);
});

const tint = computed((): string => {
  const color = accent.value.slice(1);
  const red = Number.parseInt(color.slice(0, 2), 16);
  const green = Number.parseInt(color.slice(2, 4), 16);
  const blue = Number.parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, 0.2)`;
});

const initials = computed((): string => {
  return [...props.username].slice(0, 2)
    .join('')
    .toUpperCase();
});

defineSlots<UserAvatarSlots>();
</script>

<style lang="scss" src="./user-avatar.scss">
</style>
