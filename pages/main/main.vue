<template>
  <div class="page__chat">
    <b-nightmare-night v-if="$accessor.settings.nightmareNight && !$accessor.settings.isOBS" />
    <div v-if="false" class="page__warning">
      <b-warning />
    </div>
    <div v-if="remind" class="page__reminder">
      <b-reminder :id="reminderId" @click="confirmEmail()">
        <template #default>{{ $t('reminders.confirm_email.message') }}</template>
        <template #button>{{ $t('reminders.confirm_email.action') }}</template>
      </b-reminder>
    </div>
    <b-chat />
    <div class="page__footer">
      <b-footer />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import BChat from '~/components/chat/chat.vue';
import BFooter from '~/components/footer/footer.vue';
import BReminder from '~/components/reminder/reminder.vue';
import { ReminderTypes } from '~/types/reminderTypes';
import RequestEmailConfirmation from '~/graphql/mutations/request-email-confirmation.graphql';
import BWarning from '~/components/warning/warning.vue';
import BNightmareNight from '~/components/nightmare-night/nightmare-night.vue';

@Component({
  components: { BNightmareNight, BWarning, BReminder, BFooter, BChat },
})
export default class MainPage extends Vue {
  remind: boolean = false;

  get reminderId(): string {
    return ReminderTypes.EMAIL_CONFIRMATION;
  }

  mounted() {
    if (!this.$accessor.auth.user || this.$accessor.auth.user.emailConfirmed) this.remind = false;
    if (!this.$accessor.auth.user?.emailConfirmed) this.remind = true;
  }

  async confirmEmail() {
    const { errors } = await this.$apolloProvider.defaultClient.mutate({
      mutation: RequestEmailConfirmation,
    });
    if (errors) return;
    await this.$router.push({ name: 'modal_request_email_confirmation' });
  }
}
</script>

<style lang="stylus" src="./main.styl"></style>
