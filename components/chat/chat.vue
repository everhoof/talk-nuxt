<template>
  <!-- begin .chat-->
  <div ref="scroll" class="chat scrollbar" @scroll="onScroll">
    <!-- <b-upload-file /> -->
    <transition name="fade">
      <div v-show="loading" class="chat__loader">
        <img class="icon" src="~/assets/icons/spinner.svg" alt="" />
      </div>
    </transition>
    <transition name="fade">
      <div v-show="!loading" ref="messageList" class="chat__messages">
        <template v-if="fetchMore === 'older'">
          <div class="chat__messages-loader">
            <img class="icon" src="~/assets/icons/spinner.svg" alt="" />
          </div>
        </template>
        <div
          v-for="i in messages.length"
          :key="messages[messages.length - i].randomId"
          class="chat__message"
          :class="{ chat__message_highlighted: messages[messages.length - i].id === highlightedMessageId }"
          :data-message-id="messages[messages.length - i].id"
        >
          <template v-if="separators.includes(messages[messages.length - i].id)">
            <b-messages-separator :message="messages[messages.length - i]" />
          </template>
          <template v-if="messages[messages.length - i].type === 5">
            <b-message-donation :message="messages[messages.length - i]" />
          </template>
          <template v-else>
            <b-message :message="messages[messages.length - i]" />
          </template>
        </div>
        <template v-if="fetchMore === 'newer'">
          <div class="chat__messages-loader">
            <img class="icon" src="~/assets/icons/spinner.svg" alt="" />
          </div>
        </template>
      </div>
    </transition>
    <button v-if="browsingHistory" type="button" class="chat__return" @click="forceScroll">
      {{ $t('poll.back_to_latest') }}
      <svg-icon name="chevron_down" class="chat__return-icon" aria-hidden="true" />
    </button>
  </div>
  <!-- end .chat-->
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import BUploadFile from '~/components/upload-file/upload-file.vue';
import BMessage from '~/components/message/message.vue';
import BMessagesSeparator from '~/components/messages-separator/messages-separator.vue';
import BMessageDonation from '~/components/message-donation/message-donation.vue';
import { Message } from '~/types/message';
import type { FetchDirection } from '~/store/messages';

declare const ResizeObserver: new (callback: () => void) => {
  observe(target: Element): void;
  disconnect(): void;
};

@Component({
  name: 'b-chat',
  components: { BMessageDonation, BMessagesSeparator, BMessage, BUploadFile },
})
export default class Chat extends Vue {
  @Ref('scroll') scroll?: HTMLDivElement;
  @Ref() messageList!: HTMLDivElement;

  resizeObserver: InstanceType<typeof ResizeObserver> | null = null;
  messageListHeight = 0;
  stickToBottom = true;
  navigating = false;
  highlightedMessageId: number | null = null;
  highlightTimer: ReturnType<typeof setTimeout> | null = null;
  pollSyncFrame: number | null = null;

  loading = true;
  fetchMore: FetchDirection = 'none';
  playTimestamp: number = 0;

  @Watch('messages')
  async onMessagesChange(): Promise<void> {
    if (!this.scroll || this.navigating) return;
    const offsetBottom = this.scroll.scrollHeight - this.scroll.clientHeight - this.scroll.scrollTop;

    if (offsetBottom < 200) {
      await this.$nextTick();
      this.scrollDownChat();
    }
  }

  get timeZone(): string {
    return this.$accessor.settings.timeZone;
  }

  get separators(): number[] {
    const separators: number[] = [];

    for (let i = 1; i < this.messages.length; ++i) {
      const message = this.messages[i];
      const prevMessage = this.messages[i - 1];

      const date = DateTime.fromISO(message.createdAt).setZone(this.timeZone).toISODate();
      const prevDate = DateTime.fromISO(prevMessage.createdAt).setZone(this.timeZone).toISODate();

      if (date !== prevDate) {
        separators.push(prevMessage.id);
      }
    }

    return separators;
  }

  get messages(): Message[] {
    if (this.loading) return [];

    let messages = this.$accessor.messages.messages.filter(
      (m) => this.$accessor.auth.can.readAny('deleted-message').granted || !m.deletedAt,
    );

    if (this.$accessor.settings.isPlay) {
      messages = messages.filter((m) => DateTime.fromISO(m.createdAt).toMillis() <= this.playTimestamp);
    }

    return messages;
  }

