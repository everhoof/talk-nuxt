<template>
  <b-request-password-reset-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_request_password_reset', path: '/request_password_reset' });
</script>

<style>
</style>
