<template>
  <button type="button" class="pinned-polls-summary" :title="poll.question" @click="$emit('click', $event)">
    <svg-icon name="poll" class="pinned-polls-summary__icon" aria-hidden="true" />
    <span class="pinned-polls-summary__text">
      <span class="pinned-polls-summary__label">{{ $t('poll.pinned') }}</span>
      <span class="pinned-polls-summary__details" aria-live="polite">
        <span class="pinned-polls-summary__question">{{ poll.question }}</span>
        <time v-if="endTime" class="pinned-polls-summary__deadline" :datetime="poll.endsAt">
          {{ $t('poll.ends_at', { time: endTime }) }}
        </time>
      </span>
    </span>
  </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import { PollPartsFragment } from '~/graphql/schema';

@Component({ name: 'b-pinned-polls-summary' })
export default class PinnedPollsSummary extends Vue {
  @Prop({ type: Object, required: true }) readonly poll!: PollPartsFragment;

  get endTime(): string {
    if (!this.poll.endsAt) return '';

    return DateTime.fromISO(this.poll.endsAt)
      .setLocale(this.$i18n.locale)
      .toLocaleString(DateTime.DATETIME_SHORT);
  }
}
</script>

<style lang="stylus" src="./pinned-polls-summary.styl" />
