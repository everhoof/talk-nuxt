<template>
  <div class="poll-results" aria-live="polite">
    <b-poll-result-item
      v-for="option in poll.options"
      :key="option.id"
      :option="option"
      :total-votes="poll.totalVotes"
      :selected="poll.selectedOptionIds.includes(option.id)"
    />
    <p class="poll-results__hint">
      {{ $t('poll.total', { count: poll.totalVotes }) }}
      <template v-if="hasVoted"> · {{ $t('poll.voted') }}</template>
    </p>
    <p v-if="poll.allowMultiple" class="poll-results__hint">
      {{ $t('poll.multiple_results_hint') }}
    </p>
    <b-button
      v-if="canChangeVote"
      class="poll-results__action"
      small
      :disabled="busy"
      @click="$emit('change-vote')"
    >
      {{ $t('poll.change_vote') }}
    </b-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BButton from '~/components/button/button.vue';
import BPollResultItem from '~/components/poll-result-item/poll-result-item.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({
  name: 'b-poll-results',
  components: {
    BButton,
    BPollResultItem,
  },
})
export default class PollResults extends Vue {
  @Prop({
    type: Object,
    required: true,
  })
  readonly poll!: PollPartsFragment;

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly hasVoted!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly canChangeVote!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly busy!: boolean;
}
</script>

<style lang="stylus" src="./poll-results.styl" />
