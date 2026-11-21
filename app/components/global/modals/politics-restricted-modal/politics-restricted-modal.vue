<template>
  <b-modal no-implicit-close no-close-button @close="onClose">
    <template #title>
      {{ t('modals.politics.title') }}
    </template>
    <template #default>
      <div class="email-confirmed-modal">
        <div class="email-confirmed-modal__text" v-html="t('modals.politics.text')" />
        <ui-button
          class="email-confirmed-modal__button"
          width-full
          large
          @click="onClose"
        >
          {{ t('modals.politics.close') }}
        </ui-button>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { PoliticsRestrictedModalEmits } from './index';

const { t } = useI18n();
defineOptions({ name: 'BPoliticsRestrictedModal' });

const modalsStore = useModalsStore();

const emit = defineEmits<PoliticsRestrictedModalEmits>();

function onClose(event: Event): void {
  emit('close', event);
  modalsStore.setPoliticsRestrictedShowed();
}
</script>

<style lang="scss" src="./politics-restricted-modal.scss">
</style>
