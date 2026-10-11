<template>
  <div class="poll-results" aria-live="polite">
    <b-poll-result-item
      v-for="option in poll.options"
      :key="option.id"
      :option="option"
      :total-votes="poll.totalVotes"
      :selected="poll.selectedOptionIds.includes(option.id)"
      :is-anonymous="poll.isAnonymous"
      :voters="optionVoters(option.id)"
      :busy="busy"
      @voters="$emit('voters')"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BPollResultItem from '~/components/poll-result-item/poll-result-item.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({ name: 'b-poll-results', components: { BPollResultItem } })
export default class PollResults extends Vue {
  @Prop({ type: Boolean, default: false }) canViewVoters!: boolean;
  @Prop({ type: Boolean, default: false }) busy!: boolean;

  @Prop({ type: Object, required: true }) readonly poll!: PollPartsFragment;

  optionVoters(optionId: number): PollPartsFragment['voters'] {
    if (!this.canViewVoters) {
      return [];
    }

    const voters = this.poll.voters.filter((voter) => voter.optionIds.includes(optionId));

    return voters.sort((firstVoter, secondVoter) => {
      const firstVoteTime = this.voteTime(firstVoter);
      const secondVoteTime = this.voteTime(secondVoter);

      return firstVoteTime - secondVoteTime;
    });
  }

  voteTime(voter: PollPartsFragment['voters'][number]): number {
    if (!voter.votedAt) {
      return 0;
    }

    const timestamp = Date.parse(voter.votedAt);

    if (Number.isNaN(timestamp)) {
      return 0;
    }

    return timestamp;
  }
}
</script>

<style lang="stylus" src="./poll-results.styl" />
