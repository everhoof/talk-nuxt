<template>
  <section class="message-poll" :aria-label="$t('poll.title')">
    <span class="message-poll__caption">{{ $t('poll.title') }}</span>
    <h3 class="message-poll__question">{{ question }}</h3>
    <div v-if="hasVoted" class="message-poll__results" aria-live="polite">
      <div v-for="(option, index) in poll.options" :key="index" class="message-poll__result">
        <div class="message-poll__result-label">
          <span>{{ option.label }} <span v-if="poll.selectedOption === index">✓</span></span>
          <span>{{ percent(option.votes) }}% · {{ option.votes }}</span>
        </div>
        <div class="message-poll__bar">
          <div class="message-poll__fill" :style="{ width: `${percent(option.votes)}%` }" />
        </div>
      </div>
      <p class="message-poll__hint">
        {{ $t('poll.total', { count: poll.totalVotes }) }} · {{ $t('poll.voted') }}
      </p>
    </div>
    <template v-else>
      <button
        v-for="(option, index) in options"
        :key="index"
        type="button"
        class="message-poll__option"
        :disabled="!loggedIn || busy || !poll || !!message.deletedAt"
        @click="vote(index)"
      >
        {{ option }}
      </button>
      <p class="message-poll__hint">{{ $t(loggedIn ? 'poll.vote_hint' : 'poll.login_hint') }}</p>
    </template>
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
import { Message, PollJson } from '~/types/message';
import {
  GetPollQuery,
  GetPollQueryVariables,
  PollPartsFragment,
  VotePollMutation,
  VotePollMutationVariables,
} from '~/graphql/schema';
import GetPoll from '~/graphql/queries/get-poll.graphql';
import VotePoll from '~/graphql/mutations/vote-poll.graphql';

@Component({ name: 'b-message-poll' })
export default class MessagePoll extends Vue {
  @Prop({ required: true }) message!: Message;
  poll: PollPartsFragment | null = null;
  busy = false;
  error = '';
  requestId = 0;

  get metadata(): PollJson {
    return this.message.json as PollJson;
  }

  get question(): string {
    return this.metadata.question;
  }
  get options(): string[] {
    return this.metadata.options;
  }
  get loggedIn(): boolean {
    return this.$accessor.auth.loggedIn;
  }
  get hasVoted(): boolean {
    return this.loggedIn && this.poll?.selectedOption != null;
  }

  mounted(): void {
    this.fetchPoll();
  }

  @Watch('message.updatedAt')
  onPollUpdated(): void {
    this.fetchPoll();
  }

  @Watch('$accessor.auth.userId')
  @Watch('loggedIn')
  onUserChanged(): void {
    this.poll = null;
    this.fetchPoll();
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
      this.poll = data.getPoll;
      this.error = '';
    } catch (_error) {
      if (requestId === this.requestId) this.error = this.$t('poll.load_error').toString();
    }
  }

  percent(votes: number | null | undefined): number {
    return this.poll?.totalVotes ? Math.round(((votes || 0) * 100) / this.poll.totalVotes) : 0;
  }

  async vote(optionIndex: number): Promise<void> {
    if (!this.loggedIn || this.busy || this.hasVoted) return;
    this.busy = true;
    this.error = '';
    ++this.requestId;
    try {
      const { data } = await this.$apollo.mutate<VotePollMutation, VotePollMutationVariables>({
        mutation: VotePoll,
        variables: { messageId: this.message.id, optionIndex },
      });
      if (!data) throw new Error('No vote returned');
      ++this.requestId;
      this.poll = data.votePoll;
    } catch (_error) {
      await this.fetchPoll();
      if (!this.hasVoted) this.error = this.$t('poll.vote_error').toString();
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="stylus" src="./message-poll.styl" />
