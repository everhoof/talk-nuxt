<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      Подтверждение E-mail
    </template>
    <template #default>
      <div class="email-confirmed-modal">
        <div class="email-confirmed-modal__illustration">
          <img class="email-confirmed-modal__image" src="@/assets/icons/sent.svg" alt="" />
        </div>
        <div class="email-confirmed-modal__text">
          Ваш e-mail адрес подтверждён. Теперь вам доступен весь функционал чата.
        </div>
        <ui-button
          class="email-confirmed-modal__button"
          width-full
          large
          @click="$emit('close', $event)"
        >
          Закрыть
        </ui-button>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { EmailConfirmedModalEmits } from './index';

defineOptions({ name: 'BEmailConfirmedModal' });

defineEmits<EmailConfirmedModalEmits>();
</script>

<style lang="scss" src="./email-confirmed-modal.scss">
</style>
