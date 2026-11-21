<template>
  <section class="message-poll" :aria-labelledby="`poll-question-${message.id}`" :aria-busy="busy">
    <div class="message-poll__header">
      <div class="message-poll__caption">
        <svg-icon :name="captionIcon" class="message-poll__icon" aria-hidden="true" />
        <span :title="finishTooltip" :role="captionRole">
          {{ t(captionKey) }}
        </span>
      </div>
      <template v-if="canManage || canCancelVote || canViewVoters">
        <b-actions-dropdown
          :id="`poll-actions-${message.id}`"
          class="message-poll__menu"
          :label="t('poll.actions')"
          :disabled="busy"
        >
          <template #default="{ close }">
            <template v-if="canPreviewResults">
              <b-context-menu-item
                :icon="previewResultsIcon"
                @click="runMenuAction(close, toggleResults, $event)"
              >
                {{ t(previewResultsLabel) }}
              </b-context-menu-item>
            </template>
            <template v-if="canCancelVote">
              <b-context-menu-item
                icon="undo"
                @click="runMenuAction(close, retractVote, $event)"
              >
                {{ t('poll.cancel_vote') }}
              </b-context-menu-item>
            </template>
            <template v-if="canViewVoters">
              <b-context-menu-item
                icon="users"
                @click="runMenuAction(close, openVoters, $event)"
              >
                {{ t('poll.voters') }}
              </b-context-menu-item>
            </template>
            <template v-if="canManage">
              <b-context-menu-item icon="edit" @click="runMenuAction(close, editPoll, $event)">
                {{ t('poll.edit') }}
              </b-context-menu-item>
            </template>
            <template v-if="canClose">
              <b-context-menu-item
                icon="lock"
                important
                @click="runMenuAction(close, closePoll, $event)"
              >
                {{ t('poll.close') }}
              </b-context-menu-item>
            </template>
          </template>
        </b-actions-dropdown>
      </template>
    </div>
    <h3 :aria-label="pollText(question)" :id="`poll-question-${message.id}`" class="message-poll__question">
      <b-formatted-poll-text :content="question" />
    </h3>
    <div class="message-poll__content">
      <template v-if="showResults && poll">
        <b-poll-results
          :poll="poll"
          :can-view-voters="canViewVoters"
          :busy="busy"
          @voters="openVoters"
        />
      </template>
      <template v-else-if="poll && !poll.isClosed">
        <b-poll-choices
          v-model="pendingOptionIds"
          :allow-multiple="poll.allowMultiple"
          :options="options"
          :disabled="votingDisabled"
          :id-prefix="`poll-${message.id}`"
          @vote="vote"
        />
      </template>
    </div>
    <div class="message-poll__footer">
      <template v-if="!showResults && poll">
        <p class="message-poll__hint">{{ t(voteHint) }}</p>
      </template>
      <template v-if="showSummary">
        <div class="poll-summary" role="status">
          <template v-if="showParticipantCount && poll">
            <span class="poll-summary__participants">
              <span>{{ t('poll.participants') }}</span>
              <span class="poll-summary__count">{{ poll.totalVotes }}</span>
            </span>
          </template>
          <template v-if="showDeadline">
            <span class="poll-summary__details">
              <template v-if="showParticipantCount">
                <span aria-hidden="true">·</span>
              </template>
              <span>{{ t('poll.ends_at', { time: endTime }) }}</span>
            </span>
          </template>
        </div>
      </template>
      <template v-if="error">
        <p class="message-poll__error" role="alert">
          {{ error }}
          <button
            type="button"
            class="message-poll__retry"
            :disabled="busy"
            @click="fetchPoll"
          >
            {{ t('poll.retry') }}
          </button>
        </p>
      </template>
    </div>
    <template v-if="showSubmitVote">
      <div class="message-poll__actions">
        <b-poll-button :disabled="submitVoteDisabled" @click="vote(pendingOptionIds)">
          {{ t('poll.submit_vote') }}
        </b-poll-button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { pollText } from '~/tools/poll-formatting';
import type { MessagePollProps } from './index';
import {

  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  getCurrentInstance,
} from 'vue';

import { DateTime } from 'luxon';

