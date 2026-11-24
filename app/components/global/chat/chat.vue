<template>
  <div class="chat__container">
    <div class="chat__viewport">
      <div ref="scroll" class="chat scrollbar" :aria-label="t('chat.messages')">
        <div ref="messageList" class="chat__messages" :style="{ height: `${virtualizer.getTotalSize()}px` }">
          <div
            v-for="{ item, row } in virtualRows"
            :key="row.key"
            :ref="measureElement"
            :class="messageClassNames({ highlighted: row.message.id === highlightedMessageId })"
            :data-index="item.index"
            :data-message-id="row.message.id"
            :style="{ transform: `translateY(${item.start}px)` }"
          >
            <template v-if="row.separator">
              <b-messages-separator :message="row.message" />
            </template>
            <template v-if="row.message.type === 5">
              <b-message-donation :message="row.message" />
            </template>
            <template v-else>
              <b-message :message="row.message" />
            </template>
          </div>
        </div>
      </div>
      <div
        v-for="direction in directions"
        v-show="history.loading[direction] || history.errors[direction]"
        :key="direction"
        :class="statusClassNames({ direction })"
        role="status"
      >
        <template v-if="history.errors[direction]">
          {{ t('chat.load_error') }}
          <button type="button" @click="history.load(direction)">{{ t('chat.retry') }}</button>
        </template>
        <template v-else>
          {{ t('chat.loading') }}
        </template>
      </div>
      <template v-if="showJumpToLatest">
        <button
          type="button"
          class="chat__jump"
          :disabled="history.loadingLatest.value"
          @click="jumpToLatest"
        >
          {{ t(history.loadingLatest.value ? 'chat.loading' : 'chat.jump_to_latest') }}
          <template v-if="messagesStore.unreadCount">
            <span>
              · {{ t('chat.new_messages', { count: messagesStore.unreadCount }) }}
            </span>
          </template>
          <svg-icon name="chevron_down" class="chat__jump-icon" aria-hidden="true" />
        </button>
      </template>
      <template v-if="history.errors.latest">
        <div class="chat__status chat__status_direction_newer" role="alert">
          {{ t('chat.load_error') }}
          <button type="button" @click="jumpToLatest">{{ t('chat.retry') }}</button>
        </div>
      </template>
    </div>
    <div class="chat__private-help" role="status">
      <template v-if="privateHelp && !settingsStore.isOBS && !settingsStore.isPlay">
        <b-message-command kind="private-help" :content="privateHelp" @close="clearPrivateHelp" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  bmc,
  flag,
} from '@rhapsodic/bem-classnames-vue';
import {

  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
  nextTick,
} from 'vue';
import type { ComponentPublicInstance } from 'vue';
import {
  elementScroll,
  useVirtualizer,
} from '@tanstack/vue-virtual';
import type { VirtualizerOptions } from '@tanstack/vue-virtual';
import { DateTime } from 'luxon';
import type { FetchDirection } from '~/stores/messages';
import {
  type Message,
  MessageState,
} from '~/types/message';

const messageClassNames = bmc('chat__message', { highlighted: flag('state', 'highlighted') });
const statusClassNames = bmc('chat__status', { direction: true });

const { t } = useI18n();

defineOptions({ name: 'BChat' });

const authStore = useAuthStore();
const messagesStore = useMessagesStore();
const settingsStore = useSettingsStore();
const events = useChatEvents();
const route = useRoute();
const scroll = useTemplateRef<HTMLDivElement>('scroll');
const messageList = useTemplateRef<HTMLDivElement>('messageList');
const history = useChatHistory();
const directions: FetchDirection[] = ['older', 'newer'];
const mounted = ref(false);
const privateHelp = ref('');
const atEnd = ref(true);
const navigating = ref(false);
const highlightedMessageId = ref<number | null>(null);
const replayStart = DateTime.fromISO(route.query.from?.toString() ?? '').toMillis();
const playTimestamp = ref(Number.isFinite(replayStart) ? replayStart : Date.now());
let isInitialized = false;
let prefetchFrame = 0;
let replayTimer: ReturnType<typeof setInterval> | undefined;
let highlightTimer: ReturnType<typeof setTimeout> | undefined;
let pollSyncFrame = 0;

