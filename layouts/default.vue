<template>
  <div
    v-touch:swipe.left="swipeLeft"
    v-touch:swipe.right="swipeRight"
    class="page__wrapper"
    @contextmenu="openContextMenu"
    @drop.prevent="onDrop"
    @dragenter.prevent
    @dragover.prevent
  >
    <div v-if="isSnowEnabled" class="page__snow">
      <b-snow />
    </div>
    <client-only>
      <vue-snotify />
    </client-only>
    <div
      class="page__main"
      :class="{
        'page__main_state_pc-open': asidePcOpened,
        'page__main_state_mobile-open': asideMobileOpened,
      }"
    >
      <nuxt />
      <aside
        class="page__aside scrollbar"
        :class="{
          'page__aside_state_mobile-open': asideMobileOpened,
          'page__aside_state_pc-open': asidePcOpened,
        }"
      >
        <b-aside-panel />
      </aside>
      <div
        class="page__aside-button page__aside-button_type_mobile"
        @click="asideMobileOpened = !asideMobileOpened"
      >
        <svg-icon name="menu" class="page__aside-icon" />
      </div>
      <div class="page__aside-footer">
        <button class="page__aside-menu" @click="setAsidePcOpened(!asidePcOpened)">
          <svg-icon name="menu_open" />
        </button>
        <b-aside-footer v-if="$accessor.auth.loggedIn" />
      </div>
    </div>
    <b-message-cm ref="message-cm" />
    <b-user-cm ref="user-cm" />
    <b-context-menu ref="context-menu" />
  </div>
</template>

<script lang="ts">
import '~/assets/stylus/normalize.styl';
import '~/assets/stylus/grid.styl';
import '~/assets/stylus/global.styl';
import '~/assets/stylus/colors.styl';
import 'vue-snotify/styles/material.css';
import { Component, ProvideReactive, Vue, Watch } from 'nuxt-property-decorator';
import { VueConstructor } from 'vue';
import { Route } from 'vue-router';
import BAsidePanel from '~/components/aside-panel/aside-panel.vue';
import BModal from '~/components/modals/modal/modal.vue';
import BButton from '~/components/button/button.vue';
import BAsideFooter from '~/components/aside-footer/aside-footer.vue';
import BContextMenu from '~/components/context-menu/context-menu.vue';
import BContextMenuItem from '~/components/context-menu-item/context-menu-item.vue';
import { ReminderTypes } from '~/types/reminderTypes';
import BMessageCm from '~/components/context-menus/message-cm/message-cm.vue';
import BUserCm from '~/components/context-menus/user-cm/user-cm.vue';
import PoliticsRestrictedModal from '~/components/modals/politics-restricted-modal/politics-restricted-modal.vue';
import BSnow from '~/components/snow/snow.vue';
import { getFaviconHref, preloadFavicons } from '~/tools/favicon';

@Component({
  head() {
    const classes: string[] = [];

    if (this.$accessor.settings.isOBS) {
      classes.push('page_style_obs');
      classes.push('page_theme_dark');
    } else {
      classes.push('page_theme_' + this.$accessor.settings.theme);
      if (this.$accessor.settings.nightmareNight) {
        classes.push('page_theme_nightmare-night');
      }
      if (this.$accessor.settings.compact) {
        classes.push('page_style_compact');
      }
    }

    return {
      link: [
        {
          hid: 'favicon-png',
          rel: 'icon',
          type: 'image/png',
          href: getFaviconHref(this.$accessor.messages.unreadCount),
        },
      ],
      htmlAttrs: {
        class: classes,
      },
    };
  },
  components: {
    BSnow,
    BUserCm,
    BMessageCm,
    BContextMenuItem,
    BContextMenu,
    BAsideFooter,
    BButton,
    BModal,
    BAsidePanel,
  },
})
export default class Default extends Vue {
  @ProvideReactive('context-menu') contextMenu: BContextMenu | null = null;
  @ProvideReactive('user-context-menu') userContextMenu: BContextMenu | null = null;
  @ProvideReactive('message-context-menu') messageContextMenu: BContextMenu | null = null;
  asideMobileOpened: boolean = false;

  pageTitle: string = '';
  pageTitleInterval: number | null = null;
  pageTitleTimeout: number | null = null;

  get messageSoundAudio(): HTMLAudioElement | undefined {
    const soundId = this.$accessor.settings.messageSound;

    if (process.client && soundId !== 'none') {
      const audio = new Audio(`/message-sounds/${soundId}.ogg`);
      audio.volume = 0.1;
      return audio;
    }

    return undefined;
  }

