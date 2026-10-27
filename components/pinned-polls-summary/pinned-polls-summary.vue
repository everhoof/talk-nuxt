<template>
  <button type="button" class="pinned-polls-summary" :title="questionText" @click="$emit('click', $event)">
    <svg-icon name="poll" class="pinned-polls-summary__icon" aria-hidden="true" />
    <span class="pinned-polls-summary__text">
      <span class="pinned-polls-summary__label">{{ $t('poll.pinned') }}</span>
      <span class="pinned-polls-summary__details" aria-live="polite">
        <b-formatted-poll-text class="pinned-polls-summary__question" :content="poll.question" />
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
import BFormattedPollText from '~/components/formatted-poll-text/formatted-poll-text.vue';
import { pollText } from '~/tools/poll-formatting';

@Component({ name: 'b-pinned-polls-summary', components: { BFormattedPollText } })
export default class PinnedPollsSummary extends Vue {
  @Prop({ type: Object, required: true }) readonly poll!: PollPartsFragment;

  get questionText(): string {
    return pollText(this.poll.question);
  }

  get endTime(): string {
    if (!this.poll.endsAt) return '';

    return DateTime.fromISO(this.poll.endsAt)
      .setLocale(this.$i18n.locale)
      .toLocaleString(DateTime.DATETIME_SHORT);
  }
}
</script>

<style lang="stylus" src="./pinned-polls-summary.styl" />