const messages = computed(() => {
  const canReadDeleted = authStore.can.readAny('deleted-message').granted;
  return messagesStore.messages
    .filter((message) => canReadDeleted || !message.deletedAt)
    .filter((message) => !settingsStore.isPlay || message.createdAtMillis <= playTimestamp.value)
    .toReversed();
});

const rows = computed(() => {
  let previousDate: string | null = null;
  return messages.value.map((message, index) => {
    const date = message.state === MessageState.SENT
      ? previousDate
      : DateTime.fromISO(message.createdAt).setZone(settingsStore.timeZone)
          .toISODate();
    const isSeparator = index > 0 && date !== previousDate;
    previousDate = date;
    return { message, separator: isSeparator, key: message.randomId || message.id };
  });
});

const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>(computed(() => {
  // Each options update captures its own keys so prepend anchoring can compare old/new lists.
  const current = rows.value;
  return {
    count: current.length,
    getScrollElement: () => scroll.value,
    scrollToFn: (...args: Parameters<VirtualizerOptions<HTMLDivElement, HTMLDivElement>['scrollToFn']>) => {
      // Vue batches the sizer render. Grow it before TanStack writes an anchor correction,
      // otherwise the browser clamps a prepend's new offset to the previous scroll height.
      if (messageList.value) messageList.value.style.height = `${args[2].getTotalSize()}px`;
      elementScroll(...args);
    },
    getItemKey: (index: number) => current[index].key,
    estimateSize: (index: number) => {
      const message = current[index].message;
      if (message.type === 6) return 320;
      if (message.pictures.length) return 320;
      if (message.type === 5) return 80;
      return settingsStore.compact ? 32 : 64;
    },
    enabled: mounted.value,
    anchorTo: 'end' as const,
    followOnAppend: !navigating.value && (settingsStore.isPlay || !history.loading.newer),
    scrollEndThreshold: 80,
    overscan: 8,
    paddingEnd: 0,
    onChange: () => {
      if (!isInitialized) return;
      atEnd.value = virtualizer.value.isAtEnd();
      schedulePrefetch();
      scheduleVisiblePollSync();
    },
  };
}));

const virtualRows = computed(() =>
  virtualizer.value.getVirtualItems().map((item) => ({ item, row: rows.value[item.index] })));
// Keep the visible row anchored when content above it changes, including after
// scrolling upward. The default policy skips remeasurement in that direction.
virtualizer.value.shouldAdjustScrollPositionOnItemSizeChange = (item, _delta, instance) => {
  const offset = instance.scrollOffset ?? 0;
  return instance.itemSizeCache.has(item.key) ? item.end <= offset : item.start < offset;
};
const showJumpToLatest = computed(() =>
  !settingsStore.isOBS
  && !settingsStore.isPlay
  && (!atEnd.value || messagesStore.hasNewerMessages));

function measureElement(element: Element | ComponentPublicInstance | null) {
  virtualizer.value.measureElement(element instanceof HTMLDivElement ? element : null);
}

function schedulePrefetch() {
  if (prefetchFrame || !isInitialized || navigating.value || settingsStore.isPlay) return;
  prefetchFrame = requestAnimationFrame(() => {
    prefetchFrame = 0;
    if (navigating.value) return;
    const viewport = scroll.value;
    if (!viewport) return;
    const distance = Math.max(viewport.clientHeight, 400);
    if ((virtualizer.value.scrollOffset ?? 0) < distance && !history.errors.older) {
      void history.load('older');
    }
    if (virtualizer.value.getDistanceFromEnd() < distance && !history.errors.newer) {
      void history.load('newer');
    }
  });
}

