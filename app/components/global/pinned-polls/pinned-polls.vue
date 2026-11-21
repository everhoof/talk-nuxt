<template>
  <template v-if="selectedPoll?.poll">
    <nav
      class="pinned-polls"
      :aria-label="t('poll.pinned')"
      @wheel="onWheel"
    >
      <b-pinned-polls-indicator :count="polls.length" :selected-index="selectedIndex" />
      <b-pinned-polls-summary :poll="selectedPoll.poll" @click="openPoll" />
      <template v-if="polls.length > 1">
        <div class="pinned-polls__controls">
          <button
            type="button"
            class="pinned-polls__arrow"
            :aria-label="t('poll.previous')"
            @click="switchPoll(-1)"
          >
            <svg-icon name="chevron_left" aria-hidden="true" />
          </button>
          <span class="pinned-polls__counter">{{ selectedIndex + 1 }} / {{ polls.length }}</span>
          <button
            type="button"
            class="pinned-polls__arrow"
            :aria-label="t('poll.next')"
            @click="switchPoll(1)"
          >
            <svg-icon name="chevron_right" aria-hidden="true" />
          </button>
        </div>
      </template>
    </nav>
  </template>
</template>

<script setup lang="ts">
const { t } = useI18n();
defineOptions({ name: 'BPinnedPolls' });
const messagesStore = useMessagesStore();
const uiStore = useUiStore();
const events = useChatEvents();
const selectedId = ref<number | null>(null);
let lastWheelAt = 0;
const polls = computed(() => {
  const serverNow = uiStore.now + messagesStore.pollServerTimeOffset;
  return messagesStore.activePolls.filter(({ poll, deletedAt }) =>
    poll && !deletedAt && !poll.isClosed && (!poll.endsAt || Date.parse(poll.endsAt) > serverNow));
});
const selectedIndex = computed(() => {
  const index = polls.value.findIndex(({ id }) => id === selectedId.value);
  return index === -1 ? polls.value.length - 1 : index;
});
const selectedPoll = computed(() => polls.value[selectedIndex.value]);
function onVisiblePollsChanged(messageIds: number[]) {
  const id = messageIds.find((messageId) => polls.value.some((poll) => poll.id === messageId));
  if (id !== undefined) selectedId.value = id;
}
function onWheel(event: WheelEvent) {
  if (polls.value.length < 2 || event.ctrlKey) return;
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (!delta) return;
  event.preventDefault();
  const now = Date.now();
  if (now - lastWheelAt < 180) return;
  lastWheelAt = now;
  switchPoll(delta > 0 ? 1 : -1);
}
function switchPoll(direction: number) {
  const index = (selectedIndex.value + direction + polls.value.length) % polls.value.length;
  selectedId.value = polls.value[index]?.id ?? null;
}
function openPoll() {
  if (selectedPoll.value) events.emit('show-message', selectedPoll.value);
}
onMounted(() => events.on('visible-polls-changed', onVisiblePollsChanged));
onBeforeUnmount(() => events.off('visible-polls-changed', onVisiblePollsChanged));
</script>

<style lang="scss" src="./pinned-polls.scss">
</style>
