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
import {
  ref,
  onMounted,
} from 'vue';

import OAuthDiscord from '~/graphql/mutations/oauth-discord.graphql';
import type {
  OAuthDiscordMutation,
  OAuthDiscordMutationVariables,
} from '~/graphql/schema';

definePageMeta({ name: 'oauth_discord', layout: 'confirmation' });

const authStore = useAuthStore();
const { client: graphqlClient } = useGraphql();

const route = useRoute();

const router = useRouter();

const error = ref<string>('');

async function initialize() {
  if (!import.meta.client) return;
  const code = route.query.code;
  if (typeof code === 'string') {
    const client = graphqlClient;
    if (!client) return;
    try {
      const { data, errors } = await client.mutate<OAuthDiscordMutation, OAuthDiscordMutationVariables>({
        mutation: OAuthDiscord,
        variables: { code },
      });
      if (errors) {
        error.value = errors.length > 0 ? errors[0].message : 'Произошла неизвестная ошибка';
      } else if (data?.OAuthDiscord) {
        await authStore.loginHandler(data.OAuthDiscord);
        location.assign('/');
      } else {
        error.value = 'Произошла неизвестная ошибка';
      }
    } catch {
      error.value = 'Произошла неизвестная ошибка';
    }
  } else {
    await router.replace({ name: 'main' });
  }
}

onMounted(initialize);
</script>

<style lang="scss" src="./discord.scss">
</style>
