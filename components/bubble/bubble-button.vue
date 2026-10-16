<template>
  <button type="button" class="bubble-button" :class="modifiers" @click="$emit('click', $event)">
    <template v-if="$slots.hint">
      <span class="bubble-button__hint">
        <b-tooltip>
          <slot name="hint" />
        </b-tooltip>
      </span>
    </template>
    <slot />
  </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { PropType } from 'vue';
import BTooltip from '~/components/tooltip.vue';

@Component({
  name: 'b-bubble-button',
  components: { BTooltip },
})
export default class BubbleButton extends Vue {
  @Prop({
    required: false,
    type: Boolean as PropType<boolean>,
    default: false,
  })
  public readonly isActive!: boolean;

  get modifiers(): string[] {
    const modifiers: string[] = [];
    if (this.isActive) {
      modifiers.push('bubble-button_state_active');
    }
    return modifiers;
  }
}
</script>

<style lang="stylus" scoped>
.bubble-button
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--text-secondary);
  font-size: 18px;
  background: transparent;
  border: 0;
  border-radius: .3125rem;
  cursor: pointer;

  &:hover
    color: var(--text-primary);
    background: var(--background-primary);

    & ^[0]__hint
      visibility: visible;
      opacity: 1;
      transition-delay: 0s;

  & .icon
    display: block;
    font-size: 1.3125rem;
    width: 1em;
    height: 1em;
    fill: currentColor;

  &__hint
    position: absolute;
    top: -14px;
    left: 50%;
    display: inline-block;
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear .3s, opacity .3s ease-out;
    transform: translateX(-50%) translateY(-100%);

  &_state
    &_active
      color: var(--text-primary);
      background: var(--background-primary);
</style>
