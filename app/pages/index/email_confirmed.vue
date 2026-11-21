<template>
  <b-email-confirmed-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_email_confirmed', path: '/email_confirmed' });
</script>

<style>
</style>
