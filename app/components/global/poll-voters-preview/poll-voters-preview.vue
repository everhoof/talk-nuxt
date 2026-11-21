<template>
  <button
    class="poll-voters-preview"
    type="button"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span
      v-for="voter in voters.slice(0, 3)"
      :key="voter.id"
      class="poll-voters-preview__item"
      :title="voter.username"
      aria-hidden="true"
    >
      <b-poll-voter-avatar
        :username="voter.username"
        :user-id="voter.id"
        :src="voter.avatarUrl"
        tiny
      />
    </span>
    <template v-if="voters.length > 3">
      <span class="poll-voters-preview__item" aria-hidden="true">
        <span class="poll-voters-preview__more">+{{ voters.length - 3 }}</span>
      </span>
    </template>
  </button>
</template>

<script setup lang="ts">
import type {
  PollVotersPreviewProps,
  PollVotersPreviewEmits,
} from './index';

defineOptions({ name: 'BPollVotersPreview' });

withDefaults(defineProps<PollVotersPreviewProps>(), {
  disabled: false,
});

defineEmits<PollVotersPreviewEmits>();
</script>

<style lang="scss" src="./poll-voters-preview.scss">
</style>
