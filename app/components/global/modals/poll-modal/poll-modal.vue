<template>
  <b-modal :close-label="t('poll.close_dialog')" @close="$emit('close', $event)">
    <template #title>
      {{ t(titleKey) }}
    </template>
    <template #default>
      <form class="poll-modal" @submit.prevent="submitPoll">
        <div class="poll-modal__body scrollbar">
          <div class="poll-modal__field">
            <label
              id="poll-question-label"
              class="poll-modal__label"
              for="poll-question"
              @click="questionInput?.focus()"
              role="button"
              tabindex="0"
              @keydown.enter.prevent="questionInput?.focus()"
              @keydown.space.prevent="questionInput?.focus()"
            >
              {{ t('poll.question') }}
              <span aria-hidden="true">*</span>
            </label>
            <b-rich-input
              ref="questionInput"
              input-id="poll-question"
              labelledby="poll-question-label"
              :model-value="question"
              class="poll-modal__rich-input"
              :placeholder="t('poll.question_placeholder')"
              :max-length="300"
              required
              single-line
              :disabled="fieldsDisabled"
              @change="onQuestionChange"
              @enter="submitPoll"
            />
          </div>
          <div class="poll-modal__options" role="group" aria-labelledby="poll-options-label">
            <div class="poll-modal__options-header">
              <span id="poll-options-label" class="poll-modal__label">{{ t('poll.options') }}</span>
              <span class="poll-modal__count">{{ options.length }} / 20</span>
            </div>
            <div class="poll-modal__options-list">
              <div v-for="(option, index) in options" :key="option.key" class="poll-modal__option">
                <label
                  :id="`poll-option-label-${option.key}`"
                  :for="`poll-option-${option.key}`"
                  class="poll-modal__option-label"
                >
                  {{ t('poll.option', { number: index + 1 }) }}
                </label>
                <b-rich-input
                  :input-id="`poll-option-${option.key}`"
                  :labelledby="`poll-option-label-${option.key}`"
                  :model-value="option.label"
                  class="poll-modal__rich-input"
                  :placeholder="t('poll.option', { number: index + 1 })"
                  :max-length="100"
                  required
                  single-line
                  :disabled="fieldsDisabled"
                  @change="onOptionChange(option, $event)"
                  @enter="submitPoll"
                />
                <template v-if="options.length > 1">
                  <ui-button
                    type="button"
                    class="poll-modal__remove"
                    :aria-label="t('poll.remove_option', { number: index + 1 })"
                    :disabled="fieldsDisabled"
                    @click="removeOption(index)"
                  >
                    <svg-icon name="close" aria-hidden="true" />
                  </ui-button>
                </template>
              </div>
            </div>
            <div>
              <b-poll-button
                type="button"
                secondary
                :disabled="addOptionDisabled"
                @click="addOption"
              >
                <svg-icon name="plus" aria-hidden="true" />
                <span>{{ t('poll.add_option') }}</span>
              </b-poll-button>
            </div>
          </div>
          <template v-if="duplicateOptions">
            <p class="poll-modal__error" role="alert">
              {{ t('poll.duplicate_options') }}
            </p>
          </template>
          <template v-if="editing">
            <p class="poll-modal__hint">{{ t('poll.edit_hint') }}</p>
          </template>
          <div class="poll-modal__settings">
            <ui-switch
              id="poll-is-anonymous"
              v-model:checked="isAnonymous"
              class="poll-modal__setting"
              :disabled="anonymityDisabled"
            >
              {{ t('poll.anonymous') }}
            </ui-switch>
            <template v-if="isAnonymous">
              <p class="poll-modal__hint">{{ t('poll.anonymous_hint') }}</p>
            </template>
            <template v-if="editing">
              <p class="poll-modal__hint">{{ t('poll.anonymous_immutable') }}</p>
            </template>
            <ui-switch
              id="poll-allow-multiple"
              v-model:checked="allowMultiple"
              class="poll-modal__setting"
              :disabled="fieldsDisabled"
            >
              {{ t('poll.allow_multiple') }}
            </ui-switch>
            <ui-switch
              id="poll-allow-change-vote"
              v-model:checked="allowChangeVote"
              class="poll-modal__setting"
              :disabled="fieldsDisabled"
            >
              {{ t('poll.allow_change_vote') }}
            </ui-switch>
            <ui-switch
              id="poll-has-deadline"
              v-model:checked="hasDeadline"
              class="poll-modal__setting"
              :disabled="deadlineDisabled"
            >
              {{ t('poll.set_deadline') }}
            </ui-switch>
            <template v-if="hasDeadline">
              <div class="poll-modal__field">
                <label for="poll-ends-at" class="poll-modal__label">
                  {{ t('poll.end_time') }}
                  <span aria-hidden="true">*</span>
                </label>
                <input
                  id="poll-ends-at"
                  v-model="endTime"
                  class="poll-modal__input"
                  type="datetime-local"
                  :min="minEndTime"
                  :disabled="deadlineDisabled"
                  :aria-invalid="!validDeadline"
                  :aria-describedby="deadlineErrorId"
                  required
                />
              </div>
            </template>
            <template v-if="hasDeadline && !validDeadline">
              <p
                id="poll-deadline-error"
                class="poll-modal__error"
                role="alert"
              >
                {{ t('poll.end_time_error') }}
              </p>
            </template>
          </div>
          <template v-if="error">
            <p class="poll-modal__error" role="alert">{{ error }}</p>
          </template>
        </div>
        <div class="poll-modal__actions">
          <b-poll-button type="button" secondary @click="$emit('close')">
            {{ t('poll.cancel') }}
          </b-poll-button>
          <b-poll-button type="submit" :disabled="submitDisabled">{{ t(submitLabel) }}</b-poll-button>
        </div>
      </form>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { PollModalEmits } from './index';
