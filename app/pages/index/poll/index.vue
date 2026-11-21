<template>
  <b-poll-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_poll', path: '/poll' });
</script>

<style>
</style>
