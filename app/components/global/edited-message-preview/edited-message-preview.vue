<template>
  <!-- begin .edited-message-preview-->
  <div class="edited-message-preview">
    <div class="edited-message-preview__icon">
      <svg-icon name="edit" />
    </div>
    <div class="edited-message-preview__about">
      <div class="edited-message-preview__title">Изменить сообщение</div>
      <div class="edited-message-preview__text" v-html="content" />
    </div>
    <button
      type="button"
      class="edited-message-preview__cancel"
      aria-label="Отменить редактирование"
      @click="emit('cancel')"
    >
      <svg-icon name="close" />
    </button>
  </div>
  <!-- end .edited-message-preview-->
</template>

<script setup lang="ts">
import type {
  EditedMessagePreviewProps,
  EditedMessagePreviewEmits,
} from './index';

defineOptions({ name: 'BEditedMessagePreview' });

defineProps<EditedMessagePreviewProps>();
const emit = defineEmits<EditedMessagePreviewEmits>();
</script>

<style lang="scss" src="./edited-message-preview.scss">
</style>