import {

  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
  nextTick,
  getCurrentInstance,
} from 'vue';

import { DateTime } from 'luxon';

import CreatePoll from '~/graphql/mutations/create-poll.graphql';
import UpdatePoll from '~/graphql/mutations/update-poll.graphql';
import GetPoll from '~/graphql/queries/get-poll.graphql';
import type {

  CreatePollMutation,
  CreatePollMutationVariables,
  GetPollQuery,
  GetPollQueryVariables,
  UpdatePollMutation,
  UpdatePollMutationVariables,
} from '~/graphql/schema';
import { Message } from '~/types/message';
import BRichInput from '~/components/global/rich-input/rich-input.vue';
import { pollText } from '~/tools/poll-formatting';

interface PollFormOption {
  id: number | null;
  key: number;
  label: string;
}

defineOptions({ name: 'BPollModal' });

const authStore = useAuthStore();
const messagesStore = useMessagesStore();
const { client: graphqlClient } = useGraphql();
const { t } = useI18n();
const events = useChatEvents();

const route = useRoute();

const instance = getCurrentInstance()!;

const emit = defineEmits<PollModalEmits>();

const questionInput = useTemplateRef<InstanceType<typeof BRichInput>>('questionInput');

const question = ref('');

const options = ref<PollFormOption[]>([
  {
    id: null,
    label: '',
    key: 0,
  },
  {
    id: null,
    label: '',
    key: 1,
  },
]);

const nextKey = ref(2);

const isAnonymous = ref(false);

const clockTimer = ref<ReturnType<typeof setInterval> | null>(null);

const now = ref(Date.now());

const busy = ref(false);

const ready = ref(false);

const error = ref('');

const allowMultiple = ref(false);

const allowChangeVote = ref(false);

const hasDeadline = ref(false);

const endTime = ref('');

const minEndTime = ref('');

const closed = ref(false);

const originalEndsAt = ref<string | null>(null);

const editing = computed((): boolean => {
  return route.name === 'modal_poll_edit';
});

