<template>
  <!-- begin .text-field-->
  <label
    :for="id"
    :class="classNames"
  >
    <input
      :id="id"
      ref="update:modelValue"
      :value="modelValue"
      :type="type"
      class="text-field__input"
      :placeholder="placeholder"
      :disabled="disabled"
      :name="name"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="$emit('keydown', $event)"
      @keyup="$emit('keyup', $event)"
      @keypress="$emit('keypress', $event)"
    />
    <template v-if="icon">
      <svg-icon class="text-field__icon" :name="icon" />
    </template>
  </label>
  <!-- end .text-field-->
</template>

<script setup lang="ts">
import type {
  TextFieldProps,
  TextFieldEmits,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { useTemplateRef } from 'vue';

defineOptions({ name: 'UiTextField' });

const props = withDefaults(defineProps<TextFieldProps>(), {
  type: 'text',
  active: false,
  disabled: false,
  widthFull: false,
  margin: false,
  small: false,
});

const classNames = useBMC(props, 'text-field', {
  active: flag('type', 'active'),
  widthFull: flag('width', 'full'),
  margin: flag('with', 'margin'),
  small: flag('size', 'small'),
  hasIcon: flag('with', 'icon'),
}, { hasIcon: () => Boolean(props.icon) });

defineEmits<TextFieldEmits>();

const input = useTemplateRef<HTMLInputElement>('update:modelValue');

function focus() {
  input.value?.focus();
}

defineExpose({ focus });
</script>

<style lang="scss" src="./text-field.scss">
</style>
