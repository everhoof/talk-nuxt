<template>
  <b-request-email-confirmation-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_request_email_confirmation', path: '/request_email_confirmation' });
</script>

<style>
</style>
