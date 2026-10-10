<template>
  <section class="message-poll" :aria-labelledby="`poll-question-${message.id}`" :aria-busy="busy">
    <div class="message-poll__header">
      <div class="message-poll__caption">
        <svg-icon :name="captionIcon" class="message-poll__icon" aria-hidden="true" />
        <span :title="finishTooltip" :role="captionRole">
          {{ $t(captionKey) }}
        </span>
      </div>
      <b-actions-dropdown
        v-if="canManage || canCancelVote"
        :id="`poll-actions-${message.id}`"
        class="message-poll__menu"
        :label="$t('poll.actions')"
        :disabled="busy"
      >
        <template #default="{ close }">
          <b-context-menu-item
            v-if="canPreviewResults"
            :icon="previewResultsIcon"
            @click="runMenuAction(close, toggleResults, $event)"
          >
            {{ $t(previewResultsLabel) }}
          </b-context-menu-item>
          <b-context-menu-item
            v-if="canCancelVote"
            icon="undo"
            @click="runMenuAction(close, retractVote, $event)"
          >
            {{ $t('poll.cancel_vote') }}
          </b-context-menu-item>
          <b-context-menu-item
            v-if="canViewVoters"
            icon="users"
            @click="runMenuAction(close, openVoters, $event)"
          >
            {{ $t('poll.voters') }}
          </b-context-menu-item>
          <b-context-menu-item v-if="canManage" icon="edit" @click="runMenuAction(close, editPoll, $event)">
            {{ $t('poll.edit') }}
          </b-context-menu-item>
          <b-context-menu-item
            v-if="canClose"
            icon="lock"
            important
            @click="runMenuAction(close, closePoll, $event)"
          >
            {{ $t('poll.close') }}
          </b-context-menu-item>
        </template>
      </b-actions-dropdown>
    </div>
    <h3 :id="`poll-question-${message.id}`" class="message-poll__question">{{ question }}</h3>
    <div class="message-poll__content">
      <b-poll-results
        v-if="showResults"
        :poll="poll"
        :can-view-voters="canViewVoters"
        :busy="busy"
        @voters="openVoters"
      />
      <b-poll-choices
        v-else-if="poll && !poll.isClosed"
        v-model="pendingOptionIds"
        :allow-multiple="poll.allowMultiple"
        :options="options"
        :disabled="votingDisabled"
        :id-prefix="`poll-${message.id}`"
        @vote="vote"
      />
    </div>
    <div class="message-poll__footer">
      <p v-if="!showResults && poll" class="message-poll__hint">{{ $t(voteHint) }}</p>
      <div v-if="showSummary" class="poll-summary" role="status">
        <span v-if="showParticipantCount" class="poll-summary__participants">
          <span>{{ $t('poll.participants') }}</span>
          <span class="poll-summary__count">{{ poll.totalVotes }}</span>
        </span>
        <span v-if="showDeadline" class="poll-summary__details">
          <span v-if="showParticipantCount" aria-hidden="true">·</span>
          <span>{{ $t('poll.ends_at', { time: endTime }) }}</span>
        </span>
      </div>
      <p v-if="error" class="message-poll__error" role="alert">
        {{ error }}
        <button type="button" class="message-poll__retry" :disabled="busy" @click="fetchPoll">
          {{ $t('poll.retry') }}
        </button>
      </p>
    </div>
    <div v-if="showSubmitVote" class="message-poll__actions">
      <b-poll-button :disabled="submitVoteDisabled" @click="vote(pendingOptionIds)">
        {{ $t('poll.submit_vote') }}
      </b-poll-button>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import BPollVotersModal from '~/components/modals/poll-voters-modal/poll-voters-modal.vue';
import BPollButton from '~/components/poll-button/poll-button.vue';
import BActionsDropdown from '~/components/actions-dropdown/actions-dropdown.vue';
import BContextMenuItem from '~/components/context-menu-item/context-menu-item.vue';
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
    BPollButton,
    BActionsDropdown,
    BContextMenuItem,
    BPollResults,
    BPollChoices,
  },
})
export default class MessagePoll extends Vue {
  @Prop({ required: true }) message!: Message;

  poll: PollPartsFragment | null = this.message.poll ?? null;
  showVoters = false;
  votersModalProps: { poll: PollPartsFragment; currentUserId: number | null } | null = null;
  previewingResults = false;
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

  get isClosed(): boolean {
    return !!this.poll?.isClosed;
  }

  get hasVoted(): boolean {
    if (!this.loggedIn || !this.poll) {
      return false;
    }

    return this.poll.selectedOptionIds.length > 0;
  }

  get showResults(): boolean {
    if (this.isClosed || this.hasVoted) {
      return true;
    }

    return this.canPreviewResults && this.previewingResults;
  }

  get showDeadline(): boolean {
    if (this.isClosed) {
      return false;
    }

    return !!this.poll?.endsAt;
  }

  get showParticipantCount(): boolean {
    if (!this.showResults || !this.poll) {
      return false;
    }

    return this.poll.totalVotes != null;
  }

  get showSummary(): boolean {
    return this.showResults || this.showDeadline;
  }

  get showSubmitVote(): boolean {
    if (!this.poll || !this.loggedIn || this.showResults) {
      return false;
    }

    return this.poll.allowMultiple;
  }

  get submitVoteDisabled(): boolean {
    return this.votingDisabled || this.pendingOptionIds.length === 0;
  }

