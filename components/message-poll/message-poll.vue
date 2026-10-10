<template>
  <section class="message-poll" :aria-label="$t('poll.title')">
    <span class="message-poll__caption">{{ $t(captionKey) }}</span>
    <h3 class="message-poll__question">{{ question }}</h3>
    <p v-if="poll && poll.isClosed" class="message-poll__status">
      {{ $t('poll.closed') }}
    </p>
    <p v-else-if="poll && poll.endsAt" class="message-poll__hint">
      {{ $t('poll.ends_at', { time: endTime }) }}
    </p>
    <b-poll-results
      v-if="showResults"
      :poll="poll"
      :has-voted="hasVoted"
      :can-cancel-vote="canCancelVote"
      :busy="busy"
      @cancel-vote="cancelVote"
    />
    <template v-else-if="poll && !poll.isClosed">
      <b-poll-choices
        v-model="pendingOptionIds"
        :allow-multiple="poll.allowMultiple"
        :options="options"
        :disabled="votingDisabled"
        :show-submit="loggedIn"
        @vote="vote"
      />
      <p class="message-poll__hint">{{ $t(voteHint) }}</p>
    </template>
    <b-button v-if="canClose" class="message-poll__action" small :disabled="busy" @click="closePoll">
      {{ $t('poll.close') }}
    </b-button>
    <p v-if="error" class="message-poll__error" role="alert">
      {{ error }}
      <button type="button" class="button message-poll__retry" @click="fetchPoll">
        {{ $t('poll.retry') }}
      </button>
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import BButton from '~/components/button/button.vue';
import BPollResults from '~/components/poll-results/poll-results.vue';
import BPollChoices from '~/components/poll-choices/poll-choices.vue';
import { Message } from '~/types/message';
import {
  CancelPollVoteMutation,
  CancelPollVoteMutationVariables,
  ClosePollMutation,
  ClosePollMutationVariables,
  GetPollQuery,
  GetPollQueryVariables,
  PollPartsFragment,
  VotePollMutation,
  VotePollMutationVariables,
} from '~/graphql/schema';
import GetPoll from '~/graphql/queries/get-poll.graphql';
import VotePoll from '~/graphql/mutations/vote-poll.graphql';
import ClosePoll from '~/graphql/mutations/close-poll.graphql';
import CancelPollVote from '~/graphql/mutations/cancel-poll-vote.graphql';

@Component({
  name: 'b-message-poll',
  components: {
    BButton,
    BPollResults,
    BPollChoices,
  },
})
export default class MessagePoll extends Vue {
  @Prop({ required: true }) message!: Message;
  poll: PollPartsFragment | null = this.message.poll ?? null;
  busy = false;
  error = '';
  requestId = 0;
  pendingOptionIds: number[] = [...(this.message.poll?.selectedOptionIds || [])];
  closeTimer: ReturnType<typeof setTimeout> | null = null;

  get question(): string {
    return this.poll?.question || this.$t('poll.loading').toString();
  }

  get options(): PollPartsFragment['options'] {
    return this.poll?.options || [];
  }

  get loggedIn(): boolean {
    return this.$accessor.auth.loggedIn;
  }

  get votingDisabled(): boolean {
    return !this.loggedIn || this.busy || !!this.message.deletedAt;
  }

  get hasVoted(): boolean {
    return this.loggedIn && !!this.poll?.selectedOptionIds.length;
  }

  get showResults(): boolean {
    if (this.poll?.isClosed) {
      return true;
    }

    return this.poll?.totalVotes != null;
  }

  get canCancelVote(): boolean {
    return this.hasVoted && !!this.poll?.allowChangeVote && !this.poll.isClosed && !this.message.deletedAt;
  }

  get canClose(): boolean {
    return (
      this.loggedIn &&
      !!this.poll &&
      !this.poll.isClosed &&
      !this.message.deletedAt &&
      this.$accessor.auth.can.updateAny('poll').granted
    );
  }

  get captionKey(): string {
    if (this.poll?.isAnonymous) return this.poll.isClosed ? 'poll.anonymous_closed' : 'poll.anonymous';
    return this.poll?.isClosed ? 'poll.closed' : 'poll.title';
  }

  get voteHint(): string {
    if (!this.loggedIn) {
      return 'poll.login_hint';
    }

    if (this.poll?.allowMultiple) {
      return 'poll.multiple_vote_hint';
    }

    return 'poll.vote_hint';
  }