async function scrollToLatest(behavior: 'auto' | 'smooth') {
  if (navigating.value) return;
  highlightedMessageId.value = null;
  if (messagesStore.hasNewerMessages && !(await history.loadLatest())) return;
  await nextTick();
  virtualizer.value.scrollToEnd({ behavior });
}

function forceScroll() {
  return scrollToLatest('auto');
}

function jumpToLatest() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return scrollToLatest(reducedMotion ? 'auto' : 'smooth');
}

async function showMessage(message: Message) {
  if (navigating.value || settingsStore.isPlay || settingsStore.isOBS) return;
  navigating.value = true;
  try {
    if (messages.value.every(({ id }) => id !== message.id) && !(await history.loadAround(message))) return;
    highlightedMessageId.value = message.id;
    await nextTick();
    const index = rows.value.findIndex((row) => row.message.id === message.id);
    if (index !== -1) virtualizer.value.scrollToIndex(index, { align: 'start' });
    clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => (highlightedMessageId.value = null), 3000);
  } finally {
    navigating.value = false;
    scheduleVisiblePollSync();
  }
}

function scheduleVisiblePollSync() {
  if (pollSyncFrame || !isInitialized || settingsStore.isPlay || settingsStore.isOBS) return;
  pollSyncFrame = requestAnimationFrame(() => {
    pollSyncFrame = 0;
    if (!scroll.value || navigating.value) return;
    const viewport = scroll.value.getBoundingClientRect();
    const visible: { id: number; top: number }[] = [];
    messageList.value?.querySelectorAll<HTMLElement>('.message-poll').forEach((poll) => {
      const bounds = poll.getBoundingClientRect();
      if (!bounds.height || bounds.bottom <= viewport.top || bounds.top >= viewport.bottom) return;
      const message = poll.closest<HTMLElement>('[data-message-id]');
      if (message) visible.push({ id: Number(message.dataset.messageId), top: bounds.top });
    });
    events.emit(
      'visible-polls-changed',
      visible.toSorted((a, b) => b.top - a.top).map(({ id }) => id),
    );
  });
}

function onStartMessageEdit() {
  if (atEnd.value) void nextTick(() => virtualizer.value.scrollToEnd());
}

watch(
  [atEnd, () => messagesStore.hasNewerMessages],
  ([end, hasNewer]) => messagesStore.setAtLatest(end && !hasNewer),
  { immediate: true },
);

function clearPrivateHelp() {
  privateHelp.value = '';
}

async function showPrivateHelp(content: string) {
  privateHelp.value = content;
  await nextTick();
  virtualizer.value.scrollToEnd();
}

watch(() => authStore.sessionVersion, clearPrivateHelp);

onMounted(async () => {
  mounted.value = true;
  await nextTick();
  virtualizer.value.scrollToEnd();
  isInitialized = true;
  schedulePrefetch();
  scheduleVisiblePollSync();
  events.on('force-scroll', forceScroll);
  events.on('private-chat-help', showPrivateHelp);
  events.on('show-message', showMessage);
  events.on('start-message-edit', onStartMessageEdit);
  if (settingsStore.isPlay) {
    const offset = Date.now() - playTimestamp.value;
    replayTimer = setInterval(() => {
      playTimestamp.value = Date.now() - offset;
      const lastLoaded = messagesStore.messages.find(({ state }) => state === MessageState.DELIVERED);
      if (!lastLoaded || lastLoaded.createdAtMillis <= playTimestamp.value) void history.load('newer');
    }, 500);
  }
});

onBeforeUnmount(() => {
  isInitialized = false;
  messagesStore.setAtLatest(false);
  cancelAnimationFrame(prefetchFrame);
  cancelAnimationFrame(pollSyncFrame);
  clearInterval(replayTimer);
  clearTimeout(highlightTimer);
  events.off('force-scroll', forceScroll);
  events.off('private-chat-help', showPrivateHelp);
  events.off('show-message', showMessage);
  events.off('start-message-edit', onStartMessageEdit);
});
</script>

<style lang="scss" src="./chat.scss">
</style>
