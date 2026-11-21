<template>
  <template v-if="allowMultiple">
    <b-poll-multiple-choice
      :model-value="modelValue"
      :options="options"
      :disabled="disabled"
      :id-prefix="idPrefix"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </template>
  <template v-else>
    <b-poll-single-choice
      :options="options"
      :disabled="disabled"
      @vote="$emit('vote', $event)"
    />
  </template>
</template>

<script setup lang="ts">
import type {
  PollChoicesProps,
  PollChoicesEmits,
} from './index';

defineOptions({ name: 'BPollChoices' });

withDefaults(defineProps<PollChoicesProps>(), {
  allowMultiple: false,
  disabled: false,
});

defineEmits<PollChoicesEmits>();
</script>

<style>
</style>
