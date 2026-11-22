<template>
  <div class="message-command" :class="classNames">
    <div class="message-command__header">
      <div class="message-command__title">
        <span class="message-command__symbol" aria-hidden="true">{{ kind === 'dice' ? '🎲' : '?' }}</span>
        <span>
          {{ t(kind === 'private-help' ? 'chat_commands.private_help_title' : `chat_commands.${kind}`) }}
        </span>
      </div>
      <template v-if="kind === 'private-help'">
        <button
          type="button"
          class="message-command__close"
          :aria-label="t('chat_commands.close_private_help')"
          @click="emit('close')"
        >
          <svg-icon name="close" aria-hidden="true" />
        </button>
      </template>
    </div>
    <template v-if="kind === 'dice'">
      <div class="message-command__body">{{ content }}</div>
    </template>
    <template v-else>
      <div class="message-command__body message-command__help">
        <component :is="part.tag" v-for="(part, index) in helpParts" :key="index">{{ part.text }}</component>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { computed } from 'vue';
import type {
  MessageCommandProps,
  MessageCommandEmits,
} from './index';

defineOptions({ name: 'BMessageCommand' });
const props = defineProps<MessageCommandProps>();
const emit = defineEmits<MessageCommandEmits>();
const { t } = useI18n();
const classNames = useBMC(() => ({ dice: props.kind === 'dice' }), 'message-command', { dice: flag('type', 'dice') });
const helpParts = computed(() => {
  // Match explicit formatting and the syntax used in previously saved help messages.
  const formatting = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\/(?:showhelp|roll|dice|help)\b(?:[ \t]+(?:\[[^\]\n]+\]|<[^>\n]+>|\d*d\d+|\/?(?:roll|dice|help|showhelp)\b))?|(?:Примеры?|Examples?):)/g;

  return props.content.split(formatting).map((text, index) => {
    if (index % 2 === 0) return { tag: 'span', text };
    if (text.startsWith('`')) return { tag: 'code', text: text.slice(1, -1) };
    if (text.startsWith('**')) return { tag: 'strong', text: text.slice(2, -2) };
    return { tag: text.startsWith('/') ? 'code' : 'strong', text };
  });
});
</script>

<style lang="scss" src="./message-command.scss">
</style>
