<template>
  <dialog-root open @update:open="onOpenChange">
    <dialog-overlay :class="classNames">
      <dialog-content
        as-child
        :aria-describedby="undefined"
        @interact-outside="onInteractOutside"
        @escape-key-down="onEscape"
      >
        <ui-tile class="tile_padding_medium tile_borders_all modal__tile" aria-modal="true">
          <div class="modal__header">
            <dialog-title as="h3" class="modal__title">
              <slot name="title" />
            </dialog-title>
            <template v-if="!noCloseButton">
              <dialog-close as-child>
                <button type="button" :aria-label="closeLabel" class="modal__close">
                  <svg-icon name="close" />
                </button>
              </dialog-close>
            </template>
          </div>
          <slot />
        </ui-tile>
      </dialog-content>
    </dialog-overlay>
  </dialog-root>
</template>

<script setup lang="ts">
import {

  DialogRoot,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import type {
  ModalProps,
  ModalEmits,
  ModalSlots,
} from './index';

defineOptions({ name: 'BModal' });
const props = withDefaults(defineProps<ModalProps>(), {
  closeLabel: 'Закрыть', noImplicitClose: false, noCloseButton: false,
});
const classNames = useBMC(props, 'modal', { noImplicitClose: flag('no', 'implicit-close') });
const emit = defineEmits<ModalEmits>();
function onOpenChange(open: boolean) {
  if (!open) emit('close', new Event('close'));
}
function onInteractOutside(event: Event) {
  if (props.noImplicitClose) event.preventDefault();
}
function onEscape(event: KeyboardEvent) {
  if (props.noImplicitClose) event.preventDefault();
}
defineSlots<ModalSlots>();
</script>

<style lang="scss" src="./modal.scss">
</style>
