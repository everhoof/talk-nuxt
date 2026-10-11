<template>
  <!-- begin .context-menu-->
  <nav v-show="isVisible" ref="popper" class="context-menu" tabindex="-1" @contextmenu.capture.prevent>
    <ul class="context-menu__items">
      <li class="context-menu__item context-menu__item_display_only-child">
        <button class="context-menu__button" disabled>Нет действий</button>
      </li>
      <slot />
    </ul>
  </nav>
  <!-- end .context-menu-->
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, InjectReactive } from 'nuxt-property-decorator';
import Popper from 'popper.js';

@Component({
  name: 'b-context-menu',
})
export default class ContextMenu extends Vue {
  @InjectReactive('context-menu') readonly contextMenu!: ContextMenu | null;
  @InjectReactive('user-context-menu') readonly userContextMenu!: ContextMenu | null;
  @InjectReactive('message-context-menu') readonly messageContextMenu!: ContextMenu | null;
  @Prop({ type: String, default: 'body' }) boundariesElement!: string;
  @Prop({ type: String, default: 'right-start' }) placement!: Popper.Placement;
  @Ref('popper') popperElm!: Element;

  popper?: Popper;
  opened: boolean = false;
  contextData: any = null;

  get isVisible(): boolean {
    return this.opened;
  }

  created(): void {
    if (process.client) {
      this.$nuxt.$on('close-context-menus', this.close);
    }
  }

  mounted() {
    document.addEventListener('click', this.documentClick);
    document.addEventListener('keydown', this.documentKeyDown);
  }

  documentClick(event: MouseEvent) {
    if (!this.popperElm.contains(event.target as Node)) {
      this.close();
    }
  }

  documentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  open(evt: MouseEvent, contextData = {}, reference?: Element) {
    this.contextMenu?.close();
    this.userContextMenu?.close();
    this.messageContextMenu?.close();
    this.opened = true;
    this.contextData = contextData;

    if (this.popper) {
      this.popper.destroy();
    }

    this.popper = new Popper(reference || (this.referenceObject(evt) as any), this.popperElm, {
      placement: this.placement,
      modifiers: {
        preventOverflow: {
          boundariesElement: document.querySelector(this.boundariesElement) as Element,
        },
      },
    });

    // Recalculate position
    this.$nextTick(() => {
      this.popper?.scheduleUpdate();
    });
  }

  close() {
    this.opened = false;
    this.contextData = null;
  }

  referenceObject(evt: MouseEvent) {
    const left = evt.clientX;
    const top = evt.clientY;
    const right = left + 1;
    const bottom = top + 1;
    const clientWidth = 1;
    const clientHeight = 1;

    function getBoundingClientRect() {
      return {
        left,
        top,
        right,
        bottom,
        height: clientHeight,
        width: clientWidth,
      };
    }

    return {
      getBoundingClientRect,
      clientWidth,
      clientHeight,
    };
  }

  beforeDestroy(): void {
    if (process.client) {
      document.removeEventListener('click', this.documentClick);
      document.removeEventListener('keydown', this.documentKeyDown);

      if (this.popper !== undefined) {
        this.popper.destroy();
      }

      this.$nuxt.$off('close-context-menus', this.close);
    }
  }
}
</script>

<style lang="stylus" src="./context-menu.styl" />
