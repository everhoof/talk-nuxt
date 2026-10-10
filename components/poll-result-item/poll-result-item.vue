<template>
  <div
    class="poll-result-item"
    :class="{ 'poll-result-item_state_selected': selected }"
    :aria-label="selectedAnswerLabel"
  >
    <div class="poll-result-item__label">
      <span class="poll-result-item__answer">{{ option.label }}</span>
      <div class="poll-result-item__meta">
        <span v-if="isAnonymous" class="poll-vote-count">
          <span class="poll-vote-count__number">{{ voteCount }}</span>
          <span>{{ voteLabel }}</span>
        </span>
        <b-poll-voters-preview
          v-else-if="voters.length"
          :voters="voters"
          :label="$t('poll.option_voters', { label: option.label, count: option.votes })"
          :disabled="busy"
          @click="$emit('voters')"
        />
        <span class="poll-result-item__count">{{ percent }}%</span>
      </div>
    </div>
    <div class="poll-result-item__bar" aria-hidden="true">
      <div class="poll-result-item__fill" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BPollVotersPreview from '~/components/poll-voters-preview/poll-voters-preview.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({
  name: 'b-poll-result-item',
  components: { BPollVotersPreview },
})
export default class PollResultItem extends Vue {
  @Prop({ type: Boolean, default: false }) isAnonymous!: boolean;
  @Prop({ type: Array, default: () => [] }) voters!: PollPartsFragment['voters'];
  @Prop({ type: Boolean, default: false }) busy!: boolean;

  get voteCount(): number {
    return this.option.votes || 0;
  }

  get selectedAnswerLabel(): string | undefined {
    if (!this.selected) {
      return undefined;
    }

    const votedLabel = this.$t('poll.voted');

    return `${this.option.label}: ${votedLabel}, ${this.percent}%`;
  }

  get voteLabel(): string {
    const count = this.voteCount;

    if (this.$i18n.locale !== 'ru') {
      if (count === 1) {
        return 'vote';
      }

      return 'votes';
    }

    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return 'голос';
    }

    const endsInTwoToFour = lastDigit >= 2 && lastDigit <= 4;
    const endsInTeen = lastTwoDigits >= 12 && lastTwoDigits <= 14;

    if (endsInTwoToFour && !endsInTeen) {
      return 'голоса';
    }

    return 'голосов';
  }

  @Prop({
    type: Object,
    required: true,
  })
  readonly option!: PollPartsFragment['options'][number];

  @Prop({
    type: Number,
    default: null,
  })
  readonly totalVotes!: number | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly selected!: boolean;

  get percent(): number {
    if (!this.totalVotes) {
      return 0;
    }

    const percentage = (this.voteCount * 100) / this.totalVotes;

    return Math.round(percentage);
  }
}
</script>

<style lang="stylus" src="./poll-result-item.styl" />
