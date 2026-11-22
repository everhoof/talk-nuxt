<template>
  <!-- begin .message-->
  <b-message-cm :message="message">
    <div :class="classNames">
      <b-user-avatar
        class="message__avatar"
        :username="username"
        :user-id="ownerId"
        :src="avatar"
      />
      <div class="message__content">
        <template v-if="compact">
          <span class="message__header">
            <time class="message__timestamp" :datetime="message.createdAt" :title="localDateTimeFull">
              {{ localDateTime }}
            </time>
            <template v-if="!system">
              <span
                class="message__author-name link_no_styles"
                :style="{ color: avatarColor }"
                @click="mention"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="mention"
                @keydown.space.prevent="mention"
              >
                {{ `${username}:` }}
              </span>
            </template>
          </span>
        </template>
        <template v-else>
          <span class="message__header">
            <template v-if="!system">
              <span
                class="message__author-name link_no_styles"
                :style="{ color: avatarColor }"
                @click="mention"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="mention"
                @keydown.space.prevent="mention"
              >
                {{ username }}
              </span>
            </template>
            <time class="message__timestamp" :datetime="message.createdAt" :title="localDateTimeFull">
              {{ localDateTime }}
            </time>
          </span>
        </template>
        <template v-if="message.type === 6">
          <b-message-poll :message="message" />
        </template>
        <template v-else-if="command">
          <b-message-command :kind="command" :content="commandText" />
        </template>
        <template v-else-if="system">
          <span class="message__text">
            <template v-if="message.type === 3">
              К нам присоединяется
              <span
                class="message__author-name link_no_styles"
                :style="{ color: avatarColor }"
                @click="mention"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="mention"
                @keydown.space.prevent="mention"
              >
                {{ username }}
              </span>
            </template>
            <template v-else-if="message.type === 4">
              <span
                class="message__author-name link_no_styles"
                :style="{ color: avatarColor }"
                @click="mention"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="mention"
                @keydown.space.prevent="mention"
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
        <template v-else>
          <span class="message__text" v-html="text" />
        </template>
        <b-message-img v-for="picture in pictures" :key="picture.o.id" :picture="picture" />
        <template v-if="youtubeId">
          <div class="message__embed">
            <iframe
              title="YouTube видео"
              :src="`https://www.youtube.com/embed/${youtubeId}`"
              allowfullscreen
              width="400"
              height="224"
            />
          </div>
        </template>
      </div>
    </div>
  </b-message-cm>
  <!-- end .message-->
</template>

<script setup lang="ts">
import type { MessageProps } from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { computed } from 'vue';

import { DateTime } from 'luxon';
import { toLocalDateTime } from '~/tools/filters';
import {
  decodePunycodeURL,
  getUserColor,
} from '~/tools/util';

import {
  MessageState,
  MessageType,
} from '~/types/message';

defineOptions({ name: 'BMessage' });

const authStore = useAuthStore();
const chatStore = useChatStore();
const messagesStore = useMessagesStore();
const settingsStore = useSettingsStore();

const props = defineProps<MessageProps>();

const classNames = useBMC(() => ({
  compact: compact.value,
  system: system.value,
  deleted: deleted.value,
  mentioning: mentioning.value,
  delivered: delivered.value,
}), 'message', {
  compact: flag('view', 'compact'),
  system: flag('type', 'system'),
  deleted: flag('type', 'deleted'),
  mentioning: flag('type', 'mentioning'),
  delivered: flag('state', undefined, 'not-delivered'),
});

const text = computed(() => {
  let message = props.message.content.replaceAll(
    /(https?:\/\/(www\.)?[-a-zA-Zа-яА-Я0-9@:%._+~#=]{1,256}\.[a-zA-Zа-яА-Я0-9()]{1,6}(\b|[\u{400}-\u{4FF}])([-a-zA-Zа-яА-Я0-9()@:%_+.~#?&/=]*))/gmu,
    (_match, p1) => {
      return `<a href="${p1}" target="_blank">${decodePunycodeURL(p1)}</a>`;
    },
  );
  const mentionRegex = /<@!(\d+):(.+?)>/gm;
  message = message.replaceAll(mentionRegex, (_match, p1, p2) => {
    return `<mention data-id="${p1}" data-name="${p2}">@${p2}</mention>`;
  });
  const emojiRegex = new RegExp(`:(${chatStore.emoji.map(({ name }) => name).join('|')}):`, 'mg');
  return message.replace(emojiRegex, (_match, p1) => {
    const emoji = chatStore.emoji.find((e) => e.name === p1);
    if (!emoji) {
      return p1;
    }
    return `<img src="/emoji/${emoji.name}.${emoji.ext}" class="message__emoji" title=":${emoji.name}:" width="70px" height="70px" />`;
  });
});

const youtubeId = computed((): string | null => {
  if (command.value) return null;
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const matches = regex.exec(props.message.content);
  return matches?.[1] ?? null;
});

const username = computed((): string => {
  return props.message.username || props.message?.owner?.username || '';
});

const ownerId = computed((): number => {
  return props.message?.owner?.id || 0;
});

const pictures = computed(() => {
  return props.message.pictures || [];
});

const timestamp = computed(() => {
  return props.message.createdAtMillis;
});

const compact = computed(() => {
  return settingsStore.compact;
});

const command = computed(() => {
  if (props.message.type === MessageType.DICE) return 'dice';
  if (props.message.type === MessageType.HELP) return 'help';
  return null;
});
const commandText = computed(() => (command.value === 'dice'
  ? props.message.content.replace(/^(\d+d\d+) → /, '$1: ')
  : props.message.content));
const system = computed(() => !command.value && ![MessageType.GENERAL, MessageType.POLL].includes(props.message.type));

const mentioning = computed((): boolean => {
  if (command.value) return false;
  const regexp = new RegExp(`<mention(.+?)data-id="${authStore.user?.id}"`);
  return regexp.test(text.value);
});

const delivered = computed((): boolean => {
  return props.message.state === MessageState.DELIVERED;
});

const avatar = computed(() => {
  return props.message?.owner?.avatar?.s.link;
});

const avatarColor = computed(() => {
  return getUserColor(props.message?.owner?.id);
});

const timezone = computed((): string => {
  return settingsStore.timeZone;
});

const localDateTime = computed((): string => {
  return toLocalDateTime(props.message.createdAt, timezone.value, compact.value);
});

const localDateTimeFull = computed((): string => {
  return DateTime.fromMillis(timestamp.value)
    .setZone(timezone.value)
    .toFormat('cccc, dd LLLL yyyy г., HH:mm');
});

const deleted = computed((): boolean => {
  return !!props.message.deletedAt;
});

function mention(): void {
  const id = ownerId.value;
  const displayUsername = username.value;
  if (!id || !displayUsername) {
    return;
  }
  messagesStore.mention({ id, username: displayUsername });
}
</script>

<style lang="scss" src="./message.scss">
</style>
