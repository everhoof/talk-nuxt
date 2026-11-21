<template>
  <!-- begin .form-error-->
  <div :class="classNames">
    <svg-icon class="form-error__icon" :name="icon" />
    <p v-for="(error, i) of errors" :key="i" class="form-error__text">– {{ error }}</p>
  </div>
  <!-- end .form-error-->
</template>

<script setup lang="ts">
import type { FormErrorProps } from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';

defineOptions({ name: 'BFormError' });

const props = withDefaults(defineProps<FormErrorProps>(), {
  errors: () => [],
  icon: 'error_outline',
  widthFull: false,
  margin: false,
});

const classNames = useBMC(props, 'form-error', {
  widthFull: flag('width', 'full'),
  margin: flag('with', 'margin'),
});
</script>

<style lang="scss" src="./form-error.scss">
</style>
