<template>
  <!-- begin .emoji-panel-->
  <div class="emoji-panel">
    <div
      v-for="(item, i) in emoji"
      :key="i"
      class="emoji-panel__item"
      @click="selectEmoji($event, item.name)"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="selectEmoji($event, item.name)"
      @keydown.space.prevent="selectEmoji($event, item.name)"
    >
      <div class="emoji-panel__icon" :style="{ backgroundImage: `url(/emoji/${item.name}.${item.ext})` }" />
    </div>
  </div>
  <!-- end .emoji-panel-->
</template>

<script setup lang="ts">
import type { EmojiPanelEmits } from './index';
import { computed } from 'vue';

import type { Emoji } from '~/types/emoji';

defineOptions({ name: 'BEmojiPanel' });

const chatStore = useChatStore();
const uiStore = useUiStore();

const emit = defineEmits<EmojiPanelEmits>();

const emoji = computed((): Emoji[] => {
  if (Array.isArray(chatStore.emoji)) {
    return [...chatStore.emoji].toSorted((a, b) =>
      (a.name.toLowerCase() < b.name.toLowerCase() ? 1 : -1));
  }
  return chatStore.emoji || [];
});

function selectEmoji(event: MouseEvent | KeyboardEvent, name: string) {
  emit('insert', `:${name}:`);
  if (!event.shiftKey) uiStore.emojisPanelActive = false;
}
</script>

<style lang="scss" src="./emoji-panel.scss">
</style>