const titleKey = computed((): string => {
  if (editing.value) {
    return 'poll.edit';
  }
  return 'poll.create';
});

const fieldsDisabled = computed((): boolean => {
  return busy.value || !ready.value;
});

const addOptionDisabled = computed((): boolean => {
  return fieldsDisabled.value || options.value.length >= 20;
});

const anonymityDisabled = computed((): boolean => {
  return fieldsDisabled.value || editing.value;
});

const deadlineDisabled = computed((): boolean => {
  return fieldsDisabled.value || closed.value;
});

const submitDisabled = computed((): boolean => {
  return busy.value || !valid.value;
});

const deadlineErrorId = computed((): string | undefined => {
  if (validDeadline.value) {
    return undefined;
  }
  return 'poll-deadline-error';
});

const submitLabel = computed((): string => {
  if (!ready.value) {
    return 'poll.loading';
  }
  if (editing.value) {
    if (busy.value) {
      return 'poll.saving';
    }
    return 'poll.save';
  }
  if (busy.value) {
    return 'poll.creating';
  }
  return 'poll.publish';
});

async function mounted(): Promise<void> {
  clockTimer.value = setInterval(() => {
    now.value = Date.now();
    minEndTime.value = DateTime.local().toFormat('yyyy-MM-dd\'T\'HH:mm');
  }, 1000);
  minEndTime.value = DateTime.local().toFormat('yyyy-MM-dd\'T\'HH:mm');
  endTime.value = DateTime.local()
    .plus({
      hours: 1,
    })
    .toFormat('yyyy-MM-dd\'T\'HH:mm');
  let isPermitted = authStore.can.createOwn('poll').granted;
  if (editing.value) {
    isPermitted = authStore.can.updateAny('poll').granted;
  }
  if (!authStore.loggedIn || !isPermitted) {
    emit('close');
    return;
  }
  if (editing.value) {
    const isLoaded = await loadPoll();
    if (!isLoaded) {
      return;
    }
  }
  ready.value = true;
  await nextTick();
  questionInput.value?.focus();
}

async function loadPoll(): Promise<boolean> {
  busy.value = true;
  try {
    const { data } = await graphqlClient.query<GetPollQuery, GetPollQueryVariables>({
      query: GetPoll,
      variables: {
        messageId: Number(route.params.id),
      },
      fetchPolicy: 'no-cache',
    });
    const poll = data.getPoll;
    question.value = poll.question;
    options.value = poll.options.map(({ id, label }, key) => ({
      id,
      label,
      key,
    }));
    nextKey.value = options.value.length;
    isAnonymous.value = poll.isAnonymous;
    allowMultiple.value = poll.allowMultiple;
    allowChangeVote.value = poll.allowChangeVote;
    closed.value = poll.isClosed;
    originalEndsAt.value = poll.endsAt ?? null;
    hasDeadline.value = !!poll.endsAt;
    if (poll.endsAt) {
      endTime.value = DateTime.fromISO(poll.endsAt).toFormat('yyyy-MM-dd\'T\'HH:mm');
    }
    return true;
  } catch {
    error.value = t('poll.load_error');
    return false;
  } finally {
    busy.value = false;
  }
}

function cleanup(): void {
  if (clockTimer.value) {
    clearInterval(clockTimer.value);
  }
}

async function focusOption(index: number): Promise<void> {
  await nextTick();
  const inputs = (instance.proxy!.$el as HTMLElement).querySelectorAll<HTMLInputElement>(':scope .poll-modal__option [contenteditable="true"]');
  const input = inputs[index];
  input?.focus();
}

function onQuestionChange({ html }: { html: string }): void {
  question.value = html;
}

function onOptionChange(option: PollFormOption, { html }: { html: string }): void {
  option.label = html;
}

function addOption(): void {
  if (addOptionDisabled.value) {
    return;
  }
  options.value.push({ id: null, label: '', key: nextKey.value });
  nextKey.value += 1;
  focusOption(options.value.length - 1);
}