  get canCancelVote(): boolean {
    if (!this.poll || !this.hasVoted) {
      return false;
    }

    if (this.isClosed || this.message.deletedAt) {
      return false;
    }

    return this.poll.allowChangeVote;
  }

  get canManage(): boolean {
    if (!this.loggedIn || !this.poll) {
      return false;
    }

    if (this.message.deletedAt) {
      return false;
    }

    return this.$accessor.auth.can.updateAny('poll').granted;
  }

  get canClose(): boolean {
    return this.canManage && !this.isClosed;
  }

  get canPreviewResults(): boolean {
    if (!this.canManage || this.hasVoted || this.isClosed) {
      return false;
    }

    return this.poll?.totalVotes != null;
  }

  get canViewVoters(): boolean {
    if (!this.canManage) {
      return false;
    }

    return !this.poll?.isAnonymous;
  }

  get votersModalName(): string {
    return `poll-voters-${this.message.id}`;
  }

  get captionIcon(): string {
    if (this.isClosed) {
      return 'lock';
    }

    return 'poll';
  }

  get captionRole(): string | undefined {
    if (this.isClosed) {
      return 'status';
    }

    return undefined;
  }

  get captionKey(): string {
    if (this.poll?.isAnonymous) {
      if (this.isClosed) {
        return 'poll.anonymous_closed';
      }

      return 'poll.anonymous';
    }

    if (this.isClosed) {
      return 'poll.closed';
    }

    return 'poll.title';
  }

  get previewResultsIcon(): string {
    if (this.previewingResults) {
      return 'list';
    }

    return 'chart';
  }

  get previewResultsLabel(): string {
    if (this.previewingResults) {
      return 'poll.show_options';
    }

    return 'poll.preview_results';
  }

  get finishTooltip(): string | undefined {
    if (!this.poll || !this.isClosed) {
      return undefined;
    }

    const finishedAt = this.poll.closedAt || this.poll.endsAt;

    if (!finishedAt) {
      return undefined;
    }

    const time = DateTime.fromISO(finishedAt)
      .setLocale(this.$i18n.locale)
      .toLocaleString(DateTime.DATETIME_SHORT);

    return this.$t('poll.finished_at', { time }).toString();
  }

  runMenuAction(
    closeMenu: () => void,
    action: (event: MouseEvent) => void | Promise<void>,
    event: MouseEvent,
  ): void {
    closeMenu();
    action(event);
  }

  openVoters(): void {
    if (!this.canViewVoters || !this.poll) {
      return;
    }

    if (this.busy || this.showVoters) {
      return;
    }

    const menuTrigger = this.$el.querySelector<HTMLElement>('.actions-dropdown__trigger');
    menuTrigger?.focus();
    this.votersModalProps = {
      poll: this.poll,
      currentUserId: this.$accessor.auth.userId,
    };
    this.showVoters = true;

    this.$modal.show(
      BPollVotersModal,
      this.votersModalProps,
      {
        name: this.votersModalName,
        width: '100%',
        height: 'auto',
      },
      {
        closed: () => {
          this.showVoters = false;
          this.votersModalProps = null;

          if (menuTrigger && document.documentElement.contains(menuTrigger)) {
            menuTrigger.focus();
          }
        },
      },
    );
  }

  closeVoters(): void {
    if (this.showVoters) {
      this.$modal.hide(this.votersModalName);
    }
  }

  @Watch('canViewVoters')
  onVoterPermissionsChanged(): void {
    if (!this.canViewVoters) {
      this.closeVoters();
    }
  }

  editPoll(): void {
    this.$router.push({ name: 'modal_poll_edit', params: { id: this.message.id.toString() } });
  }

  async focusAnswers(): Promise<void> {
    await this.$nextTick();

    const answerSelector = '.message-poll__content input, .message-poll__content button';
    const firstAnswer = this.$el.querySelector<HTMLElement>(answerSelector);
    firstAnswer?.focus();
  }

  async toggleResults(event: MouseEvent): Promise<void> {
    if (!this.canPreviewResults || this.busy) {
      return;
    }

    this.previewingResults = !this.previewingResults;

    const openedFromKeyboard = event.detail === 0;

    if (!this.previewingResults && openedFromKeyboard) {
      await this.focusAnswers();
    }
  }

  async retractVote(event: MouseEvent): Promise<void> {
    await this.cancelVote();

    const openedFromKeyboard = event.detail === 0;

    if (!this.hasVoted && openedFromKeyboard) {
      await this.focusAnswers();
    }
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
    this.closeVoters();
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
    this.closeVoters();
    this.previewingResults = false;
    this.poll = null;
    this.pendingOptionIds = [];
    this.fetchPoll();
  }

  setPoll(poll: PollPartsFragment): void {
    this.previewingResults = false;
    this.poll = poll;

    if (this.votersModalProps) {
      this.votersModalProps.poll = poll;
    }

    this.pendingOptionIds = [...poll.selectedOptionIds];

    this.scheduleRefresh(poll);
  }

  scheduleRefresh(poll: PollPartsFragment): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }

    this.closeTimer = null;

    if (!poll.endsAt || poll.isClosed) {
      return;
    }

    const endTime = Date.parse(poll.endsAt);
    const serverTime = Date.parse(poll.serverTime);
    const remaining = endTime - serverTime;
    const minimumDelay = Math.max(remaining + 50, 100);
    const oneDay = 24 * 60 * 60 * 1000;
    const delay = Math.min(minimumDelay, oneDay);

    this.closeTimer = setTimeout(() => this.fetchPoll(), delay);
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