import type {

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

const BPollVotersModal = resolveComponent('BPollVotersModal');

defineOptions({ name: 'BMessagePoll' });

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { t, locale } = useI18n();
const modal = useModal();
const { client: graphqlClient } = useGraphql();

const router = useRouter();

const instance = getCurrentInstance()!;

const props = defineProps<MessagePollProps>();

const poll = ref<PollPartsFragment | null>(props.message.poll ?? null);

const showVoters = ref(false);

const votersModalProps = ref<{ poll: PollPartsFragment; currentUserId: number | null } | null>(null);

const previewingResults = ref(false);

const busy = ref(false);

const error = ref('');

const requestId = ref(0);

const pendingOptionIds = ref<number[]>([...(props.message.poll?.selectedOptionIds || [])]);

const closeTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const question = computed((): string => {
  return poll.value?.question || t(props.message.deletedAt ? 'poll.deleted_hint' : 'poll.loading');
});

const options = computed((): PollPartsFragment['options'] => {
  return poll.value?.options || [];
});

const loggedIn = computed((): boolean => {
  return authStore.loggedIn;
});

const votingDisabled = computed((): boolean => {
  return !loggedIn.value || busy.value || !!props.message.deletedAt;
});

const isClosed = computed((): boolean => {
  return !!poll.value?.isClosed;
});

const hasVoted = computed((): boolean => {
  if (!loggedIn.value || !poll.value) {
    return false;
  }
  return poll.value.selectedOptionIds.length > 0;
});

const showResults = computed((): boolean => {
  if (!poll.value) return false;
  if (settingsStore.isOBS) return true;
  if (props.message.deletedAt && poll.value?.totalVotes != null) {
    return true;
  }
  if (isClosed.value || hasVoted.value) {
    return true;
  }
  return canPreviewResults.value && previewingResults.value;
});

const showDeadline = computed((): boolean => {
  if (isClosed.value || props.message.deletedAt) {
    return false;
  }
  return !!poll.value?.endsAt;
});

const showParticipantCount = computed((): boolean => {
  if (!showResults.value || !poll.value) {
    return false;
  }
  return poll.value.totalVotes != null;
});

const showSummary = computed((): boolean => {
  return showResults.value || showDeadline.value;
});

const showSubmitVote = computed((): boolean => {
  if (!poll.value || !loggedIn.value || showResults.value || props.message.deletedAt) {
    return false;
  }
  return poll.value.allowMultiple;
});

const submitVoteDisabled = computed((): boolean => {
  return votingDisabled.value || pendingOptionIds.value.length === 0;
});

const canCancelVote = computed((): boolean => {
  if (!poll.value || !hasVoted.value) {
    return false;
  }
  if (isClosed.value || props.message.deletedAt) {
    return false;
  }
  return poll.value.allowChangeVote;
});

const canManage = computed((): boolean => {
  if (!loggedIn.value || !poll.value) {
    return false;
  }
  if (props.message.deletedAt) {
    return false;
  }
  return authStore.can.updateAny('poll').granted;
});

const canClose = computed((): boolean => {
  return canManage.value && !isClosed.value;
});

const canPreviewResults = computed((): boolean => {
  if (settingsStore.isOBS || !canManage.value || hasVoted.value || isClosed.value) {
    return false;
  }
  return poll.value?.totalVotes != null;
});

const canViewVoters = computed((): boolean => {
  return (
    loggedIn.value && !!poll.value && !poll.value.isAnonymous && authStore.can.updateAny('poll').granted
  );
});

const votersModalName = computed((): string => {
  return `poll-voters-${props.message.id}`;
});

const captionIcon = computed((): string => {
  if (isClosed.value) {
    return 'lock';
  }
  return 'poll';
});

const captionRole = computed((): string | undefined => {
  if (isClosed.value) {
    return 'status';
  }
  return undefined;
});

const captionKey = computed((): string => {
  if (props.message.deletedAt) {
    return 'poll.deleted';
  }
  if (poll.value?.isAnonymous) {
    if (isClosed.value) {
      return 'poll.anonymous_closed';
    }
    return 'poll.anonymous';
  }
  if (isClosed.value) {
    return 'poll.closed';
  }
  return 'poll.title';
});

const previewResultsIcon = computed((): string => {
  if (previewingResults.value) {
    return 'list';
  }
  return 'chart';
});

const previewResultsLabel = computed((): string => {
  if (previewingResults.value) {
    return 'poll.show_options';
  }
  return 'poll.preview_results';
});

const finishTooltip = computed((): string | undefined => {
  if (!poll.value || !isClosed.value) {
    return undefined;
  }
  const finishedAt = poll.value.closedAt || poll.value.endsAt;
  if (!finishedAt) {
    return undefined;
  }
  const time = DateTime.fromISO(finishedAt).setLocale(locale.value)
    .toLocaleString(DateTime.DATETIME_SHORT);
  return t('poll.finished_at', { time });
});

function runMenuAction(
  closeMenu: () => void,
  action: (event: MouseEvent) => void | Promise<void>,
  event: MouseEvent,
): void {
  closeMenu();
  action(event);
}

function openVoters(): void {
  if (!canViewVoters.value || !poll.value) {
    return;
  }
  if (busy.value || showVoters.value) {
    return;
  }
  const menuTrigger = (instance.proxy!.$el as HTMLElement).querySelector<HTMLElement>('.actions-dropdown__trigger');
  menuTrigger?.focus();
  votersModalProps.value = {
    poll: poll.value,
    currentUserId: authStore.userId,
  };
  showVoters.value = true;
  modal.show(
    BPollVotersModal,
    votersModalProps.value,
    {
      name: votersModalName.value,
      width: '100%',
      height: 'auto',
    },
    {
      closed: () => {
        showVoters.value = false;
        votersModalProps.value = null;
        if (menuTrigger && document.documentElement.contains(menuTrigger)) {
          menuTrigger.focus();
        }
      },
    },
  );
}

function closeVoters(): void {
  if (showVoters.value) {
    modal.hide(votersModalName.value);
  }
}

function onVoterPermissionsChanged(): void {
  if (!canViewVoters.value) {
    closeVoters();
  }
}

function editPoll(): void {
  router.push({ name: 'modal_poll_edit', params: { id: props.message.id.toString() } });
}

async function focusAnswers(): Promise<void> {
  await nextTick();
  const answerSelector = '.message-poll__content input, .message-poll__content button';
  const firstAnswer = (instance.proxy!.$el as HTMLElement).querySelector<HTMLElement>(answerSelector);
  firstAnswer?.focus();
}

async function toggleResults(event: MouseEvent): Promise<void> {
  if (!canPreviewResults.value || busy.value) {
    return;
  }
  previewingResults.value = !previewingResults.value;
  const isOpenedFromKeyboard = event.detail === 0;
  if (!previewingResults.value && isOpenedFromKeyboard) {
    await focusAnswers();
  }
}

async function retractVote(event: MouseEvent): Promise<void> {
  await cancelVote();
  const isOpenedFromKeyboard = event.detail === 0;
  if (!hasVoted.value && isOpenedFromKeyboard) {
    await focusAnswers();
  }
}

const voteHint = computed((): string => {
  if (props.message.deletedAt) {
    return 'poll.deleted_hint';
  }
  if (!loggedIn.value) {
    return 'poll.login_hint';
  }
  if (poll.value?.allowMultiple) {
    return 'poll.multiple_vote_hint';
  }
  return 'poll.vote_hint';
});

const endTime = computed((): string => {
  if (!poll.value?.endsAt) {
    return '';
  }
  return DateTime.fromISO(poll.value.endsAt).setLocale(locale.value)
    .toLocaleString(DateTime.DATETIME_SHORT);
});

function mounted(): void {
  if (poll.value) {
    scheduleRefresh(poll.value);
    return;
  }
  fetchPoll();
}

function cleanup(): void {
  closeVoters();
  ++requestId.value;
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
  }
}

