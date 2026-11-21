<template>
  <div class="message-command" :class="{ 'message-command_type_dice': kind === 'dice' }">
    <div class="message-command__header">
      <div class="message-command__title">
        <span class="message-command__symbol" aria-hidden="true">{{ kind === 'dice' ? '🎲' : '?' }}</span>
        <span>
          {{ $t(kind === 'private-help' ? 'chat_commands.private_help_title' : `chat_commands.${kind}`) }}
        </span>
      </div>
      <button
        v-if="kind === 'private-help'"
        type="button"
        class="message-command__close"
        :aria-label="$t('chat_commands.close_private_help')"
        @click="$emit('close')"
      >
        <svg-icon name="close" aria-hidden="true" />
      </button>
    </div>
    <div v-if="kind === 'dice'" class="message-command__body">{{ content }}</div>
    <div v-else class="message-command__body message-command__help">
      <component :is="part.tag" v-for="(part, index) in helpParts" :key="index">{{ part.text }}</component>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import type { MessageCommandProps } from './index';

@Component({ name: 'b-message-command' })
export default class MessageCommand extends Vue implements MessageCommandProps {
  @Prop({ type: String, required: true }) readonly kind!: MessageCommandProps['kind'];
  @Prop({ type: String, required: true }) readonly content!: string;

  get helpParts() {
    // Match explicit formatting and the syntax used in previously saved help messages.
    const formatting = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\/(?:showhelp|roll|dice|help)\b(?:[ \t]+(?:\[[^\]\n]+\]|<[^>\n]+>|\d*d\d+|\/?(?:roll|dice|help|showhelp)\b))?|(?:Примеры?|Examples?):)/g;

    return this.content.split(formatting).map((text, index) => {
      if (index % 2 === 0) return { tag: 'span', text };
      if (text.startsWith('`')) return { tag: 'code', text: text.slice(1, -1) };
      if (text.startsWith('**')) return { tag: 'strong', text: text.slice(2, -2) };
      return { tag: text.startsWith('/') ? 'code' : 'strong', text };
    });
  }
}
</script>

<style lang="stylus" src="./message-command.styl" />