  get isSnowEnabled(): boolean {
    return this.$accessor.settings.snow && this.$route.query.style !== 'obs';
  }

  @Watch('messageSoundAudio')
  onMessageSoundAudioChange(): void {
    this.messageSoundAudio?.play();
  }

  handleSnotifyError(message: string) {
    this.$snotify.error(message);
  }

  created(): void {
    this.onRouteChanged();

    if (process.client) {
      this.$nuxt.$on('snotify-error', this.handleSnotifyError);
    }

    if (
      process.client &&
      this.$route.query.style !== 'obs' &&
      !this.$accessor.modals.politicsRestrictedShowed
    ) {
      this.$modal.show(
        PoliticsRestrictedModal,
        {},
        {
          width: '100%',
          height: 'auto',
        },
      );
    }
  }

  mounted(): void {
    this.onUserChanged();
    this.contextMenu = this.$refs['context-menu'] as BContextMenu;
    this.userContextMenu = (this.$refs['user-cm'] as BUserCm).contextMenu ?? null;
    this.messageContextMenu = (this.$refs['message-cm'] as BMessageCm).contextMenu ?? null;

    this.pageTitle = document.title;
    preloadFavicons().then(() => this.$meta().refresh());
  }

  beforeDestroy() {
    if (process.client) {
      this.$nuxt.$off('snotify-error', this.handleSnotifyError);
    }
  }

  @Watch('$accessor.messages.unreadCount')
  onUnreadCountChanged() {
    if (process.client) {
      this.$meta().refresh();

      if (this.pageTitleInterval !== null) {
        window.clearInterval(this.pageTitleInterval);
      }
      if (this.pageTitleTimeout !== null) {
        window.clearTimeout(this.pageTitleTimeout);
      }
      if (this.$accessor.messages.unreadCount === 0) {
        document.title = this.pageTitle;
        return;
      }

      this.messageSoundAudio?.play();

      this.pageTitleInterval = window.setInterval(() => {
        document.title = 'Новое сообщение';
        this.pageTitleTimeout = window.setTimeout(() => {
          document.title = this.pageTitle;
        }, 1000);
      }, 2000);
    }
  }

  @Watch('$accessor.auth.user')
  onUserChanged() {
    if (!process.client) return;
    const user = this.$accessor.auth.user;
    if (!user) return;
    if (user?.emailConfirmed === false) {
      const reminder = this.$accessor.modals.reminders.find(
        (reminder) => reminder.type === ReminderTypes.EMAIL_CONFIRMATION,
      );
      if (
        (reminder &&
          reminder.disabledAt !== null &&
          reminder.userId === user.id &&
          Date.now() > reminder.disabledAt + reminder.timeout) ||
        !reminder
      ) {
        this.$accessor.modals.addReminder(ReminderTypes.EMAIL_CONFIRMATION);
      }
    }
  }

  @Watch('$route')
  onRouteChanged(newRoute?: Route, oldRoute?: Route) {
    if (!newRoute || !oldRoute || newRoute.name !== oldRoute.name) {
      if (!this.$route?.name || !/^modal_.*/.test(this.$route?.name)) return;
      const components = this.$router.getMatchedComponents();
      const component = components.find((c) => (c as any).options.name.includes('modal'));
      if (component) this.openModal(component);
    }
  }

  openModal(component: unknown) {
    if (process.client) {
      this.$modal.show(
        component as VueConstructor,
        {},
        {
          width: '100%',
          height: 'auto',
        },
        {
          'before-close': (event: any) => {
            if (event?.params?.route) return;
            this.$router.push({ name: 'main' });
          },
        },
      );
    }
  }

  get asidePcOpened(): boolean {
    return this.$accessor.chat.asidePcOpened;
  }

  swipeLeft() {
    this.asideMobileOpened = true;
  }

  swipeRight() {
    this.asideMobileOpened = false;
  }

  setAsidePcOpened(value: boolean) {
    this.$accessor.chat.SET_ASIDE_PC_OPENED(value);
    this.$cookies.set('aside_pc_opened', value.toString(), {
      path: '/',
      sameSite: 'lax',
      maxAge: 86400 * 365 * 10,
    });
  }

  openContextMenu() {
    this.$nuxt.$emit('close-context-menus');
  }

  onDrop(event: DragEvent) {
    this.$nuxt.$emit('file-drag', event);
  }
}
</script>
