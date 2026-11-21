<template>
  <b-profile-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_profile', path: '/profile/:id' });
const { error } = await useProfileUser();
if (error.value) throw createError(error.value);
</script>

<style>
</style>
