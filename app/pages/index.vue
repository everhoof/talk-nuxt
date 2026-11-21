<template>
  <div class="page__chat">
    <!-- eslint-disable vue/no-constant-condition -- Keep this existing feature disabled. -->
    <template v-if="false">
      <div class="page__warning">
        <b-warning />
      </div>
    </template>
    <template v-if="remind">
      <div class="page__reminder">
        <b-reminder :id="reminderId" @click="confirmEmail()">
          <template #default>
            {{ t('reminders.confirm_email.message') }}
          </template>
          <template #button>
            {{ t('reminders.confirm_email.action') }}
          </template>
        </b-reminder>
      </div>
    </template>
    <template v-if="!settingsStore.isPlay && !settingsStore.isOBS">
      <b-pinned-polls />
    </template>
    <div class="page__conversation">
      <template v-if="settingsStore.nightmareNight && !settingsStore.isOBS">
        <b-nightmare-night />
      </template>
      <b-chat />
    </div>
    <nuxt-page />
    <div class="page__footer">
      <b-footer />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
} from 'vue';

import { ReminderTypes } from '~/types/reminderTypes';
import RequestEmailConfirmation from '~/graphql/mutations/request-email-confirmation.graphql';

definePageMeta({ name: 'main' });

const { t } = useI18n();

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { client: graphqlClient } = useGraphql();

const router = useRouter();
const messagesStore = useMessagesStore();
const chatStore = useChatStore();
const modalsStore = useModalsStore();
await callOnce('chat-data', async () => {
  await messagesStore.loadInitialData();
}, { mode: 'navigation' });
onBeforeUnmount(() => {
  chatStore.stopLiveUpdates();
  messagesStore.stopLiveUpdates();
});
onMounted(() => {
  chatStore.startLiveUpdates();
  messagesStore.startLiveUpdates();
  settingsStore.detectTimeZone();
  modalsStore.restorePreferences();
});

const remind = computed(() => !!authStore.user && !authStore.user.emailConfirmed);

const reminderId = computed((): ReminderTypes => {
  return ReminderTypes.EMAIL_CONFIRMATION;
});

async function confirmEmail() {
  const { errors } = await graphqlClient.mutate({
    mutation: RequestEmailConfirmation,
  });
  if (errors) return;
  await router.push({ name: 'modal_request_email_confirmation' });
}
</script>

<style lang="scss" src="./index.scss">
</style>
