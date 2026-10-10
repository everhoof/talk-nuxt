<template>
  <div class="actions-dropdown">
    <b-button
      ref="trigger"
      class="actions-dropdown__trigger"
      type="button"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="opened"
      :aria-controls="menuId"
      :disabled="disabled"
      @click="toggle"
      @keydown.native.down.prevent="open($event)"
      @keydown.native.up.prevent="open($event, true)"
    >
      <slot name="icon"><svg-icon name="ellipsis" aria-hidden="true" /></slot>
    </b-button>
    <b-context-menu
      :id="menuId"
      ref="menu"
      class="actions-dropdown__menu"
      placement="bottom-end"
      role="menu"
      :aria-label="label"
      @keydown.native="onKeydown"
      @click.native="close"
      @focusout.native="onFocusout"
    >
      <slot :close="close" />
    </b-context-menu>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'nuxt-property-decorator';
import BButton from '~/components/button/button.vue';
import BContextMenu from '~/components/context-menu/context-menu.vue';

@Component({ name: 'b-actions-dropdown', components: { BButton, BContextMenu } })
export default class ActionsDropdown extends Vue {
  @Prop({ type: String, required: true }) label!: string;
  @Prop({ type: Boolean, default: false }) disabled!: boolean;
  @Prop({ type: String, required: true }) id!: string;
  @Ref() menu!: BContextMenu;
  @Ref() trigger!: Vue;

  opened = false;

  get menuId(): string {
    return this.id;
  }

  mounted(): void {
    this.$watch(
      () => this.menu.opened,
      (opened: boolean) => {
        this.opened = opened;
      },
    );
  }

  items(): HTMLButtonElement[] {
    return Array.from(this.menu.$el.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();

    if (this.opened) {
      this.close();
      return;
    }

    this.open(event);
  }

  async open(event: MouseEvent | KeyboardEvent, last = false): Promise<void> {
    if (this.disabled) {
      return;
    }

    event.stopPropagation();
    this.$nuxt.$emit('close-context-menus');
    this.menu.open(event as MouseEvent, {}, this.trigger.$el);
    this.opened = true;
    await this.$nextTick();

    const items = this.items();

    items.forEach((item) => {
      item.setAttribute('role', 'menuitem');
      item.tabIndex = -1;
    });
    let focusedItem = items[0];

    if (last) {
      focusedItem = items[items.length - 1];
    }

    focusedItem?.focus();
  }

  close(): void {
    this.menu.close();
    this.opened = false;
  }

  onFocusout(event: FocusEvent): void {
    if (event.relatedTarget && !this.$el.contains(event.relatedTarget as Node)) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      (this.trigger.$el as HTMLElement).focus();

      return;
    }

    if (event.key === 'Tab') {
      this.close();

      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const items = this.items();

    if (!items.length) {
      return;
    }

    const focusedItem = document.activeElement as HTMLButtonElement;
    const currentIndex = items.indexOf(focusedItem);
    let direction = 1;

    if (event.key === 'ArrowUp') {
      direction = -1;
    }

    const nextIndex = currentIndex + direction;
    let index = (nextIndex + items.length) % items.length;

    if (event.key === 'Home') {
      index = 0;
    }

    if (event.key === 'End') {
      index = items.length - 1;
    }

    items[index].focus();
  }
}
</script>

<style lang="stylus" src="./actions-dropdown.styl" />
