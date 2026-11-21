<template>
  <b-login-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_login', path: '/login' });
</script>

<style>
</style>
