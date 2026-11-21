<template>
  <!-- begin .attach-panel-->
  <div class="attach-panel">
    <div
      class="attach-panel__item"
      @click="selectPicture"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="selectPicture"
      @keydown.space.prevent="selectPicture"
    >
      <svg-icon name="image" class="attach-panel__icon" />
      <div class="attach-panel__text">Picture</div>
    </div>
    <div
      class="attach-panel__item"
      @click="selectDocument"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="selectDocument"
      @keydown.space.prevent="selectDocument"
    >
      <svg-icon name="description" class="attach-panel__icon" />
      <div class="attach-panel__text">Document</div>
    </div>
  </div>
  <!-- end .attach-panel-->
</template>

<script setup lang="ts">
import type { AttachPanelEmits } from './index';

const emit = defineEmits<AttachPanelEmits>();

defineOptions({ name: 'BAttachPanel' });

function selectPicture(): void {
  emit('select', { icon: 'image', text: 'Picture', id: 0 });
}

function selectDocument(): void {
  emit('select', { icon: 'description', text: 'Document', id: 1 });
}
</script>

<style lang="scss" src="./attach-panel.scss">
</style>
