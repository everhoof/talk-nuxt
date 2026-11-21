<template>
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

<script setup lang="ts">
import ConfirmEmail from '~/graphql/mutations/confirm-email.graphql';
import type {
  ConfirmEmailMutation,
  ConfirmEmailMutationVariables,
} from '~/graphql/schema';

const { client: graphqlClient } = useGraphql();
const auth = useAuthStore();

definePageMeta({ name: 'confirm_email', layout: 'confirmation' });
const route = useRoute();

const token = route.query.code;
if (typeof token !== 'string') await navigateTo({ name: 'main' });
const { data: result } = await useAsyncData(`confirm-email:${token}`, async () => {
  if (typeof token !== 'string') return { error: '' };
  try {
    const { data, errors } = await graphqlClient.mutate<ConfirmEmailMutation, ConfirmEmailMutationVariables>({
      mutation: ConfirmEmail,
      variables: { token },
    });
    if (errors?.length) return { error: errors[0].message };
    if (data?.confirmEmail) {
      // Confirming another account must not replace the current session.
      if (auth.loggedIn && auth.userId === data.confirmEmail.ownerId) await auth.initialize();
      return { error: '', confirmed: true };
    }
  } catch {
    /* Show the confirmation error below. */
  }
  return { error: 'Произошла неизвестная ошибка' };
});
const error = computed(() => result.value?.error || '');
if (result.value?.confirmed) await navigateTo({ name: 'modal_email_confirmed', replace: true });
</script>

<style>
</style>
