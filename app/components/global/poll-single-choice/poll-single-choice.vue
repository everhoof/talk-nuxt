<template>
  <div class="poll-single-choice">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="poll-single-choice__option"
      :disabled="disabled"
      @click="$emit('vote', [option.id])"
    >
      <b-formatted-poll-text :content="option.label" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type {
  PollSingleChoiceProps,
  PollSingleChoiceEmits,
} from './index';

defineOptions({ name: 'BPollSingleChoice' });

withDefaults(defineProps<PollSingleChoiceProps>(), {
  disabled: false,
});

defineEmits<PollSingleChoiceEmits>();
</script>

<style lang="scss" src="./poll-single-choice.scss">
</style>
