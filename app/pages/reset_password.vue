<template>
  <template v-if="error">
    <div class="page__error">
      <template v-if="error">
        <div class="page-error">
          <div class="page-error__illustration">
            <img class="page-error__image" src="@/assets/icons/warning.svg" alt="" />
          </div>
          <div class="page-error__text">
            {{ error }}
          </div>
          <router-link v-slot="{ href, navigate }" :to="{ name: 'main' }" custom>
            <ui-button
              tag="a"
              :href="href"
              large
              width-full
              @click="navigate"
            >
              Вернуться в чат
            </ui-button>
          </router-link>
        </div>
      </template>
    </div>
  </template>
  <template v-else>
    <div class="page__error">
      <b-form :errors="errors" name="login-form">
        <div class="form__row">
          <ui-text-field
            id="reset_password"
            v-model="password"
            name="username"
            placeholder="Новый пароль"
            width-full
            type="password"
            @keydown.enter="passwordInput?.focus()"
          />
        </div>
        <div class="form__row">
          <ui-text-field
            id="reset_password_confirm"
            ref="passwordInput"
            v-model="passwordConfirm"
            name="password"
            placeholder="Подтверждение пароля"
            width-full
            type="password"
            @keydown.enter="reset()"
          />
        </div>
        <div class="form__row">
          <ui-button large width-full @click.prevent="reset()">Восстановить пароль</ui-button>
        </div>
      </b-form>
    </div>
  </template>
</template>

<script setup lang="ts">
import {
  ref,
  useTemplateRef,
} from 'vue';

definePageMeta({ name: 'reset_password', layout: 'confirmation' });

const authStore = useAuthStore();
const { t } = useI18n();

const route = useRoute();

const router = useRouter();

const passwordInput = useTemplateRef('passwordInput');

const error = ref<string>(typeof route.query.code === 'string' ? '' : 'Произошла неизвестная ошибка');

const errors = ref<string[]>([]);

const password = ref<string>('');

const passwordConfirm = ref<string>('');

function clearErrors() {
  errors.value = [];
}

function validateForm() {
  clearErrors();
  return validatePassword();
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
  if (password.value !== passwordConfirm.value) {
    errors.value.push(t('passwords_do_not_match'));
    return false;
  }
  return true;
}

async function reset() {
  if (!validateForm()) return;
  const { errors: responseErrors } = await authStore.resetPassword({
    token: route.query.code as string,
    password: password.value,
  });
  if (responseErrors?.length) errors.value.push(responseErrors[0]!.message);
  else await router.replace({ name: 'main' });
}
</script>

<style>
</style>
