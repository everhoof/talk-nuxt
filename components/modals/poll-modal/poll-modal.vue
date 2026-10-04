<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>{{ $t(editing ? 'poll.edit' : 'poll.create') }}</template>
    <form class="poll-modal" @submit.prevent="submitPoll">
      <label class="poll-modal__label" for="poll-question">{{ $t('poll.question') }}</label>
      <input
        id="poll-question"
        ref="questionInput"
        v-model="question"
        class="poll-modal__input"
        :placeholder="$t('poll.question_placeholder')"
        maxlength="300"
        required
        :disabled="busy"
      />
      <p class="poll-modal__hint">{{ $t('poll.settings_hint') }}</p>
      <p v-if="editing" class="poll-modal__hint">{{ $t('poll.edit_hint') }}</p>
      <div v-for="(option, index) in options" :key="index" class="poll-modal__option">
        <label :for="`poll-option-${index}`" class="poll-modal__label">
          {{ $t('poll.option', { number: index + 1 }) }}
        </label>
        <div class="poll-modal__option-input">
          <input
            :id="`poll-option-${index}`"
            v-model="option.label"
            class="poll-modal__input"
            :placeholder="$t('poll.option', { number: index + 1 })"
            maxlength="100"
            required
            :disabled="busy"
          />
          <button
            v-if="options.length > 1"
            type="button"
            class="poll-modal__remove"
            :aria-label="$t('poll.remove_option', { number: index + 1 })"
            :disabled="busy"
            @click="removeOption(index)"
          >
            <svg-icon name="close" />
          </button>
        </div>
      </div>
      <b-button type="button" small :disabled="busy || options.length >= 20" @click="addOption">
        {{ $t('poll.add_option') }}
      </b-button>
      <div class="poll-modal__settings">
        <b-switch
          id="poll-allow-multiple"
          class="poll-modal__setting"
          :checked.sync="allowMultiple"
          :disabled="busy"
        >
          {{ $t('poll.allow_multiple') }}
        </b-switch>
        <b-switch
          id="poll-allow-change-vote"
          class="poll-modal__setting"
          :checked.sync="allowChangeVote"
          :disabled="busy"
        >
          {{ $t('poll.allow_change_vote') }}
        </b-switch>
        <b-switch
          id="poll-has-deadline"
          class="poll-modal__setting"
          :checked.sync="hasDeadline"
          :disabled="busy || closed"
        >
          {{ $t('poll.set_deadline') }}
        </b-switch>
        <template v-if="hasDeadline">
          <label for="poll-ends-at" class="poll-modal__label">{{ $t('poll.end_time') }}</label>
          <input
            id="poll-ends-at"
            v-model="endTime"
            class="poll-modal__input"
            type="datetime-local"
            :min="minEndTime"
            :disabled="busy || closed"
            required
          />
          <p v-if="endTime && !validDeadline" class="poll-modal__error">{{ $t('poll.end_time_error') }}</p>
        </template>
      </div>
      <p v-if="duplicateOptions" class="poll-modal__error" role="alert">{{ $t('poll.duplicate_options') }}</p>
      <p v-if="error" class="poll-modal__error" role="alert">{{ error }}</p>
      <div class="poll-modal__submit">
        <b-button class="poll-modal__publish" type="submit" width-full :disabled="busy || !valid">
          {{ $t(submitLabel) }}
        </b-button>
      </div>
    </form>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import BModal from '~/components/modals/modal/modal.vue';
import BButton from '~/components/button/button.vue';
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
  label: string;
}

@Component({
  name: 'b-poll-modal',
  components: {
    BModal,
    BButton,
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
    },
  ];
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
      this.question = data.getPoll.question;
      this.options = data.getPoll.options.map(({ id, label }) => ({
        id,
        label,
      }));
      this.allowMultiple = data.getPoll.allowMultiple;
      this.allowChangeVote = data.getPoll.allowChangeVote;
      this.closed = data.getPoll.isClosed;
      this.originalEndsAt = data.getPoll.endsAt ?? null;
      this.hasDeadline = !!data.getPoll.endsAt;

      if (data.getPoll.endsAt) {
        this.endTime = DateTime.fromISO(data.getPoll.endsAt).toFormat("yyyy-MM-dd'T'HH:mm");
      }

      return true;
    } catch (_error) {
      this.error = this.$t('poll.load_error').toString();

      return false;
    } finally {
      this.busy = false;
    }
  }

  addOption(): void {
    this.options.push({
      id: null,
      label: '',
    });
  }

  removeOption(index: number): void {
    this.options.splice(index, 1);
  }

  get valid(): boolean {
    const validQuestion = !!this.question.trim() && this.question.length <= 300;
    const validOptionCount = this.options.length >= 1 && this.options.length <= 20;
    const validOptionLabels = this.options.every(
      (option) => !!option.label.trim() && option.label.length <= 100,
    );

    return (
      this.ready &&
      this.validDeadline &&
      validQuestion &&
      validOptionCount &&
      validOptionLabels &&
      !this.duplicateOptions
    );
  }

  get validDeadline(): boolean {
    if (!this.hasDeadline || this.closed) {
      return true;
    }

    const deadline = DateTime.fromISO(this.endTime);

    return deadline.isValid && deadline.toMillis() > Date.now();
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
    const options = this.options.map((option) => option.label.trim().toLowerCase()).filter(Boolean);

    return new Set(options).size !== options.length;
  }

  async submitPoll(): Promise<void> {
    if (this.busy || !this.valid) {
      return;
    }

    this.busy = true;
    this.error = '';

    try {
      const variables = {
        question: this.question.trim(),
        allowMultiple: this.allowMultiple,
        allowChangeVote: this.allowChangeVote,
        endsAt: this.endsAt,
      };
      let message: CreatePollMutation['createPoll'] | undefined;

      if (this.editing) {
        const { data } = await this.$apollo.mutate<UpdatePollMutation, UpdatePollMutationVariables>({
          mutation: UpdatePoll,
          variables: {
            ...variables,
            messageId: Number(this.$route.params.id),
            options: this.options.map(({ id, label }) => ({
              id,
              label: label.trim(),
            })),
          },
        });
        message = data?.updatePoll;
      } else {
        const { data } = await this.$apollo.mutate<CreatePollMutation, CreatePollMutationVariables>({
          mutation: CreatePoll,
          variables: {
            ...variables,
            options: this.options.map((option) => option.label.trim()),
          },
        });
        message = data?.createPoll;
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
