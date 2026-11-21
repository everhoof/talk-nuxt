<template>
  <!-- begin .switch-->
  <div :class="classNames">
    <input
      :id="id"
      v-model="checkedSynced"
      class="switch__input"
      type="checkbox"
      role="switch"
      :disabled="disabled"
    />
    <label :for="id" class="switch__label">
      <slot />
    </label>
  </div>
  <!-- end .switch-->
</template>

<script setup lang="ts">
import type {
  SwitchProps,
  SwitchEmits,
  SwitchSlots,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { computed } from 'vue';

defineOptions({ name: 'UiSwitch' });

const props = withDefaults(defineProps<SwitchProps>(), {
  disabled: false,
  margin: false,
  checked: false,
});

const classNames = useBMC(props, 'switch', { margin: flag('with', 'margin') });

const emit = defineEmits<SwitchEmits>();

const checkedSynced = computed({ get: () => props.checked, set: (value) => emit('update:checked', value) });

defineSlots<SwitchSlots>();
</script>

<style lang="scss" src="./switch.scss">
</style>
