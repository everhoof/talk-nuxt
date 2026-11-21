<template>
  <!-- begin .form-->
  <form class="form" :name="name">
    <template v-if="title">
      <h3 class="form__title">{{ title }}</h3>
    </template>
    <div class="form__content">
      <template v-if="errors.length > 0">
        <div class="form__row">
          <b-form-error :errors="errors" width-full />
        </div>
      </template>
      <slot />
    </div>
  </form>
  <!-- end .form-->
</template>

<script setup lang="ts">
import type {
  FormProps,
  FormSlots,
} from './index';

defineOptions({ name: 'BForm' });

withDefaults(defineProps<FormProps>(), {
  errors: () => [],
});

defineSlots<FormSlots>();
</script>

<style lang="scss" src="./form.scss">
</style>
