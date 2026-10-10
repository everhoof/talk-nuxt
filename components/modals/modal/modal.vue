<template>
  <!-- begin .modal-->
  <div class="modal" :class="modifiers" @click.self="onOverlayClick" @keydown="onKeydown">
    <b-tile class="tile_padding_medium tile_borders_all modal__tile">
      <div class="modal__header">
        <h3 class="modal__title">
          <slot name="title" />
        </h3>
        <button
          v-if="!noCloseButton"
          type="button"
          :aria-label="closeLabel"
          class="modal__close"
          @click="$emit('close', $event)"
        >
          <svg-icon name="close" />
        </button>
      </div>
      <slot />
    </b-tile>
  </div>
  <!-- end .modal-->
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'nuxt-property-decorator';
import { Route } from 'vue-router';
import BTile from '~/components/tile/tile.vue';

@Component({
  name: 'b-modal',
  components: { BTile },
})
export default class Modal extends Vue {
  @Prop({ type: String, default: 'Закрыть' }) closeLabel!: string;
  @Prop({ type: Boolean, default: false }) trapFocus!: boolean;

  previousFocus: HTMLElement | null = null;

  mounted(): void {
    if (!this.trapFocus) {
      return;
    }

    this.previousFocus = document.activeElement as HTMLElement;
    this.$nextTick(() => {
      const firstControl = this.$el.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled)');
      firstControl?.focus();
    });
  }

  beforeDestroy(): void {
    if (!this.trapFocus || !this.previousFocus) {
      return;
    }

    if (document.documentElement.contains(this.previousFocus)) {
      this.previousFocus.focus();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.trapFocus) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.$emit('close', event);

      return;
    }

    if (event.key === 'Tab') {
      this.trapTabFocus(event);
    }
  }

  focusableElements(): HTMLElement[] {
    const selector = [
      'button:not(:disabled)',
      'input:not(:disabled)',
      'select:not(:disabled)',
      'textarea:not(:disabled)',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const elements = Array.from(this.$el.querySelectorAll<HTMLElement>(selector));

    return elements.filter((element) => element.getClientRects().length > 0);
  }

  trapTabFocus(event: KeyboardEvent): void {
    const elements = this.focusableElements();
    const first = elements[0];
    const last = elements[elements.length - 1];

    if (!first || !last) {
      return;
    }

    const focusedElement = document.activeElement;

    if (event.shiftKey && focusedElement === first) {
      event.preventDefault();
      last.focus();

      return;
    }

    if (!event.shiftKey && focusedElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  @Prop({
    required: false,
    type: Boolean,
    default: false,
  })
  noImplicitClose!: boolean;

  @Prop({
    required: false,
    type: Boolean,
    default: false,
  })
  noCloseButton!: boolean;

  get modifiers(): string[] {
    const modifiers: string[] = [];

    if (this.noImplicitClose) {
      modifiers.push('modal_no_implicit-close');
    }

    return modifiers;
  }

  @Watch('$route')
  onRouteChanged(newRoute: Route, oldRoute: Route) {
    if (newRoute.name !== oldRoute.name) {
      this.$emit('close', { route: true });
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (!this.noImplicitClose) {
      this.$emit('close', event);
    }
  }
}
</script>

<style lang="stylus" src="./modal.styl" />
<style lang="css">
.vm--container .vm--modal {
  background-color: transparent;
  box-shadow: none;
  border-radius: 0;
  overflow: unset;
}

.vm--container .vm-transition--overlay-enter-active,
.vm--container .vm-transition--overlay-leave-active {
  transition: all 250ms;
}
</style>
