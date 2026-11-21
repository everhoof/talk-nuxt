<template>
  <b-register-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_register', path: '/register' });
</script>

<style>
</style>
