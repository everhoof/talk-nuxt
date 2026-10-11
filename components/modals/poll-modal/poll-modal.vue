<template>
  <b-modal trap-focus :close-label="$t('poll.close_dialog')" @close="$emit('close', $event)">
    <template #title>{{ $t(titleKey) }}</template>
    <template #default>
      <form class="poll-modal" @submit.prevent="submitPoll">
        <div class="poll-modal__body scrollbar">
          <div class="poll-modal__field">
            <label class="poll-modal__label" for="poll-question">
              {{ $t('poll.question') }}
              <span aria-hidden="true">*</span>
            </label>
            <input
              id="poll-question"
              ref="questionInput"
              v-model="question"
              class="poll-modal__input"
              :placeholder="$t('poll.question_placeholder')"
              maxlength="300"
              required
              :disabled="fieldsDisabled"
            />
          </div>
          <div class="poll-modal__options" role="group" aria-labelledby="poll-options-label">
            <div class="poll-modal__options-header">
              <span id="poll-options-label" class="poll-modal__label">{{ $t('poll.options') }}</span>
              <span class="poll-modal__count">{{ options.length }} / 20</span>
            </div>
            <div class="poll-modal__options-list">
              <div v-for="(option, index) in options" :key="option.key" class="poll-modal__option">
                <label :for="`poll-option-${option.key}`" class="poll-modal__option-label">
                  {{ $t('poll.option', { number: index + 1 }) }}
                </label>
                <input
                  :id="`poll-option-${option.key}`"
                  v-model="option.label"
                  class="poll-modal__input"
                  :placeholder="$t('poll.option', { number: index + 1 })"
                  maxlength="100"
                  required
                  :disabled="fieldsDisabled"
                />
                <b-button
                  v-if="options.length > 1"
                  type="button"
                  class="poll-modal__remove"
                  :aria-label="$t('poll.remove_option', { number: index + 1 })"
                  :disabled="fieldsDisabled"
                  @click="removeOption(index)"
                >
                  <svg-icon name="close" aria-hidden="true" />
                </b-button>
              </div>
            </div>
            <div>
              <b-poll-button type="button" secondary :disabled="addOptionDisabled" @click="addOption">
                <svg-icon name="plus" aria-hidden="true" />
                <span>{{ $t('poll.add_option') }}</span>
              </b-poll-button>
            </div>
          </div>
          <p v-if="duplicateOptions" class="poll-modal__error" role="alert">
            {{ $t('poll.duplicate_options') }}
          </p>
          <p v-if="editing" class="poll-modal__hint">{{ $t('poll.edit_hint') }}</p>
          <div class="poll-modal__settings">
            <b-switch
              id="poll-is-anonymous"
              class="poll-modal__setting"
              :checked.sync="isAnonymous"
              :disabled="anonymityDisabled"
            >
              {{ $t('poll.anonymous') }}
            </b-switch>
            <p v-if="isAnonymous" class="poll-modal__hint">{{ $t('poll.anonymous_hint') }}</p>
            <p v-if="editing" class="poll-modal__hint">{{ $t('poll.anonymous_immutable') }}</p>
            <b-switch
              id="poll-allow-multiple"
              class="poll-modal__setting"
              :checked.sync="allowMultiple"
              :disabled="fieldsDisabled"
            >
              {{ $t('poll.allow_multiple') }}
            </b-switch>
            <b-switch
              id="poll-allow-change-vote"
              class="poll-modal__setting"
              :checked.sync="allowChangeVote"
              :disabled="fieldsDisabled"
            >
              {{ $t('poll.allow_change_vote') }}
            </b-switch>
            <b-switch
              id="poll-has-deadline"
              class="poll-modal__setting"
              :checked.sync="hasDeadline"
              :disabled="deadlineDisabled"
            >
              {{ $t('poll.set_deadline') }}
            </b-switch>
            <div v-if="hasDeadline" class="poll-modal__field">
              <label for="poll-ends-at" class="poll-modal__label">
                {{ $t('poll.end_time') }}
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
            <p
              v-if="hasDeadline && !validDeadline"
              id="poll-deadline-error"
              class="poll-modal__error"
              role="alert"
            >
              {{ $t('poll.end_time_error') }}
            </p>
          </div>
          <p v-if="error" class="poll-modal__error" role="alert">{{ error }}</p>
        </div>
        <div class="poll-modal__actions">
          <b-poll-button type="button" secondary @click="$emit('close')">
            {{ $t('poll.cancel') }}
          </b-poll-button>
          <b-poll-button type="submit" :disabled="submitDisabled">{{ $t(submitLabel) }}</b-poll-button>
        </div>
      </form>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import BModal from '~/components/modals/modal/modal.vue';
