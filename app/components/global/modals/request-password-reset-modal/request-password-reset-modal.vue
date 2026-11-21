<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      Восстановление пароля
    </template>
    <template #default>
      <template v-if="!requested">
        <div class="request-password-reset-modal">
          <b-form :errors="errors" name="request-password-reset-form">
            <div class="form__row">
              <ui-text-field
                id="password_reset_email"
                v-model="email"
                name="email"
                placeholder="E-mail"
                width-full
                @keydown.enter="reset()"
              />
            </div>
            <div class="form__row">
              <ui-button large width-full @click.prevent="reset()">Восстановить</ui-button>
            </div>
          </b-form>
        </div>
      </template>
      <template v-else>
        <div class="request-password-reset-modal">
          <div class="request-password-reset-modal__illustration">
            <img class="request-password-reset-modal__image" src="@/assets/icons/sent.svg" alt="" />
          </div>
          <div class="request-password-reset-modal__text">
            Письмо для восстановления пароля будет отправлено, если пользователь с таким E-mail зарегистрирован
          </div>
          <template v-if="domain">
            <ui-button
              :href="`https://${domain}`"
              target="_blank"
              rel="noopener noreferrer"
              tag="a"
              width-full
              large
            >
              Перейти в почтовый ящик
            </ui-button>
          </template>
        </div>
      </template>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { RequestPasswordResetModalEmits } from './index';
import {
  ref,
  computed,
} from 'vue';

defineOptions({ name: 'BRequestPasswordResetModal' });

const authStore = useAuthStore();
const { t } = useI18n();

defineEmits<RequestPasswordResetModalEmits>();

const errors = ref<string[]>([]);

const email = ref<string>('');

const patterns = ref({
  email: /.{3,}@.+\..{2,}/i,
});

const requested = ref<boolean>(false);

const domain = computed((): string => {
  if (email.value) {
    const split = email.value.split('@');
    return (split?.[1]) || '';
  }
  return '';
});

function clearErrors() {
  errors.value = [];
}

function validateForm() {
  clearErrors();
  return validateEmail();
}

function validateEmail() {
  const isFilled = email.value.length !== 0;
  if (!isFilled) {
    errors.value.push(t('email_fill_error'));
    return false;
  }
  const isMatchesLength = email.value.length <= 191;
  if (!isMatchesLength) {
    errors.value.push(t('email_length_error'));
    return false;
  }
  const isMatchesRegex = patterns.value.email.test(email.value);
  if (!isMatchesRegex) {
    errors.value.push(t('email_regex_error'));
    return false;
  }
  return true;
}

async function reset() {
  if (!validateForm()) return;
  requested.value = await authStore.requestPasswordReset({
    email: email.value,
  });
}
</script>

<style lang="scss" src="./request-password-reset-modal.scss">
</style>