  get endTime(): string {
    if (!this.poll?.endsAt) {
      return '';
    }

    return DateTime.fromISO(this.poll.endsAt)
      .setLocale(this.$i18n.locale)
      .toLocaleString(DateTime.DATETIME_SHORT);
  }

  mounted(): void {
    if (this.poll) {
      this.scheduleRefresh(this.poll);

      return;
    }

    this.fetchPoll();
  }

  beforeDestroy(): void {
    ++this.requestId;

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }

  @Watch('message.poll')
  onPollUpdated(): void {
    if (this.message.poll) {
      ++this.requestId;
      this.setPoll(this.message.poll);
      this.error = '';

      return;
    }

    this.fetchPoll();
  }

  @Watch('$accessor.auth.userId')
  @Watch('loggedIn')
  onUserChanged(): void {
    this.poll = null;
    this.pendingOptionIds = [];
    this.fetchPoll();
  }

  setPoll(poll: PollPartsFragment): void {
    this.poll = poll;

    this.pendingOptionIds = [...poll.selectedOptionIds];

    this.scheduleRefresh(poll);
  }

  scheduleRefresh(poll: PollPartsFragment): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }

    this.closeTimer = null;

    if (poll.endsAt && !poll.isClosed) {
      const remaining = Date.parse(poll.endsAt) - Date.parse(poll.serverTime);
      const delay = Math.min(Math.max(remaining + 50, 100), 86400000);
      this.closeTimer = setTimeout(() => this.fetchPoll(), delay);
    }
  }

  async cancelVote(): Promise<void> {
    if (!this.canCancelVote || this.busy) {
      return;
    }

    this.busy = true;
    this.error = '';
    ++this.requestId;

    try {
      const { data } = await this.$apollo.mutate<CancelPollVoteMutation, CancelPollVoteMutationVariables>({
        mutation: CancelPollVote,
        variables: {
          messageId: this.message.id,
        },
      });

      if (!data) {
        throw new Error('No poll returned');
      }

      ++this.requestId;
      this.setPoll(data.cancelPollVote);
    } catch (_error) {
      await this.fetchPoll();

      if (!this.poll?.isClosed) {
        this.error = this.$t('poll.cancel_vote_error').toString();
      }
    } finally {
      this.busy = false;
    }
  }

  async fetchPoll(): Promise<void> {
    if (this.message.deletedAt) {
      return;
    }

    const requestId = ++this.requestId;

    try {
      const { data } = await this.$apollo.query<GetPollQuery, GetPollQueryVariables>({
        query: GetPoll,
        variables: { messageId: this.message.id },
        fetchPolicy: 'no-cache',
      });

      if (requestId !== this.requestId) {
        return;
      }

      this.setPoll(data.getPoll);
      this.error = '';
    } catch (_error) {
      if (requestId === this.requestId) {
        this.error = this.$t('poll.load_error').toString();
      }
    }
  }

  async vote(optionIds: number[]): Promise<void> {
    if (!optionIds.length) {
      return;
    }

    if (this.votingDisabled || !this.poll || this.poll.isClosed) {
      return;
    }

    if (this.hasVoted) {
      return;
    }

    this.busy = true;
    this.error = '';
    ++this.requestId;

    try {
      const { data } = await this.$apollo.mutate<VotePollMutation, VotePollMutationVariables>({
        mutation: VotePoll,
        variables: { messageId: this.message.id, optionIds },
      });

      if (!data) {
        throw new Error('No vote returned');
      }

      ++this.requestId;
      this.setPoll(data.votePoll);
    } catch (_error) {
      await this.fetchPoll();

      if (!this.poll?.isClosed) {
        this.error = this.$t('poll.vote_error').toString();
      }
    } finally {
      this.busy = false;
    }
  }

  async closePoll(): Promise<void> {
    if (!this.canClose || this.busy) {
      return;
    }

    this.busy = true;
    this.error = '';
    ++this.requestId;

    try {
      const { data } = await this.$apollo.mutate<ClosePollMutation, ClosePollMutationVariables>({
        mutation: ClosePoll,
        variables: { messageId: this.message.id },
      });

      if (!data) {
        throw new Error('No poll returned');
      }

      ++this.requestId;
      this.setPoll(data.closePoll);
    } catch (_error) {
      this.error = this.$t('poll.close_error').toString();
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="stylus" src="./message-poll.styl" />
