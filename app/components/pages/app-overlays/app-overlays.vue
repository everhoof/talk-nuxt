<template>
  <client-only>
    <teleport to="body">
      <component
        :is="modal.component"
        v-for="modal in modals"
        :key="modal.name"
        v-bind="modal.props"
        @close="overlays.modal.hide(modal.name)"
      />
      <toast-provider :duration="6000">
        <toast-root
          v-for="notice in notices"
          :key="notice.id"
          class="notification"
          @update:open="onNoticeOpen(notice.id, $event)"
        >
          <toast-description>{{ notice.message }}</toast-description>
          <toast-close class="notification__close" aria-label="Закрыть уведомление">×</toast-close>
        </toast-root>
        <toast-viewport class="notifications" label="Уведомления" />
      </toast-provider>
    </teleport>
  </client-only>
</template>

<script setup lang="ts">
import {

  ToastProvider,
  ToastRoot,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from 'reka-ui';

const overlays = useOverlays();

const { modals, notices } = overlays;
function onNoticeOpen(id: number, open: boolean) {
  if (!open) overlays.notify.dismiss(id);
}
</script>

<style lang="scss">
.notifications {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 10000;
  width: calc(100vw - 2rem);
  max-width: 24rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notification {
  margin-bottom: .5rem;
  padding: 1rem;
  color: white;
  background: #b71c1c;
  border-radius: 4px;
  box-shadow: 0 2px 8px #00000044;

  &__close {
    float: right;
    margin-left: .5rem;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: none;
  }
}
</style>
