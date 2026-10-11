import Vue from 'vue';
import Router from 'vue-router';

import MainPage from '~/pages/main/main.vue';
import ConfirmationPage from '~/pages/confirmation/confirmation.vue';
import ResetPasswordPage from '~/pages/reset-password/reset-password.vue';
import OAuthDiscordPage from '~/pages/oauth/discord/discord.vue';

// Modals
import LoginModal from '~/components/modals/login-modal/login-modal.vue';
import RegisterModal from '~/components/modals/register-modal/register-modal.vue';
import ProfileModal from '~/components/modals/profile-modal/profile-modal.vue';
import RequestPasswordResetModal from '~/components/modals/request-password-reset-modal/request-password-reset-modal.vue';
import RequestEmailConfirmationModal from '~/components/modals/request-email-confirmation-modal/request-email-confirmation-modal.vue';
import EmailConfirmedModal from '~/components/modals/email-confirmed-modal/email-confirmed-modal.vue';
import PunishmentModal from '~/components/modals/punishment-modal/punishment-modal.vue';
import SettingsModal from '~/components/modals/settings-modal/settings-modal.vue';
import PollModal from '~/components/modals/poll-modal/poll-modal.vue';

Vue.use(Router);

export function createRouter() {
  return new Router({
    mode: 'history',
    routes: [
      {
        path: '/',
        name: 'main',
        component: MainPage,
        children: [
          { path: 'poll', name: 'modal_poll', component: PollModal },
          { path: 'poll/:id/edit', name: 'modal_poll_edit', component: PollModal },
          { path: 'login', name: 'modal_login', component: LoginModal },
          { path: 'register', name: 'modal_register', component: RegisterModal },
          { path: 'profile/:id', name: 'modal_profile', component: ProfileModal },
          {
            path: 'request_password_reset',
            name: 'modal_request_password_reset',
            component: RequestPasswordResetModal,
          },
          {
            path: 'request_email_confirmation',
            name: 'modal_request_email_confirmation',
            component: RequestEmailConfirmationModal,
          },
          {
            path: 'email_confirmed',
            name: 'modal_email_confirmed',
            component: EmailConfirmedModal,
          },
          {
            path: 'profile/:id/punish',
            name: 'modal_punishment',
            component: PunishmentModal,
          },
          {
            path: 'settings',
            name: 'modal_settings',
            component: SettingsModal,
          },
        ],
      },
      {
        path: '/confirm_email',
        name: 'confirm_email',
        component: ConfirmationPage,
      },
      {
        path: '/reset_password',
        name: 'reset_password',
        component: ResetPasswordPage,
      },
      {
        path: '/oauth/discord',
        name: 'oauth_discord',
        component: OAuthDiscordPage,
      },
      {
        path: '*',
        redirect: '/',
      },
    ],
  });
}
