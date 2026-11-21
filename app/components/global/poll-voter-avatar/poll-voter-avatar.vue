<template>
  <b-user-avatar
    class="poll-voter-avatar"
    :username="username"
    :user-id="userId"
    :src="src"
    :tiny="tiny"
  />
</template>

<script setup lang="ts">
import type { PollVoterAvatarProps } from './index';

defineOptions({ name: 'BPollVoterAvatar' });

withDefaults(defineProps<PollVoterAvatarProps>(), {
  src: null,
  tiny: false,
});
</script>

<style>
</style>
