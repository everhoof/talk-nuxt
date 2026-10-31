<template>
  <nav v-if="selectedPoll" class="pinned-polls" :aria-label="$t('poll.pinned')" @wheel="onWheel">
    <b-pinned-polls-indicator :count="polls.length" :selected-index="selectedIndex" />
    <b-pinned-polls-summary :poll="selectedPoll.poll" @click="openPoll" />
    <div v-if="polls.length > 1" class="pinned-polls__controls">
      <button
        type="button"
        class="pinned-polls__arrow"
        :aria-label="$t('poll.previous')"
        @click="switchPoll(-1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
      </button>
      <span class="pinned-polls__counter">{{ selectedIndex + 1 }} / {{ polls.length }}</span>
      <button type="button" class="pinned-polls__arrow" :aria-label="$t('poll.next')" @click="switchPoll(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
      </button>
    </div>
  </nav>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import BPinnedPollsIndicator from '~/components/pinned-polls-indicator/pinned-polls-indicator.vue';
import BPinnedPollsSummary from '~/components/pinned-polls-summary/pinned-polls-summary.vue';
import { Message } from '~/types/message';

@Component({ name: 'b-pinned-polls', components: { BPinnedPollsIndicator, BPinnedPollsSummary } })
export default class PinnedPolls extends Vue {
  selectedId: number | null = null;
  lastWheelAt = 0;

  get polls(): Message[] {
    const serverNow = this.$accessor.now + this.$accessor.messages.pollServerTimeOffset;
    return this.$accessor.messages.activePolls.filter(
      ({ poll, deletedAt }) =>
        poll && !deletedAt && !poll.isClosed && (!poll.endsAt || Date.parse(poll.endsAt) > serverNow),
    );
  }

  get selectedIndex(): number {
    const index = this.polls.findIndex(({ id }) => id === this.selectedId);
    return index === -1 ? this.polls.length - 1 : index;
  }

  get selectedPoll(): Message | undefined {
    return this.polls[this.selectedIndex];
  }

  mounted(): void {
    this.$nuxt.$on('visible-polls-changed', this.onVisiblePollsChanged);
  }

  beforeDestroy(): void {
    this.$nuxt.$off('visible-polls-changed', this.onVisiblePollsChanged);
  }

  onVisiblePollsChanged(messageIds: number[]): void {
    const id = messageIds.find((messageId) => this.polls.some((poll) => poll.id === messageId));
    if (id !== undefined) this.selectedId = id;
  }

  onWheel(event: WheelEvent): void {
    if (this.polls.length < 2 || event.ctrlKey) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;

    event.preventDefault();
    const now = Date.now();
    if (now - this.lastWheelAt < 180) return;
    this.lastWheelAt = now;
    this.switchPoll(delta > 0 ? 1 : -1);
  }

  switchPoll(direction: number): void {
    const index = (this.selectedIndex + direction + this.polls.length) % this.polls.length;
    this.selectedId = this.polls[index]?.id ?? null;
  }

  openPoll(): void {
    if (this.selectedPoll) this.$nuxt.$emit('show-message', this.selectedPoll);
  }
}
</script>

<style lang="stylus" src="./pinned-polls.styl" />
