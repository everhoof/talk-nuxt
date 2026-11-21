import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const now = ref(Date.now());
  const emojisPanelActive = ref(false);
  const attachPanelActive = ref(false);

  function toggleEmojiPanel() {
    emojisPanelActive.value = !emojisPanelActive.value;
  }
  function toggleAttachPanel() {
    attachPanelActive.value = !attachPanelActive.value;
  }

  return {
    now,
    emojisPanelActive,
    attachPanelActive,
    toggleEmojiPanel,
    toggleAttachPanel,
  };
});
