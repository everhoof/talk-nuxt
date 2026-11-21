<template>
  <b-settings-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_settings', path: '/settings' });
</script>

<style>
</style>
