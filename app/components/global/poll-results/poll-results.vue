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

<script setup lang="ts">
import type {
  PollResultsProps,
  PollResultsEmits,
} from './index';
import type { PollPartsFragment } from '~/graphql/schema';

defineOptions({ name: 'BPollResults' });

const props = withDefaults(defineProps<PollResultsProps>(), {
  canViewVoters: false,
  busy: false,
});

defineEmits<PollResultsEmits>();

function optionVoters(optionId: number): PollPartsFragment['voters'] {
  if (!props.canViewVoters) {
    return [];
  }
  const voters = props.poll.voters.filter((voter) => voter.optionIds.includes(optionId));
  return voters.toSorted((firstVoter, secondVoter) => {
    const firstVoteTime = voteTime(firstVoter);
    const secondVoteTime = voteTime(secondVoter);
    return firstVoteTime - secondVoteTime;
  });
}

function voteTime(voter: PollPartsFragment['voters'][number]): number {
  if (!voter.votedAt) {
    return 0;
  }
  const timestamp = Date.parse(voter.votedAt);
  if (Number.isNaN(timestamp)) {
    return 0;
  }
  return timestamp;
}
</script>

<style lang="scss" src="./poll-results.scss">
</style>
