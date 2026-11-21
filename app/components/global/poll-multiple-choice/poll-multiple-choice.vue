<template>
  <div class="poll-multiple-choice">
    <ui-checkbox
      v-for="option in options"
      :id="`${idPrefix}-option-${option.id}`"
      :key="option.id"
      :class="choiceClassNames({
        selected: modelValue.includes(option.id),
        disabled,
      })"
      :model-value="modelValue.includes(option.id)"
      :disabled="disabled"
      @update:model-value="select(option.id, $event)"
    >
      <b-formatted-poll-text :content="option.label" />
    </ui-checkbox>
  </div>
</template>

<script setup lang="ts">
import type {
  PollMultipleChoiceProps,
  PollMultipleChoiceEmits,
} from './index';
import {
  bmc,
  flag,
} from '@rhapsodic/bem-classnames-vue';

const choiceClassNames = bmc('poll-multiple-choice__choice', {
  selected: flag('state', 'selected'),
  disabled: flag('state', 'disabled'),
});

defineOptions({ name: 'BPollMultipleChoice' });

const props = withDefaults(defineProps<PollMultipleChoiceProps>(), {
  disabled: false,
});

const emit = defineEmits<PollMultipleChoiceEmits>();

function select(id: number, selected: boolean): void {
  const ids = props.modelValue.filter((optionId) => optionId !== id);
  if (selected) {
    ids.push(id);
  }
  emit('update:modelValue', ids);
}
</script>

<style lang="scss" src="./poll-multiple-choice.scss">
</style>