  get browsingHistory(): boolean {
    return !this.$accessor.settings.isPlay && this.$accessor.messages.isEverythingFetched !== 'newer';
  }

  async mounted(): Promise<void> {
    this.loading = false;

    await this.$nextTick();
    window.setTimeout(this.scrollDownChat, 50);
    this.resizeObserver = new ResizeObserver(() => {
      this.messageListHeight = this.messageList.offsetHeight;
      if (this.stickToBottom) this.scrollDownChat();
      this.scheduleVisiblePollSync();
    });
    this.resizeObserver.observe(this.messageList);

    if (this.$accessor.settings.isPlay) {
      const datetime = DateTime.fromISO(this.$route.query.from?.toString() ?? '');

      if (datetime.isValid) {
        this.playTimestamp = datetime.toMillis();

        const offset = Date.now() - this.playTimestamp;

        setInterval(() => {
          this.playTimestamp = Date.now() - offset;
          this.fetchNewMessagesOnPlay();
        }, 500);

        setInterval(() => {
          this.scrollDownChat();
        }, 50);
      }
    }

    this.$nuxt.$on('force-scroll', this.forceScroll);
    this.$nuxt.$on('show-message', this.showMessage);
    this.$nuxt.$on('start-message-edit', this.onMessagesChange);
  }

  async fetchNewMessagesOnPlay(): Promise<void> {
    if (this.$accessor.messages.isEverythingFetched === 'newer') {
      return;
    }

    const lastMessage = this.$accessor.messages.messages[0];
    const filteredLastMessage = this.messages[0];

    if (lastMessage && filteredLastMessage && lastMessage.id === filteredLastMessage.id) {
      const variables = {
        count: 100,
        reverse: false,
        lastId: lastMessage.id,
      };

      const messages = await this.$accessor.messages.fetchMessages(variables);

      if (messages) {
        if (messages.length === 0) {
          this.$accessor.messages.SET_IS_EVERYTHING_FETCHED('newer');
        } else {
          this.$accessor.messages.pushMessages({
            variables,
            messages,
          });

          this.$accessor.messages.CLEAR_MESSAGES('from-end');
        }
      }
    }
  }

  beforeDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.pollSyncFrame !== null) window.cancelAnimationFrame(this.pollSyncFrame);
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.$nuxt.$off('force-scroll', this.forceScroll);
    this.$nuxt.$off('show-message', this.showMessage);
    this.$nuxt.$off('start-message-edit', this.onMessagesChange);
  }

  async showMessage(message: Message): Promise<void> {
    if (!this.scroll || this.navigating || this.fetchMore !== 'none') return;

    this.navigating = true;
    this.stickToBottom = false;
    try {
      if (!this.messages.some(({ id }) => id === message.id)) {
        const [older, newer] = await Promise.all([
          this.$accessor.messages.fetchMessages({
            count: 50,
            fromDateTime: message.createdAt,
            reverse: true,
          }),
          this.$accessor.messages.fetchMessages({
            count: 50,
            fromDateTime: message.createdAt,
            reverse: false,
          }),
        ]);
        if (!older || !newer) return;

        const messages = new Map([...older, ...newer].map((item) => [item.id, new Message(item)]));
        messages.set(message.id, message);
        this.$accessor.messages.SET_IS_EVERYTHING_FETCHED('none');
        this.$accessor.messages.SET_RAW_MESSAGES(Array.from(messages.values()));
      }

      this.highlightedMessageId = message.id;
      await this.$nextTick();
      const target = this.messageList.querySelector<HTMLElement>(`[data-message-id="${message.id}"]`);
      if (target) {
        this.scroll.scrollTop +=
          target.getBoundingClientRect().top - this.scroll.getBoundingClientRect().top - 16;
      }
      if (this.highlightTimer) clearTimeout(this.highlightTimer);
      this.highlightTimer = setTimeout(() => (this.highlightedMessageId = null), 3000);
    } finally {
      this.navigating = false;
    }
  }

  async forceScroll(): Promise<void> {
    if (this.navigating) return;
    this.highlightedMessageId = null;
    if (this.$accessor.messages.isEverythingFetched !== 'newer') {
      const variables = {
        count: 100,
        reverse: true,
      };

      const messages = await this.$accessor.messages.fetchMessages(variables);

      if (messages) {
        this.$accessor.messages.SET_RAW_MESSAGES(messages.map((message) => new Message(message)));
        this.$accessor.messages.SET_IS_EVERYTHING_FETCHED('newer');
        await this.$nextTick();
        this.scrollDownChat();
      }
    } else {
      await this.$nextTick();
      this.scrollDownChat();
    }
  }

  scrollDownChat(): void {
    this.stickToBottom = true;
    if (this.scroll) {
      this.scroll.scrollTop = this.scroll.scrollHeight;
    }
  }

  scheduleVisiblePollSync(): void {
    if (this.pollSyncFrame !== null) return;
    this.pollSyncFrame = window.requestAnimationFrame(() => {
      this.pollSyncFrame = null;
      this.syncVisiblePolls();
    });
  }

  syncVisiblePolls(): void {
    if (!this.scroll || this.navigating || this.$accessor.settings.isPlay || this.$accessor.settings.isOBS)
      return;

    const viewport = this.scroll.getBoundingClientRect();
    const visible: { id: number; top: number }[] = [];
    this.messageList.querySelectorAll<HTMLElement>('.message-poll').forEach((poll) => {
      const bounds = poll.getBoundingClientRect();
      if (!bounds.height || bounds.bottom <= viewport.top || bounds.top >= viewport.bottom) return;

      const message = poll.closest<HTMLElement>('[data-message-id]');
      if (message) {
        visible.push({
          id: Number(message.dataset.messageId),
          top: bounds.top,
        });
      }
    });

    visible.sort((a, b) => b.top - a.top);
    this.$nuxt.$emit(
      'visible-polls-changed',
      visible.map(({ id }) => id),
    );
  }

  async onScroll(event: Event): Promise<void> {
    this.scheduleVisiblePollSync();
    if (this.$accessor.settings.isPlay || this.navigating || this.fetchMore !== 'none') {
      return;
    }

    const target = event.target as HTMLElement;

    const offsetTop = target.scrollTop;
    const offsetBottom = target.scrollHeight - target.clientHeight - target.scrollTop;
    // A card can grow before ResizeObserver runs; that scroll event is not a user scrolling up.
    if (this.messageList.offsetHeight === this.messageListHeight) {
      this.stickToBottom = offsetBottom < 200;
    }

    if (offsetTop < 100) {
      this.fetchMore = 'older';
    } else if (offsetBottom < 100) {
      this.fetchMore = 'newer';
    } else {
      return;
    }

    if (this.$accessor.messages.isEverythingFetched === this.fetchMore) {
      this.fetchMore = 'none';
      return;
    }

    const variables = {
      count: 100,
      reverse: true,
      lastId: this.messages[this.messages.length - 1]?.id,
    };

    if (this.fetchMore === 'newer') {
      variables.reverse = false;
      variables.lastId = this.messages[0]?.id;
    }

    const messages = await this.$accessor.messages.fetchMessages(variables);

    const oldScrollTop = target.scrollTop;
    const oldScroll = target.scrollHeight - target.clientHeight;

    if (messages) {
      if (messages.length === 0) {
        this.$accessor.messages.SET_IS_EVERYTHING_FETCHED(this.fetchMore);
      } else {
        this.$accessor.messages.SET_IS_EVERYTHING_FETCHED('none');
      }

      this.$accessor.messages.pushMessages({
        variables,
        messages,
      });

      await this.$nextTick();

      if (variables.reverse) {
        const newScroll = target.scrollHeight - target.clientHeight;
        target.scrollTop = oldScrollTop + (newScroll - oldScroll);
      }
    }

    this.fetchMore = 'none';

    await this.$nextTick();

    if (!variables.reverse) {
      target.scrollTop = oldScrollTop;
    }

    if (variables.reverse) {
      this.$accessor.messages.CLEAR_MESSAGES('from-start');
    } else {
      this.$accessor.messages.CLEAR_MESSAGES('from-end');
    }
  }
}
</script>

<style lang="stylus" src="./chat.styl" />
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
