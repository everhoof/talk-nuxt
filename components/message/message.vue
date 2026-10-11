<template>
  <!-- begin .message-->
  <div
    class="message"
    :class="{
      message_view_compact: compact,
      message_type_system: system,
      message_type_deleted: deleted,
      message_type_mentioning: mentioning,
      'message_state_not-delivered': !delivered,
    }"
    @contextmenu="openContextMenu"
  >
    <b-user-avatar class="message__avatar" :username="username" :user-id="ownerId" :src="avatar" />
    <div class="message__content">
      <span v-if="compact" class="message__header">
        <time class="message__timestamp" :datetime="message.createdAt" :title="localDateTimeFull">
          {{ localDateTime }}
        </time>
        <span
          v-if="!system"
          class="message__author-name link_no_styles"
          :style="{ color: avatarColor }"
          @click="mention"
        >
          {{ username + ':' }}
        </span>
      </span>
      <span v-else class="message__header">
        <span
          v-if="!system"
          class="message__author-name link_no_styles"
          :style="{ color: avatarColor }"
          @click="mention"
        >
          {{ username }}
        </span>
        <time class="message__timestamp" :datetime="message.createdAt" :title="localDateTimeFull">
          {{ localDateTime }}
        </time>
      </span>
      <b-message-poll v-if="message.type === 6" :message="message" />
      <template v-else-if="system">
        <span class="message__text">
          <template v-if="message.type === 3">
            К нам присоединяется
            <span
              class="message__author-name link_no_styles"
              :style="{ color: avatarColor }"
              @click="mention"
            >
              {{ username }}
            </span>
          </template>
          <template v-else-if="message.type === 4">
            <span
              class="message__author-name link_no_styles"
              :style="{ color: avatarColor }"
              @click="mention"
            >
              {{ username }}
            </span>
            выходит из чата
          </template>
          <template v-else>
            <span v-html="text" />
          </template>
        </span>
      </template>
      <span v-else class="message__text" v-html="text" />
      <b-message-img v-for="picture in pictures" :key="picture.id" :picture="picture" />
      <div v-if="youtubeId" class="message__embed">
        <iframe
          :src="`https://www.youtube.com/embed/${youtubeId}`"
          allowfullscreen="allowfullscreen"
          width="400"
          height="224"
        ></iframe>
      </div>
    </div>
  </div>
  <!-- end .message-->
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import { toLocalDateTime } from '~/tools/filters';
import { decodePunycodeURL, getUserColor } from '~/tools/util';
import BContextMenu from '~/components/context-menu/context-menu.vue';
import BMessageImg from '~/components/message-img/message-img.vue';
import { Message, MessageState, MessageType } from '~/types/message';
import BMessagePoll from '~/components/message-poll/message-poll.vue';
import BUserAvatar from '~/components/user-avatar/user-avatar.vue';

@Component({
  name: 'b-message',
  components: { BMessageImg, BMessagePoll, BUserAvatar },
})
export default class BMessage extends Vue {
  @InjectReactive('message-context-menu')
  readonly contextMenu!: BContextMenu;

  @Prop({
    required: true,
    type: Object,
    default: () => {},
  })
  readonly message!: Message;

  get text() {
    let message = this.message.content.replace(
      /(https?:\/\/(www\.)?[-a-zA-Zа-яА-Я0-9@:%._+~#=]{1,256}\.[a-zA-Zа-яА-Я0-9()]{1,6}(\b|[\u0400-\u04FF])([-a-zA-Zа-яА-Я0-9()@:%_+.~#?&/=]*))/gm,
      (_match, p1) => {
        return `<a href="${p1}" target="_blank">${decodePunycodeURL(p1)}</a>`;
      },
    );

    const mentionRegex = /<@!(\d+):(.+?)>/gm;

    message = message.replace(mentionRegex, (_match, p1, p2) => {
      return `<mention data-id="${p1}" data-name="${p2}">@${p2}</mention>`;
    });

    const emojiRegex = new RegExp(`:(${this.$accessor.chat.emoji.map(({ name }) => name).join('|')}):`, 'mg');

    return message.replace(emojiRegex, (_match, p1) => {
      const emoji = this.$accessor.chat.emoji.find((e) => e.name === p1);

      if (!emoji) {
        return p1;
      }

      return `<img src="/emoji/${emoji.name}.${emoji.ext}" class="message__emoji" title=":${emoji.name}:" width="70px" height="70px" />`;
    });
  }

  get youtubeId(): string | null {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const matches = this.message.content.match(regex);

    return matches?.[1] ?? null;
  }

  get username(): string {
    return this.message.username || this.message?.owner?.username || '';
  }

  get ownerId(): number {
    return this.message?.owner?.id || 0;
  }

  get pictures() {
    return this.message.pictures || [];
  }

  get timestamp() {
    return this.message.createdAtMillis;
  }

  get compact() {
    return this.$accessor.settings.compact;
  }

  get system() {
    return ![MessageType.GENERAL, MessageType.POLL].includes(this.message.type);
  }

  get mentioning(): boolean {
    const regexp = new RegExp(`<mention(.+?)data-id="${this.$accessor.auth.user?.id}"`);

    return regexp.test(this.text);
  }

  get delivered(): boolean {
    return this.message.state === MessageState.DELIVERED;
  }

  get avatar() {
    return this.message?.owner?.avatar?.s.link;
  }

  get avatarColor() {
    return getUserColor(this.message?.owner?.id);
  }

  get timezone(): string {
    return this.$accessor.settings.timeZone;
  }

  get localDateTime(): string {
    return toLocalDateTime(this.message.createdAt, this.timezone, this.compact);
  }

  get localDateTimeFull(): string {
    return DateTime.fromMillis(this.timestamp)
      .setZone(this.timezone)
      .toFormat('cccc, dd LLLL yyyy г., HH:mm');
  }

  get deleted(): boolean {
    return !!this.message.deletedAt;
  }

  openContextMenu(event: MouseEvent) {
    if (
      this.$accessor.auth.can.deleteAny('message') ||
      (this.$accessor.auth.can.deleteOwn('message') && this.message.id === this.$accessor.auth.user?.id)
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.contextMenu.open(event, { message: this.message });
    }
  }

  mention(): void {
    const id = this.ownerId;
    const username = this.username;

    if (!id || !username) {
      return;
    }

    this.$accessor.messages.mention({ id, username });
  }
}
</script>

<style lang="stylus" src="./message.styl" />
