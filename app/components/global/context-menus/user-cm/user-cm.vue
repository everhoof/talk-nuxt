<template>
  <b-context-menu>
    <template #trigger>
      <slot />
    </template>
    <template #default>
      <b-context-menu-item icon="person" @click="openProfile">Профиль</b-context-menu-item>
      <template v-if="auth.loggedIn && user.username">
        <b-context-menu-item icon="reply" @click="mention">Упомянуть</b-context-menu-item>
      </template>
    </template>
  </b-context-menu>
</template>

<script setup lang="ts">
import type {
  UserCmProps,
  UserCmSlots,
} from './index';

defineOptions({ name: 'BUserCm' });
const props = defineProps<UserCmProps>();
defineSlots<UserCmSlots>();
const auth = useAuthStore();
const messages = useMessagesStore();
const router = useRouter();
function openProfile() {
  void router.push({ name: 'modal_profile', params: { id: props.user.id } });
}
function mention() {
  if (auth.loggedIn && props.user.username) messages.mention({ id: props.user.id, username: props.user.username });
}
</script>

<style>
</style>
