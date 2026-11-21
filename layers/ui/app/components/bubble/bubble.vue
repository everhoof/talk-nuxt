<template>
  <div class="bubble">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { BubbleSlots } from './index';

defineOptions({ name: 'UiBubble' });

defineSlots<BubbleSlots>();
</script>

<style lang="scss" scoped>
.bubble {
  display: flex;
  padding: .375rem;
  background: var(--background-secondary);
  border: 1px solid var(--background-primary);
  border-radius: .3125rem;
  box-shadow: 0 10px 6px 0 var(--shadow);

  & > * + * {
    margin-left: .1875rem;
  }
}
</style>