function onPollUpdated(): void {
  if (props.message.poll) {
    ++requestId.value;
    setPoll(props.message.poll);
    error.value = '';
    return;
  }
  fetchPoll();
}

function onUserChanged(): void {
  closeVoters();
  previewingResults.value = false;
  poll.value = null;
  pendingOptionIds.value = [];
  fetchPoll();
}

function setPoll(value: PollPartsFragment): void {
  previewingResults.value = false;
  poll.value = value;
  if (votersModalProps.value) {
    votersModalProps.value.poll = value;
  }
  pendingOptionIds.value = [...value.selectedOptionIds];
  scheduleRefresh(value);
}

function scheduleRefresh(poll: PollPartsFragment): void {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
  }
  closeTimer.value = null;
  if (!poll.endsAt || poll.isClosed || props.message.deletedAt) {
    return;
  }
  const endTime = Date.parse(poll.endsAt);
  const serverTime = Date.parse(poll.serverTime);
  const remaining = endTime - serverTime;
  const minimumDelay = Math.max(remaining + 50, 100);
  const oneDay = 24 * 60 * 60 * 1000;
  const delay = Math.min(minimumDelay, oneDay);
  closeTimer.value = setTimeout(() => fetchPoll(), delay);
}

async function cancelVote(): Promise<void> {
  if (!canCancelVote.value || busy.value) {
    return;
  }
  busy.value = true;
  error.value = '';
  ++requestId.value;
  try {
    const { data } = await graphqlClient.mutate<CancelPollVoteMutation, CancelPollVoteMutationVariables>({
      mutation: CancelPollVote,
      variables: {
        messageId: props.message.id,
      },
    });
    if (!data) {
      throw new Error('No poll returned');
    }
    ++requestId.value;
    setPoll(data.cancelPollVote);
  } catch {
    await fetchPoll();
    if (!poll.value?.isClosed) {
      error.value = t('poll.cancel_vote_error');
    }
  } finally {
    busy.value = false;
  }
}

