<template>
  <span class="tooltip-light" :class="modifiers">
    <span class="tooltip-light__text">
      <slot />
    </span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import type { PropType } from 'vue';

@Component({
  name: 'b-tooltip',
})
export default class Tooltip extends Vue {
  @Prop({
    required: false,
    type: String as PropType<'left' | 'top' | 'right' | 'bottom'>,
    default: 'bottom',
  })
  readonly position!: string;

  get modifiers(): string[] {
    return [`tooltip-light_position_${this.position}`];
  }
}
</script>

<style lang="stylus" scoped>
.tooltip-light
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

  &::after
    content: "";
    position: absolute;
    width: .5rem;
    height: .5rem;
    background: var(--background-tooltip);
    border: 1px solid var(--border-tooltip);
    border-top: none;
    border-right: none;

  &__text
    position: relative;
    z-index: 2;

  &_position
    &_top
      &::after
        top: -1px;
        left: 50%;
        transform: translate(-50%, -50%) rotate(135deg);

    &_right
      &::after
        top: 50%;
        right: -1px;
        transform: translate(50%, -50%) rotate(-135deg);

    &_bottom
      &::after
        left: 50%;
        bottom: -1px;
        transform: translate(-50%, 50%) rotate(-45deg);

    &_left
      &::after
        top: 50%;
        left: -1px;
        transform: translate(-50%, -50%) rotate(45deg);
</style>
