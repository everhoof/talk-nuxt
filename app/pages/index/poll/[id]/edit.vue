<template>
  <b-poll-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_poll_edit', path: '/poll/:id/edit' });
</script>

<style>
</style>
