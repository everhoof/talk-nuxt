<template>
  <tooltip-provider :delay-duration="300">
    <tooltip-root :disabled="disabled">
      <tooltip-trigger as-child><slot name="trigger" /></tooltip-trigger>
      <tooltip-portal>
        <tooltip-content :side="position" :side-offset="8" class="tooltip-light">
          <span class="tooltip-light__text"><slot /></span>
          <tooltip-arrow class="tooltip-light__arrow" />
        </tooltip-content>
      </tooltip-portal>
    </tooltip-root>
  </tooltip-provider>
</template>

<script setup lang="ts">
import type {
  TooltipProps,
  TooltipSlots,
} from './index';
import {

  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui';

defineOptions({ name: 'UiTooltip' });

withDefaults(defineProps<TooltipProps>(), {
  position: 'bottom',
  disabled: false,
});

defineSlots<TooltipSlots>();
</script>

<style lang="scss" scoped>
.tooltip-light {
  --background-tooltip: var(--background-secondary);
  --border-tooltip: var(--background-primary);
  --text-tooltip: var(--text-primary);

  position: relative;
  z-index: 1;
  display: inline-block;
  padding: .3125rem .625rem;
  color: var(--text-tooltip);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.3;
  text-align: center;
  cursor: default;
  user-select: none;
  background: var(--background-tooltip);
  border: 1px solid var(--border-tooltip);
  border-radius: .3125rem;

  &__text {
    position: relative;
    z-index: 2;
  }

  &__arrow {
    fill: var(--background-tooltip);
  }
}
</style>
