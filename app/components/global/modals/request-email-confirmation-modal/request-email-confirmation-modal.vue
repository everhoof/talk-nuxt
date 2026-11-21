<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      Подтверждение E-mail
    </template>
    <template #default>
      <div class="request-email-confirmation-modal">
        <div class="request-email-confirmation-modal__illustration">
          <img class="request-email-confirmation-modal__image" src="@/assets/icons/sent.svg" alt="" />
        </div>
        <div class="request-email-confirmation-modal__text">
          Письмо было отправлено на адрес, указанный при регистрации.
        </div>
        <template v-if="domain">
          <ui-button
            :href="`https://${domain}`"
            tag="a"
            target="_blank"
            rel="noopener noreferrer"
            width-full
            large
          >
            Перейти в почтовый ящик
          </ui-button>
        </template>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { RequestEmailConfirmationModalEmits } from './index';
import { computed } from 'vue';

defineOptions({ name: 'BRequestEmailConfirmationModal' });

const authStore = useAuthStore();

defineEmits<RequestEmailConfirmationModalEmits>();

const domain = computed((): string => {
  if (authStore.user?.email) {
    const split = authStore.user?.email.split('@');
    return (split?.[1]) || '';
  }
  return '';
});
</script>

<style lang="scss" src="./request-email-confirmation-modal.scss">
</style>