import BButton from '~/components/button/button.vue';
import BPollButton from '~/components/poll-button/poll-button.vue';
import BSwitch from '~/components/switch/switch.vue';
import CreatePoll from '~/graphql/mutations/create-poll.graphql';
import UpdatePoll from '~/graphql/mutations/update-poll.graphql';
import GetPoll from '~/graphql/queries/get-poll.graphql';
import {
  CreatePollMutation,
  CreatePollMutationVariables,
  GetPollQuery,
  GetPollQueryVariables,
  UpdatePollMutation,
  UpdatePollMutationVariables,
} from '~/graphql/schema';
import { Message } from '~/types/message';

interface PollFormOption {
  id: number | null;
  key: number;
  label: string;
}

@Component({
  name: 'b-poll-modal',
  components: {
    BModal,
    BButton,
    BPollButton,
    BSwitch,
  },
})
export default class PollModal extends Vue {
  @Ref() questionInput!: HTMLInputElement;

  question = '';
  options: PollFormOption[] = [
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
  ];
  nextKey = 2;
  isAnonymous = false;
  clockTimer: ReturnType<typeof setInterval> | null = null;
  now = Date.now();
  busy = false;
  ready = false;
  error = '';
  allowMultiple = false;
  allowChangeVote = false;
  hasDeadline = false;
  endTime = '';
  minEndTime = '';
  closed = false;
  originalEndsAt: string | null = null;

  get editing(): boolean {
    return this.$route.name === 'modal_poll_edit';
  }

  get titleKey(): string {
    if (this.editing) {
      return 'poll.edit';
    }

    return 'poll.create';
  }

  get fieldsDisabled(): boolean {
    return this.busy || !this.ready;
  }

  get addOptionDisabled(): boolean {
    return this.fieldsDisabled || this.options.length >= 20;
  }

  get anonymityDisabled(): boolean {
    return this.fieldsDisabled || this.editing;
  }

  get deadlineDisabled(): boolean {
    return this.fieldsDisabled || this.closed;
  }

  get submitDisabled(): boolean {
    return this.busy || !this.valid;
  }

  get deadlineErrorId(): string | undefined {
    if (this.validDeadline) {
      return undefined;
    }

    return 'poll-deadline-error';
  }

  get submitLabel(): string {
    if (!this.ready) {
      return 'poll.loading';
    }

    if (this.editing) {
      if (this.busy) {
        return 'poll.saving';
      }

      return 'poll.save';
    }

    if (this.busy) {
      return 'poll.creating';
    }

    return 'poll.publish';
  }

  async mounted(): Promise<void> {
    this.clockTimer = setInterval(() => {
      this.now = Date.now();
      this.minEndTime = DateTime.local().toFormat("yyyy-MM-dd'T'HH:mm");
    }, 1000);
    this.minEndTime = DateTime.local().toFormat("yyyy-MM-dd'T'HH:mm");
    this.endTime = DateTime.local()
      .plus({
        hours: 1,
      })
      .toFormat("yyyy-MM-dd'T'HH:mm");

    let permitted = this.$accessor.auth.can.createOwn('poll').granted;

    if (this.editing) {
      permitted = this.$accessor.auth.can.updateAny('poll').granted;
    }

    if (!this.$accessor.auth.loggedIn || !permitted) {
      this.$emit('close');

      return;
    }

    if (this.editing) {
      const loaded = await this.loadPoll();

      if (!loaded) {
        return;
      }
    }

    this.ready = true;
    await this.$nextTick();
    this.questionInput.focus();
  }

  async loadPoll(): Promise<boolean> {
    this.busy = true;

    try {
      const { data } = await this.$apollo.query<GetPollQuery, GetPollQueryVariables>({
        query: GetPoll,
        variables: {
          messageId: Number(this.$route.params.id),
        },
        fetchPolicy: 'no-cache',
      });

      const poll = data.getPoll;

      this.question = poll.question;
      this.options = poll.options.map(({ id, label }, key) => ({
        id,
        label,
        key,
      }));
      this.nextKey = this.options.length;
      this.isAnonymous = poll.isAnonymous;
      this.allowMultiple = poll.allowMultiple;
      this.allowChangeVote = poll.allowChangeVote;
      this.closed = poll.isClosed;
      this.originalEndsAt = poll.endsAt ?? null;
      this.hasDeadline = !!poll.endsAt;

      if (poll.endsAt) {
        this.endTime = DateTime.fromISO(poll.endsAt).toFormat("yyyy-MM-dd'T'HH:mm");
      }

      return true;
    } catch (_error) {
      this.error = this.$t('poll.load_error').toString();

      return false;
    } finally {
      this.busy = false;
    }
  }

  beforeDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  async focusOption(index: number): Promise<void> {
    await this.$nextTick();

    const inputs = this.$el.querySelectorAll<HTMLInputElement>('.poll-modal__option input');
    const input = inputs[index];
    input?.focus();
  }

  addOption(): void {
    if (this.addOptionDisabled) {
      return;
    }

    this.options.push({ id: null, label: '', key: this.nextKey });
    this.nextKey += 1;
    this.focusOption(this.options.length - 1);
  }

  removeOption(index: number): void {
    if (this.fieldsDisabled || this.options.length <= 1) {
      return;
    }

    this.options.splice(index, 1);
    const nextIndex = Math.min(index, this.options.length - 1);
    this.focusOption(nextIndex);
  }

  get valid(): boolean {
    if (!this.ready || !this.validDeadline) {
      return false;
    }

    const question = this.question.trim();

    if (!question || this.question.length > 300) {
      return false;
    }

    const optionCount = this.options.length;

    if (optionCount < 1 || optionCount > 20) {
      return false;
    }

    for (const option of this.options) {
      const label = option.label.trim();

      if (!label || option.label.length > 100) {
        return false;
      }
    }

    return !this.duplicateOptions;
  }

  get validDeadline(): boolean {
    if (!this.hasDeadline || this.closed) {
      return true;
    }

    const deadline = DateTime.fromISO(this.endTime);

    if (!deadline.isValid) {
      return false;
    }

    return deadline.toMillis() > this.now;
  }

  get endsAt(): string | null {
    if (this.closed) {
      return this.originalEndsAt;
    }

    if (!this.hasDeadline) {
      return null;
    }

    return DateTime.fromISO(this.endTime).toISO();
  }

  get duplicateOptions(): boolean {
    const labels = new Set<string>();

    for (const option of this.options) {
      const label = option.label.trim().toLowerCase();

      if (!label) {
        continue;
      }

      if (labels.has(label)) {
        return true;
      }

      labels.add(label);
    }

    return false;
  }

  get pollSettings(): Pick<
    CreatePollMutationVariables,
    'question' | 'allowMultiple' | 'allowChangeVote' | 'endsAt'
  > {
    return {
      question: this.question.trim(),
      allowMultiple: this.allowMultiple,
      allowChangeVote: this.allowChangeVote,
      endsAt: this.endsAt,
    };
  }

  async createPollMessage(): Promise<CreatePollMutation['createPoll'] | undefined> {
    const options = this.options.map((option) => option.label.trim());
    const variables: CreatePollMutationVariables = {
      ...this.pollSettings,
      isAnonymous: this.isAnonymous,
      options,
    };
    const { data } = await this.$apollo.mutate<CreatePollMutation, CreatePollMutationVariables>({
      mutation: CreatePoll,
      variables,
    });

    return data?.createPoll;
  }

  async updatePollMessage(): Promise<UpdatePollMutation['updatePoll'] | undefined> {
    const options = this.options.map(({ id, label }) => ({
      id,
      label: label.trim(),
    }));
    const variables: UpdatePollMutationVariables = {
      ...this.pollSettings,
      messageId: Number(this.$route.params.id),
      options,
    };
    const { data } = await this.$apollo.mutate<UpdatePollMutation, UpdatePollMutationVariables>({
      mutation: UpdatePoll,
      variables,
    });

    return data?.updatePoll;
  }

  async submitPoll(): Promise<void> {
    if (this.submitDisabled) {
      return;
    }

    this.busy = true;
    this.error = '';

    try {
      let message: CreatePollMutation['createPoll'] | undefined;

      if (this.editing) {
        message = await this.updatePollMessage();
      } else {
        message = await this.createPollMessage();
      }

      if (!message) {
        throw new Error('No poll returned');
      }

      this.$accessor.messages.UPDATE_MESSAGE(new Message(message));
      this.$nuxt.$emit('force-scroll');
      this.$emit('close');
    } catch (_error) {
      let errorKey = 'poll.create_error';

      if (this.editing) {
        errorKey = 'poll.update_error';
      }

      this.error = this.$t(errorKey).toString();
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="stylus" src="./poll-modal.styl" />
