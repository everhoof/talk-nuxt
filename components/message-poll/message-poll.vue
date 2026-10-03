<template>
  <section class="message-poll" :aria-label="$t('poll.title')">
    <span class="message-poll__caption">{{ $t('poll.title') }}</span>
    <h3 class="message-poll__question">{{ question }}</h3>
    <p v-if="poll && poll.isClosed" class="message-poll__status">{{ $t('poll.closed') }}</p>
    <p v-else-if="poll && poll.endsAt" class="message-poll__hint">
      {{ $t('poll.ends_at', { time: endTime }) }}
    </p>
    <div v-if="showResults" class="message-poll__results" aria-live="polite">
      <div v-for="option in poll.options" :key="option.id" class="message-poll__result">
        <div class="message-poll__result-label">
          <span>{{ option.label }} <span v-if="poll.selectedOptionIds.includes(option.id)">✓</span></span>
          <span>{{ percent(option.votes) }}% · {{ option.votes }}</span>
        </div>
        <div class="message-poll__bar">
          <div class="message-poll__fill" :style="{ width: `${percent(option.votes)}%` }" />
        </div>
      </div>
      <p class="message-poll__hint">
        {{ $t('poll.total', { count: poll.totalVotes }) }}
        <template v-if="hasVoted"> · {{ $t('poll.voted') }}</template>
      </p>
      <p v-if="poll.allowMultiple" class="message-poll__hint">{{ $t('poll.multiple_results_hint') }}</p>
      <b-button
        v-if="canChangeVote"
        class="message-poll__action"
        small
        :disabled="busy"
        @click="startVoteChange"
      >
        {{ $t('poll.change_vote') }}
      </b-button>
    </div>
    <template v-else-if="poll && !poll.isClosed">
      <template v-if="poll.allowMultiple">
        <label v-for="option in options" :key="option.id" class="message-poll__choice">
          <input
            v-model="pendingOptionIds"
            type="checkbox"
            :value="option.id"
            :disabled="!loggedIn || busy || !!message.deletedAt"
          />
          <span>{{ option.label }}</span>
        </label>
        <b-button
          v-if="loggedIn"
          class="message-poll__action message-poll__submit"
          small
          :disabled="busy || !pendingOptionIds.length || !!message.deletedAt"
          @click="vote(pendingOptionIds)"
        >
          {{ $t('poll.submit_vote') }}
        </b-button>
      </template>
      <template v-else>
        <button
          v-for="option in options"
          :key="option.id"
          type="button"
          class="message-poll__option"
          :disabled="!loggedIn || busy || !!message.deletedAt"
          @click="vote([option.id])"
        >
          {{ option.label }}
        </button>
      </template>
      <p class="message-poll__hint">{{ $t(voteHint) }}</p>
      <b-button
        v-if="changingVote"
        class="message-poll__action"
        small
        :disabled="busy"
        @click="changingVote = false"
      >
        {{ $t('poll.cancel_vote_change') }}
      </b-button>
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
import { Message } from '~/types/message';
import {
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

@Component({ name: 'b-message-poll', components: { BButton } })
export default class MessagePoll extends Vue {
  @Prop({ required: true }) message!: Message;
  poll: PollPartsFragment | null = null;
  busy = false;
  error = '';
  requestId = 0;
  pendingOptionIds: number[] = [];
  changingVote = false;
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
  get hasVoted(): boolean {
    return this.loggedIn && !!this.poll?.selectedOptionIds.length;
  }
  get showResults(): boolean {
    return this.poll?.totalVotes != null && !this.changingVote;
  }
  get canChangeVote(): boolean {
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
  get voteHint(): string {
    if (!this.loggedIn) return 'poll.login_hint';
    if (this.poll?.allowMultiple) return 'poll.multiple_vote_hint';
    return 'poll.vote_hint';
  }
  get endTime(): string {
    if (!this.poll?.endsAt) return '';
    return DateTime.fromISO(this.poll.endsAt)
      .setLocale(this.$i18n.locale)
      .toLocaleString(DateTime.DATETIME_SHORT);
  }

  mounted(): void {
    this.fetchPoll();
  }

  beforeDestroy(): void {
    ++this.requestId;
    if (this.closeTimer) clearTimeout(this.closeTimer);
  }

  @Watch('message.updatedAt')
  onPollUpdated(): void {
    this.fetchPoll();
  }

  @Watch('$accessor.auth.userId')
  @Watch('loggedIn')
  onUserChanged(): void {
    this.poll = null;
    this.pendingOptionIds = [];
    this.changingVote = false;
    this.fetchPoll();
  }

  setPoll(poll: PollPartsFragment): void {
    this.poll = poll;
    if (poll.isClosed || !poll.allowChangeVote) this.changingVote = false;
    if (!this.changingVote) {
      this.pendingOptionIds = [...poll.selectedOptionIds];
    } else {
      this.pendingOptionIds = this.pendingOptionIds.filter((id) =>
        poll.options.some((option) => option.id === id),
      );
    }
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    if (poll.endsAt && !poll.isClosed) {
      const remaining = Date.parse(poll.endsAt) - Date.parse(poll.serverTime);
      const delay = Math.min(Math.max(remaining + 50, 100), 86400000);
      this.closeTimer = setTimeout(() => this.fetchPoll(), delay);
    }
  }

  startVoteChange(): void {
    if (!this.canChangeVote || !this.poll) return;
    this.pendingOptionIds = [...this.poll.selectedOptionIds];
    this.changingVote = true;
  }

  async fetchPoll(): Promise<void> {
    if (this.message.deletedAt) return;
    const requestId = ++this.requestId;
    try {
      const { data } = await this.$apollo.query<GetPollQuery, GetPollQueryVariables>({
        query: GetPoll,
        variables: { messageId: this.message.id },
        fetchPolicy: 'no-cache',
      });
      if (requestId !== this.requestId) return;
      this.setPoll(data.getPoll);
      this.error = '';
    } catch (_error) {
      if (requestId === this.requestId) this.error = this.$t('poll.load_error').toString();
    }
  }

  percent(votes: number | null | undefined): number {
    const totalVotes = this.poll?.totalVotes;
    if (!totalVotes) return 0;
    const optionVotes = votes || 0;
    const percentage = (optionVotes * 100) / totalVotes;
    return Math.round(percentage);
  }

  async vote(optionIds: number[]): Promise<void> {
    if (!optionIds.length) return;
    if (!this.loggedIn || this.busy || !this.poll || this.poll.isClosed) return;
    if (this.hasVoted && !this.poll.allowChangeVote) return;
    this.busy = true;
    this.error = '';
    ++this.requestId;
    try {
      const { data } = await this.$apollo.mutate<VotePollMutation, VotePollMutationVariables>({
        mutation: VotePoll,
        variables: { messageId: this.message.id, optionIds },
      });
      if (!data) throw new Error('No vote returned');
      ++this.requestId;
      this.changingVote = false;
      this.setPoll(data.votePoll);
    } catch (_error) {
      await this.fetchPoll();
      if (!this.poll?.isClosed) this.error = this.$t('poll.vote_error').toString();
    } finally {
      this.busy = false;
    }
  }

  async closePoll(): Promise<void> {
    if (!this.canClose || this.busy) return;
    this.busy = true;
    this.error = '';
    ++this.requestId;
    try {
      const { data } = await this.$apollo.mutate<ClosePollMutation, ClosePollMutationVariables>({
        mutation: ClosePoll,
        variables: { messageId: this.message.id },
      });
      if (!data) throw new Error('No poll returned');
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
