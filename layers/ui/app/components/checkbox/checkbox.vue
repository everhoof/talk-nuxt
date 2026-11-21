<template>
  <!-- begin .checkbox-->
  <div :class="classNames">
    <input
      :id="id"
      :checked="modelValue"
      class="checkbox__input"
      type="checkbox"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <label :for="id" class="checkbox__label">
      <slot />
    </label>
  </div>
  <!-- end .checkbox-->
</template>

<script setup lang="ts">
import type {
  CheckboxProps,
  CheckboxEmits,
  CheckboxSlots,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';

defineOptions({ name: 'UiCheckbox' });

const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
  modelValue: false,
  inline: false,
  margin: false,
});

const classNames = useBMC(props, 'checkbox', {
  inline: flag('display', 'inline-block'),
  margin: flag('with', 'margin'),
});

defineEmits<CheckboxEmits>();

defineSlots<CheckboxSlots>();
</script>

<style lang="scss" src="./checkbox.scss">
</style>
