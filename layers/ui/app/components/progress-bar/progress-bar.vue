<template>
  <progress-root :model-value="Number(progress)" :max="100" class="progress-bar">
    <progress-indicator class="progress-bar__progress-state" :style="{ width: `${progress}%` }" />
  </progress-root>
</template>

<script setup lang="ts">
import {
  ProgressRoot,
  ProgressIndicator,
} from 'reka-ui';
import type { ProgressBarProps } from './index';

defineOptions({ name: 'UiProgressBar' });

withDefaults(defineProps<ProgressBarProps>(), {
  progress: 0,
});
</script>

<style lang="scss" src="./progress-bar.scss">
</style>
