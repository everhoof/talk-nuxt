<template>
  <!-- begin .footer-->
  <div class="footer">
    <template v-if="uploading">
      <div class="footer__progress-bar">
        <ui-progress-bar :progress="uploadProgress" />
      </div>
    </template>
    <div v-show="emojisPanelActive" ref="emojiPanel" class="footer__emoji-panel scrollbar">
      <b-emoji-panel @insert="insertEmoji" />
    </div>
    <div v-show="attachPanelActive" ref="attachPanel" class="footer__attach-panel">
      <b-attach-panel />
    </div>
    <ui-button v-show="!loggedIn" class="button_size_compact" :to="{ name: 'modal_login' }">
      Войти в чат
    </ui-button>
    <template v-if="editing">
      <div class="footer__message-editor">
        <b-edited-message-preview :content="editing.content" @cancel="cancelEdit" />
      </div>
    </template>
    <template v-if="error">
      <div class="footer__message-editor" role="alert">
        <b-form-error :errors="[error]" width-full />
        <ui-button small :disabled="sending || uploading" @click="retry">{{ t('chat.retry_send') }}</ui-button>
      </div>
    </template>
    <div v-show="loggedIn" class="footer__input-field">
      <div class="footer__actions-left">
        <div
          ref="emoji"
          class="footer__emoji-button"
          :class="emojiActionClassNames"
          @click="uiStore.toggleEmojiPanel()"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="uiStore.toggleEmojiPanel()"
          @keydown.space.prevent="uiStore.toggleEmojiPanel()"
          aria-label="Эмодзи"
        />
        <svg-icon
          ref="attach"
          name="attach_file"
          class="footer__attach-button"
          :class="attachActionClassNames"
          @click="choosePicture"
        />
        <template v-if="canCreatePoll">
          <button
            type="button"
            class="footer__actions-button footer__poll-button"
            :aria-label="t('poll.create')"
            :title="t('poll.create')"
            @click="$router.push({ name: 'modal_poll' })"
          >
            <svg-icon name="poll" />
          </button>
        </template>
      </div>
      <div class="footer__input-container">
        <b-rich-input
          ref="richInput"
          class="footer__input"
          placeholder="Введите сообщение"
          :model-value="draft.html"
          :capture-escape="Boolean(editing)"
          @change="updateDraft"
          @keydown="onKeydown"
          @paste="onPaste"
          @enter="send"
          @escape="cancelEdit"
        />
      </div>
      <div v-show="loggedIn" class="footer__actions-right">
        <b-donate-button class="footer__donate-button" />
        <button
          type="button"
          class="footer__actions-button footer__send-button"
          :disabled="sending || uploading"
          aria-label="Отправить сообщение"
          @click="send"
        >
          <svg-icon name="paper_plane" />
        </button>
      </div>
    </div>
  </div>
  <!-- end .footer-->
</template>

<script setup lang="ts">
import type { FooterEmits } from './index';
import type { RichInputHandle } from '~/components/global/rich-input';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import {

  computed,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
} from 'vue';

const { t } = useI18n();
defineOptions({ name: 'BFooter' });
defineEmits<FooterEmits>();

const authStore = useAuthStore();
const uiStore = useUiStore();
const richInput = useTemplateRef<RichInputHandle>('richInput');
const {
  draft, editing, sending, uploading, uploadProgress, error,
  updateDraft, cancelEdit, send, retry, onKeydown, onPaste, choosePicture,
} = useMessageComposer(richInput);
const emoji = useTemplateRef<HTMLDivElement>('emoji');
const emojiPanel = useTemplateRef<HTMLDivElement>('emojiPanel');
const attach = useTemplateRef<{ $el: SVGSVGElement }>('attach');
const attachPanel = useTemplateRef<HTMLDivElement>('attachPanel');
const loggedIn = computed(() => authStore.loggedIn);
const canCreatePoll = computed(() => loggedIn.value && authStore.can.createOwn('poll').granted);
const emojisPanelActive = computed(() => uiStore.emojisPanelActive);
const attachPanelActive = computed(() => uiStore.attachPanelActive);
const emojiActionClassNames = useBMC(() => ({ active: emojisPanelActive.value }), 'footer__actions-button', { active: flag('type', 'active') });
const attachActionClassNames = useBMC(() => ({ active: attachPanelActive.value }), 'footer__actions-button', { active: flag('type', 'active') });

function insertEmoji(content: string) {
  richInput.value?.insertContent(content);
}

function onDocumentClick(event: MouseEvent) {
  if (!emoji.value?.contains(event.target as Node) && !emojiPanel.value?.contains(event.target as Node)) {
    uiStore.emojisPanelActive = false;
  }
  if (!attach.value?.$el.contains(event.target as Node) && !attachPanel.value?.contains(event.target as Node)) {
    uiStore.attachPanelActive = false;
  }
}

onMounted(() => document.body.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.body.removeEventListener('click', onDocumentClick));
</script>

<style lang="scss" src="./footer.scss">
</style>
