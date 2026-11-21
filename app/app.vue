<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
  <p-app-overlays />
</template>

<script setup lang="ts">
const settings = useSettingsStore();
await callOnce('preferences', () => settings.initialize());
</script>

<style>
</style>
