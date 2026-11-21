<template>
  <b-punishment-modal @close="navigateTo({ name: 'main' })" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'modal_punishment', path: '/profile/:id/punish' });
const { error } = await useProfileUser();
if (error.value) throw createError(error.value);
</script>

<style>
</style>
