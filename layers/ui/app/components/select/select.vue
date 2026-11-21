<template>
  <div class="select">
    <select-root :model-value="String(index)" @update:model-value="onValueChange">
      <select-trigger class="select__title" aria-label="Выбрать значение">
        <select-value>{{ title }}</select-value>
      </select-trigger>
      <select-portal>
        <select-content
          class="select__list"
          position="popper"
          :side-offset="4"
          align="start"
        >
          <select-viewport>
            <select-item
              v-for="(item, i) in items"
              :key="i"
              :value="String(i)"
              class="select__item"
            >
              <select-item-text>{{ item }}</select-item-text>
            </select-item>
          </select-viewport>
        </select-content>
      </select-portal>
    </select-root>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {

  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
} from 'reka-ui';
import type {
  SelectProps,
  SelectEmits,
} from './index';

defineOptions({ name: 'UiSelect' });
const props = withDefaults(defineProps<SelectProps>(), { items: () => [], modelValue: 0 });
const emit = defineEmits<SelectEmits>();
const index = computed(() => Number(props.modelValue) || 0);
const title = computed(() => props.items[index.value] || 'EMPTY');
function onValueChange(value: unknown) {
  if (typeof value === 'string') emit('update:modelValue', Number(value));
}
</script>

<style lang="scss" src="./select.scss">
</style>
