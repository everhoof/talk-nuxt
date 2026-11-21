<template>
  <svg
    class="icon"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    aria-hidden="true"
    focusable="false"
    v-html="content"
  />
</template>
<script setup lang="ts">
import type { SvgIconProps } from './index';
import { computed } from 'vue';

const props = defineProps<SvgIconProps>();
const icons = import.meta.glob('~/assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const markup = computed(() => Object.entries(icons).find(([path]) => path.endsWith(`/${props.name}.svg`))?.[1] || '');
const viewBox = computed(() => (/viewBox="([^"]+)"/.exec(markup.value))?.[1] || '0 0 24 24');
const content = computed(() =>
  markup.value.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, ''));
</script>

<style>
</style>
