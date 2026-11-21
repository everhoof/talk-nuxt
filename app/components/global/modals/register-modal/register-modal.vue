<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      Регистрация
    </template>
    <template #default>
      <div class="register-modal">
        <b-form :errors="errors" name="register-form">
          <div class="form__row">
            <ui-text-field
              id="register_email"
              v-model="email"
              name="email"
              placeholder="E-mail"
              width-full
              @keydown.enter="usernameInput?.focus()"
            />
          </div>
          <div class="form__row">
            <ui-text-field
              id="register_username"
              ref="usernameInput"
              v-model="username"
              name="username"
              placeholder="Логин"
              width-full
              @keydown.enter="passwordInput?.focus()"
            />
          </div>
          <div class="form__row">
            <ui-text-field
              id="register_password"
              ref="passwordInput"
              v-model="password"
              name="password"
              placeholder="Пароль"
              width-full
              type="password"
            />
          </div>
          <div class="form__row">
            <ui-button large width-full @click.prevent="signUp()">Зарегистрироваться</ui-button>
          </div>
          <div class="form__row form__row_align_center">
            <router-link :to="{ name: 'modal_login' }">Уже есть аккаунт? Войти.</router-link>
          </div>
        </b-form>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { RegisterModalEmits } from './index';
import {
  ref,
  useTemplateRef,
} from 'vue';

defineOptions({ name: 'BRegisterModal' });

const authStore = useAuthStore();
const { t } = useI18n();

const emit = defineEmits<RegisterModalEmits>();

const usernameInput = useTemplateRef('usernameInput');

const passwordInput = useTemplateRef('passwordInput');

const errors = ref<string[]>([]);

const email = ref<string>('');

const username = ref<string>('');

const password = ref<string>('');

const patterns = ref({
  username: /^[a-zA-Z0-9\-_]+$/,
  email: /.{3,}@.+\..{2,}/i,
});

function clearErrors() {
  errors.value = [];
}

function validateForm() {
  clearErrors();
  const isEmailValid = validateEmail();
  const isUsernameValid = validateUsername();
  const isPasswordValid = validatePassword();
  return isUsernameValid && isEmailValid && isPasswordValid;
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

function validateUsername() {
  const isFilled = username.value.length !== 0;
  if (!isFilled) {
    errors.value.push(t('username_fill_error'));
    return false;
  }
  const isMatchesLength = username.value.length <= 32 && username.value.length >= 3;
  if (!isMatchesLength) {
    errors.value.push(t('username_length_error'));
    return false;
  }
  const isMatchesRegex = patterns.value.username.test(username.value);
  if (!isMatchesRegex) {
    errors.value.push(t('username_regex_error'));
    return false;
  }
  return true;
}

function validatePassword() {
  const isFilled = password.value.length !== 0;
  if (!isFilled) {
    errors.value.push(t('password_fill_error'));
    return false;
  }
  const isMatchesLength = password.value.length <= 255 && password.value.length >= 5;
  if (!isMatchesLength) {
    errors.value.push(t('passport_length_error'));
    return false;
  }
  return true;
}

async function signUp() {
  if (!validateForm()) return;
  const { errors: responseErrors } = await authStore.signUp({
    email: email.value,
    password: password.value,
    username: username.value,
  });
  if (responseErrors?.length) errors.value.push(responseErrors[0]!.message);
  else await emit('close');
}
</script>

<style lang="scss" src="./register-modal.scss">
</style>