function removeOption(index: number): void {
  if (fieldsDisabled.value || options.value.length <= 1) {
    return;
  }
  options.value.splice(index, 1);
  const nextIndex = Math.min(index, options.value.length - 1);
  focusOption(nextIndex);
}

const valid = computed((): boolean => {
  if (!ready.value || !validDeadline.value) {
    return false;
  }
  const trimmedQuestion = pollText(question.value).trim();
  if (!trimmedQuestion || trimmedQuestion.length > 300) {
    return false;
  }
  const optionCount = options.value.length;
  if (optionCount < 1 || optionCount > 20) {
    return false;
  }
  for (const option of options.value) {
    const label = pollText(option.label).trim();
    if (!label || label.length > 100) {
      return false;
    }
  }
  return !duplicateOptions.value;
});

const validDeadline = computed((): boolean => {
  if (!hasDeadline.value || closed.value) {
    return true;
  }
  const deadline = DateTime.fromISO(endTime.value);
  if (!deadline.isValid) {
    return false;
  }
  return deadline.toMillis() > now.value;
});

const endsAt = computed((): string | null => {
  if (closed.value) {
    return originalEndsAt.value;
  }
  if (!hasDeadline.value) {
    return null;
  }
  return DateTime.fromISO(endTime.value).toISO();
});

const duplicateOptions = computed((): boolean => {
  const labels = new Set<string>();
  for (const option of options.value) {
    const label = pollText(option.label).trim()
      .toLowerCase();
    if (!label) {
      continue;
    }
    if (labels.has(label)) {
      return true;
    }
    labels.add(label);
  }
  return false;
});

const pollSettings = computed((): Pick<CreatePollMutationVariables, 'question' | 'allowMultiple' | 'allowChangeVote' | 'endsAt'> => {
  return {
    question: question.value.trim(),
    allowMultiple: allowMultiple.value,
    allowChangeVote: allowChangeVote.value,
    endsAt: endsAt.value,
  };
});

async function createPollMessage(): Promise<CreatePollMutation['createPoll'] | undefined> {
  const preparedOptions = options.value.map((option) => option.label.trim());
  const variables: CreatePollMutationVariables = {
    ...pollSettings.value,
    isAnonymous: isAnonymous.value,
    options: preparedOptions,
  };
  const { data } = await graphqlClient.mutate<CreatePollMutation, CreatePollMutationVariables>({
    mutation: CreatePoll,
    variables,
  });
  return data?.createPoll;
}

async function updatePollMessage(): Promise<UpdatePollMutation['updatePoll'] | undefined> {
  const preparedOptions = options.value.map(({ id, label }) => ({
    id,
    label: label.trim(),
  }));
  const variables: UpdatePollMutationVariables = {
    ...pollSettings.value,
    messageId: Number(route.params.id),
    options: preparedOptions,
  };
  const { data } = await graphqlClient.mutate<UpdatePollMutation, UpdatePollMutationVariables>({
    mutation: UpdatePoll,
    variables,
  });
  return data?.updatePoll;
}

async function submitPoll(): Promise<void> {
  if (submitDisabled.value) {
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    let message: CreatePollMutation['createPoll'] | undefined;
    if (editing.value) {
      message = await updatePollMessage();
    } else {
      message = await createPollMessage();
    }
    if (!message) {
      throw new Error('No poll returned');
    }
    messagesStore.upsertMessage(new Message(message));
    events.emit('force-scroll');
    emit('close');
  } catch {
    let errorKey = 'poll.create_error';
    if (editing.value) {
      errorKey = 'poll.update_error';
    }
    error.value = t(errorKey);
  } finally {
    busy.value = false;
  }
}

onMounted(mounted);

onBeforeUnmount(cleanup);
</script>

<style lang="scss" src="./poll-modal.scss">
</style>
