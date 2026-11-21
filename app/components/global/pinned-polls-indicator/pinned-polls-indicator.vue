<template>
  <div class="pinned-polls-indicator" aria-hidden="true">
    <div class="pinned-polls-indicator__track" :style="{ transform: `translateY(-${offset}px)` }">
      <span
        v-for="index in count"
        :key="index"
        :class="segmentClassNames({ active: index - 1 === selectedIndex })"
        :style="{ height: `${segmentHeight}px` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PinnedPollsIndicatorProps } from './index';
import {
  bmc,
  flag,
} from '@rhapsodic/bem-classnames-vue';

const segmentClassNames = bmc('pinned-polls-indicator__segment', { active: flag('state', 'active') });
defineOptions({ name: 'BPinnedPollsIndicator' });
const props = defineProps<PinnedPollsIndicatorProps>();
const segmentHeight = computed(() => {
  const visibleCount = Math.min(props.count, 3);
  return visibleCount ? (40 - (visibleCount - 1) * 3) / visibleCount : 40;
});
const offset = computed(() => {
  const step = segmentHeight.value + 3;
  const totalHeight = props.count * step - 3;
  const centeredOffset = props.selectedIndex * step - (40 - segmentHeight.value) / 2;
  return Math.max(0, Math.min(centeredOffset, totalHeight - 40));
});
</script>

<style lang="scss" src="./pinned-polls-indicator.scss">
</style>
