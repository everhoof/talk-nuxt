<template>
  <!-- eslint-disable-next-line vue-a11y/no-static-element-interactions, vue-a11y/click-events-have-key-events -- Pointer and keyboard activation are delegated from child controls. -->
  <div
    v-touch:swipe.left="swipeLeft"
    v-touch:swipe.right="swipeRight"
    class="page__wrapper"
    @click="onMentionClick"
    @drop.prevent="onDrop"
    @dragenter.prevent
    @dragover.prevent
  >
    <template v-if="isSnowEnabled">
      <div class="page__snow">
        <b-snow />
      </div>
    </template>
    <div :class="mainClassNames">
      <slot />
      <aside
        class="scrollbar"
        :class="asideClassNames"
      >
        <b-aside-panel />
      </aside>
      <div
        class="page__aside-button page__aside-button_type_mobile"
        @click="asideMobileOpened = !asideMobileOpened"
        role="button"
        tabindex="0"
        @keydown.enter.prevent="asideMobileOpened = !asideMobileOpened"
        @keydown.space.prevent="asideMobileOpened = !asideMobileOpened"
      >
        <svg-icon name="menu" class="page__aside-icon" />
      </div>
      <div class="page__aside-footer">
        <button type="button" class="page__aside-menu" @click="setAsidePcOpened(!asidePcOpened)">
          <svg-icon name="menu_open" />
        </button>
        <template v-if="authStore.loggedIn">
          <b-aside-footer />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import {

  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import { ReminderTypes } from '~/types/reminderTypes';
import {
  getFaviconHref,
  preloadFavicons,
} from '~/tools/favicon';

const authStore = useAuthStore();
const chatStore = useChatStore();
await callOnce('chat-layout-data', () => chatStore.loadInitialData(), { mode: 'navigation' });
const messagesStore = useMessagesStore();
const settingsStore = useSettingsStore();
const modalsStore = useModalsStore();
const uiStore = useUiStore();
const modal = useModal();
const events = useChatEvents();
const route = useRoute();
const politicsModal = resolveComponent('BPoliticsRestrictedModal');
const asideMobileOpened = ref(false);
const asidePcOpened = computed(() => chatStore.asidePcOpened);
const mainClassNames = useBMC(() => ({ pcOpen: asidePcOpened.value, mobileOpen: asideMobileOpened.value }), 'page__main', {
  pcOpen: flag('state', 'pc-open'),
  mobileOpen: flag('state', 'mobile-open'),
});
const asideClassNames = useBMC(() => ({ mobileOpen: asideMobileOpened.value, pcOpen: asidePcOpened.value }), 'page__aside', {
  mobileOpen: flag('state', 'mobile-open'),
  pcOpen: flag('state', 'pc-open'),
});
const pageClassNames = useBMC(() => ({
  theme: settingsStore.isOBS ? 'dark' : settingsStore.theme,
  obs: settingsStore.isOBS,
  nightmareNight: !settingsStore.isOBS && settingsStore.nightmareNight,
  compact: !settingsStore.isOBS && settingsStore.compact,
}), 'page', {
  theme: true,
  obs: flag('style', 'obs'),
  nightmareNight: flag('theme', 'nightmare-night'),
  compact: flag('style', 'compact'),
});
const isSnowEnabled = computed(() => settingsStore.snow && route.query.style !== 'obs');
const messageSoundAudio = computed(() => {
  if (import.meta.server || settingsStore.messageSound === 'none') return;
  const audio = new Audio(`/message-sounds/${settingsStore.messageSound}.ogg`);
  audio.volume = 0.1;
  return audio;
});
useHead(() => ({
  link: [
    {
      key: 'favicon-png',
      rel: 'icon',
      type: 'image/png',
      href: getFaviconHref(messagesStore.unreadCount),
    },
  ],
  htmlAttrs: {
    class: pageClassNames.value,
  },
}));
watch(messageSoundAudio, (audio) => {
  void audio?.play().catch(() => { /* Playback can be blocked until the user interacts with the page. */ });
});
watch(
  () => messagesStore.unreadCount,
  (count, previous) => {
    if (import.meta.client && count > previous) {
      void messageSoundAudio.value?.play().catch(() => {
        // Browser autoplay policy may block playback.
      });
    }
  },
);
function updateReminder() {
  const user = authStore.user;
  if (!user || user.emailConfirmed) return;
  const reminder = modalsStore.reminders.find((entry) => {
    return entry.type === ReminderTypes.EMAIL_CONFIRMATION && entry.userId === user.id;
  });
  if (!reminder || (reminder.disabledAt !== null && Date.now() > reminder.disabledAt + reminder.timeout)) {
    modalsStore.addReminder(ReminderTypes.EMAIL_CONFIRMATION);
  }
}
watch(
  () => authStore.user,
  () => {
    if (import.meta.client) updateReminder();
  },
);
let clockTimer: ReturnType<typeof setInterval> | undefined;
onBeforeUnmount(() => clearInterval(clockTimer));
onMounted(() => {
  clockTimer = setInterval(() => {
    uiStore.now = Date.now();
  }, 1000);
  void preloadFavicons();
  updateReminder();
  if (route.query.style !== 'obs' && !modalsStore.politicsRestrictedShowed) modal.show(politicsModal);
});
function swipeLeft() {
  asideMobileOpened.value = true;
}
function swipeRight() {
  asideMobileOpened.value = false;
}
function setAsidePcOpened(value: boolean) {
  chatStore.setAsidePcOpened(value);
}
function onMentionClick(event: MouseEvent) {
  const mention = event.target instanceof Element ? event.target.closest<HTMLElement>('mention') : null;
  if (mention?.dataset.id) void navigateTo({ name: 'modal_profile', params: { id: mention.dataset.id } });
}
function onDrop(event: DragEvent) {
  events.emit('file-drag', event);
}
</script>

<style>
</style>
