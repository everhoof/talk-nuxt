<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      Вход
    </template>
    <template #default>
      <div class="login-modal">
        <b-form :errors="errors" name="login-form">
          <template v-if="authStore.status === 'error'">
            <p role="alert">{{ t('session_check_error') }}</p>
            <ui-button type="button" @click="retrySession">{{ t('session_retry') }}</ui-button>
          </template>
          <div class="form__row">
            <ui-text-field
              id="login_username"
              v-model="username"
              name="username"
              placeholder="Логин"
              width-full
              @keydown.enter="passwordInput?.focus()"
            />
          </div>
          <div class="form__row">
            <ui-text-field
              id="login_password"
              ref="passwordInput"
              v-model="password"
              name="password"
              placeholder="Пароль"
              width-full
              type="password"
            />
          </div>
          <div class="form__row">
            <div class="login-modal__buttons">
              <ui-button
                class="login-modal__button"
                large
                width-full
                @click.prevent="signIn()"
              >
                Войти
              </ui-button>
              <template v-if="discordOAuthLink">
                <a
                  aria-label="Войти через Discord"
                  :href="discordOAuthLink"
                  class="login-modal__button login-modal__button_type_discord"
                >
                  <svg-icon name="discord" />
                </a>
              </template>
            </div>
          </div>
          <div class="form__row form__row_align_center">
            <router-link :to="{ name: 'modal_request_password_reset' }">Восстановить пароль</router-link>
          </div>
          <div class="form__row form__row_align_center">
            <router-link :to="{ name: 'modal_register' }">Нет аккаунта</router-link>
          </div>
        </b-form>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { LoginModalEmits } from './index';
import {
  ref,
  computed,
  useTemplateRef,
} from 'vue';

defineOptions({ name: 'BLoginModal' });

const { $config } = useNuxtApp();
const authStore = useAuthStore();
const { t } = useI18n();

const emit = defineEmits<LoginModalEmits>();

const passwordInput = useTemplateRef('passwordInput');

const errors = ref<string[]>([]);

const username = ref<string>('');

const password = ref<string>('');

const discordOAuthLink = computed((): string => {
  return $config.public.discordOAuthLink || '';
});

function clearErrors() {
  errors.value = [];
}

function validateForm() {
  clearErrors();
  const isUsernameValid = validateUsername();
  const isPasswordValid = validatePassword();
  return isUsernameValid && isPasswordValid;
}

function validateUsername() {
  const isFilled = username.value.length !== 0;
  if (!isFilled) {
    errors.value.push(t('username_fill_error'));
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
  return true;
}

async function retrySession() {
  await authStore.initialize();
  if (authStore.loggedIn) emit('close', new Event('session-resolved'));
}

async function signIn() {
  if (!validateForm()) return;
  const { errors: responseErrors } = await authStore.signIn({
    email: username.value,
    password: password.value,
  });
  if (responseErrors?.length) errors.value.push(responseErrors[0]!.message);
  else await emit('close');
}
</script>

<style lang="scss" src="./login-modal.scss">
</style>
