<template>
  <div class="page__wrapper">
    <div class="page__header" />
    <div class="page__main">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBMC } from '@rhapsodic/bem-classnames-vue';

const settingsStore = useSettingsStore();
const pageClassNames = useBMC(() => ({ theme: settingsStore.theme }), 'page', { theme: true });
useHead(() => ({ htmlAttrs: { class: pageClassNames.value } }));
</script>

<style>
</style>