async function fetchPoll(): Promise<void> {
  if (props.message.deletedAt) {
    ++requestId.value;
    error.value = '';
    return;
  }
  const currentRequestId = ++requestId.value;
  try {
    const { data } = await graphqlClient.query<GetPollQuery, GetPollQueryVariables>({
      query: GetPoll,
      variables: { messageId: props.message.id },
      fetchPolicy: 'no-cache',
    });
    if (currentRequestId !== requestId.value) {
      return;
    }
    setPoll(data.getPoll);
    error.value = '';
  } catch {
    if (currentRequestId === requestId.value) {
      error.value = t('poll.load_error');
    }
  }
}

async function vote(optionIds: number[]): Promise<void> {
  if (!optionIds.length) {
    return;
  }
  if (votingDisabled.value || !poll.value || poll.value.isClosed) {
    return;
  }
  if (hasVoted.value) {
    return;
  }
  busy.value = true;
  error.value = '';
  ++requestId.value;
  try {
    const { data } = await graphqlClient.mutate<VotePollMutation, VotePollMutationVariables>({
      mutation: VotePoll,
      variables: { messageId: props.message.id, optionIds },
    });
    if (!data) {
      throw new Error('No vote returned');
    }
    ++requestId.value;
    setPoll(data.votePoll);
  } catch {
    await fetchPoll();
    if (!poll.value?.isClosed) {
      error.value = t('poll.vote_error');
    }
  } finally {
    busy.value = false;
  }
}

async function closePoll(): Promise<void> {
  if (!canClose.value || busy.value) {
    return;
  }
  busy.value = true;
  error.value = '';
  ++requestId.value;
  try {
    const { data } = await graphqlClient.mutate<ClosePollMutation, ClosePollMutationVariables>({
      mutation: ClosePoll,
      variables: { messageId: props.message.id },
    });
    if (!data) {
      throw new Error('No poll returned');
    }
    ++requestId.value;
    setPoll(data.closePoll);
  } catch {
    error.value = t('poll.close_error');
  } finally {
    busy.value = false;
  }
}

watch(() => canViewVoters.value, onVoterPermissionsChanged);

watch(() => props.message.poll, onPollUpdated);

watch(() => authStore.userId, onUserChanged);

watch(() => loggedIn.value, onUserChanged);

onMounted(mounted);

onBeforeUnmount(cleanup);
</script>

<style lang="scss" src="./message-poll.scss">
</style>
